package com.massgs.service.ingestion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.massgs.entity.*;
import com.massgs.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgmarknetIngestionService {

    private final DataSourceRepository dataSourceRepository;
    private final DataIngestionRunRepository dataIngestionRunRepository;
    private final MarketRepository marketRepository;
    private final CropRepository cropRepository;
    private final MarketPriceRepository marketPriceRepository;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @Value("${agmarknet.ingestion.stale-threshold-hours:48}")
    private int staleThresholdHours;

    @PostConstruct
    public void initDataSourcesAndSeed() {
        try {
            ensureDataSourceExists();
            ensureSeedCrops();
            ingestVerifiedSnapshot();
        } catch (Exception e) {
            log.error("Failed to initialize Agmarknet dataset ingestion", e);
        }
    }

    @Transactional
    public DataSourceInfo ensureDataSourceExists() {
        return dataSourceRepository.findByName("AGMARKNET")
                .orElseGet(() -> dataSourceRepository.save(DataSourceInfo.builder()
                        .name("AGMARKNET")
                        .providerUrl("https://agmarknet.gov.in")
                        .status("CONNECTED")
                        .lastSuccessfulIngestion(LocalDateTime.now())
                        .totalRecordCount(0)
                        .staleRecordCount(0)
                        .build()));
    }

    @Transactional
    public void ensureSeedCrops() {
        createCropIfMissing("Tomato", "PERISHABLE", 5);
        createCropIfMissing("Onion", "SEMI_PERISHABLE", 30);
        createCropIfMissing("Chilli", "SEMI_PERISHABLE", 60);
        createCropIfMissing("Rice", "STAPLE", 180);
    }

    private void createCropIfMissing(String name, String category, int perishabilityDays) {
        if (cropRepository.findByNameIgnoreCase(name).isEmpty()) {
            cropRepository.save(Crop.builder()
                    .name(name)
                    .category(category)
                    .perishabilityDays(perishabilityDays)
                    .standardUnit("kg")
                    .build());
        }
    }

    @Transactional
    public DataIngestionRun ingestVerifiedSnapshot() {
        log.info("Starting AGMARKNET verified dataset ingestion...");
        DataSourceInfo dataSource = ensureDataSourceExists();

        DataIngestionRun run = DataIngestionRun.builder()
                .dataSource(dataSource)
                .executionTimestamp(LocalDateTime.now())
                .status("IN_PROGRESS")
                .recordsProcessed(0)
                .recordsFailed(0)
                .logDetails("Ingesting verified snapshot from classpath resource...")
                .build();
        run = dataIngestionRunRepository.save(run);

        int processed = 0;
        int failed = 0;

        try {
            Resource resource = resourceLoader.getResource("classpath:data/agmarknet_verified_snapshot.json");
            if (!resource.exists()) {
                log.warn("Snapshot resource classpath:data/agmarknet_verified_snapshot.json not found!");
                run.setStatus("FAILED");
                run.setLogDetails("Snapshot file missing.");
                return dataIngestionRunRepository.save(run);
            }

            try (InputStream is = resource.getInputStream()) {
                List<Map<String, Object>> records = objectMapper.readValue(is, new TypeReference<List<Map<String, Object>>>() {});

                for (Map<String, Object> rec : records) {
                    try {
                        processSingleRecord(rec, dataSource);
                        processed++;
                    } catch (Exception ex) {
                        log.error("Failed to process AGMARKNET record: {}", rec, ex);
                        failed++;
                    }
                }
            }

            dataSource.setLastSuccessfulIngestion(LocalDateTime.now());
            dataSource.setTotalRecordCount((int) marketPriceRepository.count());
            dataSource.setStatus("CONNECTED");
            dataSourceRepository.save(dataSource);

            run.setStatus("SUCCESS");
            run.setRecordsProcessed(processed);
            run.setRecordsFailed(failed);
            run.setLogDetails("Successfully processed " + processed + " verified records (" + failed + " failed).");
            log.info("AGMARKNET dataset ingestion completed successfully. Processed: {}, Failed: {}", processed, failed);

        } catch (Exception e) {
            log.error("Error during snapshot ingestion", e);
            run.setStatus("FAILED");
            run.setRecordsFailed(failed);
            run.setLogDetails("Ingestion exception: " + e.getMessage());
        }

        return dataIngestionRunRepository.save(run);
    }

    private void processSingleRecord(Map<String, Object> rec, DataSourceInfo dataSource) {
        String state = (String) rec.get("state");
        String district = (String) rec.get("district");
        String marketName = (String) rec.get("market");
        String commodityName = (String) rec.get("commodity");
        String variety = (String) rec.get("variety");
        String arrivalDateStr = (String) rec.get("arrival_date");

        BigDecimal minQuintal = new BigDecimal(rec.get("min_price_quintal").toString());
        BigDecimal maxQuintal = new BigDecimal(rec.get("max_price_quintal").toString());
        BigDecimal modalQuintal = new BigDecimal(rec.get("modal_price_quintal").toString());

        // Convert Quintal to Kg (1 Quintal = 100 Kg)
        BigDecimal hundred = new BigDecimal("100");
        BigDecimal minKg = minQuintal.divide(hundred, 2, RoundingMode.HALF_UP);
        BigDecimal maxKg = maxQuintal.divide(hundred, 2, RoundingMode.HALF_UP);
        BigDecimal modalKg = modalQuintal.divide(hundred, 2, RoundingMode.HALF_UP);

        LocalDate arrivalDate = LocalDate.parse(arrivalDateStr, DateTimeFormatter.ISO_LOCAL_DATE);

        // Find or create Market
        Market market = marketRepository.findByMandiNameAndDistrictAndState(marketName, district, state)
                .orElseGet(() -> marketRepository.save(Market.builder()
                        .mandiName(marketName)
                        .district(district)
                        .state(state)
                        .build()));

        // Find Crop
        Crop crop = cropRepository.findByNameIgnoreCase(commodityName)
                .orElseGet(() -> cropRepository.save(Crop.builder()
                        .name(commodityName)
                        .category("PERISHABLE")
                        .perishabilityDays(7)
                        .standardUnit("kg")
                        .build()));

        // Freshness Check
        String qualityStatus = "VERIFIED";
        if (arrivalDate.isBefore(LocalDate.now().minusDays(2))) {
            qualityStatus = "STALE";
        }

        String sourceUrl = rec.containsKey("source_url") ? (String) rec.get("source_url") : "https://agmarknet.gov.in";

        // Save or Update Market Price record
        Optional<MarketPrice> existingPrice = marketPriceRepository
                .findByMarketIdAndCropIdAndArrivalDateAndVarietyName(market.getId(), crop.getId(), arrivalDate, variety);

        if (existingPrice.isPresent()) {
            MarketPrice mp = existingPrice.get();
            mp.setMinPricePerKg(minKg);
            mp.setMaxPricePerKg(maxKg);
            mp.setModalPricePerKg(modalKg);
            mp.setDataQualityStatus(qualityStatus);
            mp.setSourceIdentifier(sourceUrl);
            marketPriceRepository.save(mp);
        } else {
            marketPriceRepository.save(MarketPrice.builder()
                    .market(market)
                    .crop(crop)
                    .varietyName(variety)
                    .minPricePerKg(minKg)
                    .maxPricePerKg(maxKg)
                    .modalPricePerKg(modalKg)
                    .arrivalDate(arrivalDate)
                    .dataSourceName("AGMARKNET")
                    .sourceIdentifier(sourceUrl)
                    .dataQualityStatus(qualityStatus)
                    .build());
        }
    }
}
