package com.massgs.service.ingestion;

import com.massgs.entity.*;
import com.massgs.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
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
    private final AgmarknetLiveApiDataProvider liveApiDataProvider;

    @Value("${agmarknet.ingestion.stale-threshold-hours:48}")
    private int staleThresholdHours;

    @PostConstruct
    public void initDataSources() {
        try {
            ensureDataSourceExists();
            ensureSeedCrops();
            // Automatically ingest authentic data on startup so system is ready
            ingestMarketData(null, null);
        } catch (Exception e) {
            log.error("Failed to initialize Agmarknet data sources", e);
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
        return ingestMarketData(null, null);
    }

    @Transactional
    public DataIngestionRun ingestMarketData(String commodity, String state) {
        log.info("Starting AGMARKNET verified data ingestion pipeline for commodity: {}, state: {}...", commodity, state);
        DataSourceInfo dataSource = ensureDataSourceExists();

        DataIngestionRun run = DataIngestionRun.builder()
                .dataSource(dataSource)
                .executionTimestamp(LocalDateTime.now())
                .status("IN_PROGRESS")
                .recordsProcessed(0)
                .recordsFailed(0)
                .logDetails("Ingesting verified records via MarketDataProvider...")
                .build();
        run = dataIngestionRunRepository.save(run);

        int processed = 0;
        int failed = 0;

        try {
            List<MarketDataProvider.RawMarketRecord> rawRecords = liveApiDataProvider.fetchMarketRecords(commodity, state);

            for (MarketDataProvider.RawMarketRecord rec : rawRecords) {
                try {
                    processMarketRecord(rec);
                    processed++;
                } catch (Exception ex) {
                    log.error("Failed to process market record: {}", rec.getMarket(), ex);
                    failed++;
                }
            }

            int totalCount = (int) marketPriceRepository.count();
            int staleCount = (int) marketPriceRepository.findAll().stream()
                    .filter(p -> "STALE".equalsIgnoreCase(p.getDataQualityStatus()))
                    .count();

            dataSource.setLastSuccessfulIngestion(LocalDateTime.now());
            dataSource.setTotalRecordCount(totalCount);
            dataSource.setStaleRecordCount(staleCount);
            dataSource.setStatus(totalCount > 0 ? "CONNECTED" : "DEGRADED");
            dataSourceRepository.save(dataSource);

            run.setStatus(failed > 0 && processed == 0 ? "FAILED" : "SUCCESS");
            run.setRecordsProcessed(processed);
            run.setRecordsFailed(failed);
            run.setLogDetails("Processed " + processed + " verified records (" + failed + " failed).");
            log.info("Ingestion completed. Processed: {}, Failed: {}, Total in DB: {}", processed, failed, totalCount);

        } catch (Exception e) {
            log.error("Ingestion pipeline exception", e);
            run.setStatus("FAILED");
            run.setRecordsFailed(failed);
            run.setLogDetails("Ingestion error: " + e.getMessage());
        }

        return dataIngestionRunRepository.save(run);
    }

    private void processMarketRecord(MarketDataProvider.RawMarketRecord rec) {
        BigDecimal minKg = normalizeToKg(rec.getMinPricePerUnit(), rec.getReportedUnit());
        BigDecimal maxKg = normalizeToKg(rec.getMaxPricePerUnit(), rec.getReportedUnit());
        BigDecimal modalKg = normalizeToKg(rec.getModalPricePerUnit(), rec.getReportedUnit());

        // Find or create Market
        Market market = marketRepository.findByMandiNameAndDistrictAndState(rec.getMarket(), rec.getDistrict(), rec.getState())
                .orElseGet(() -> marketRepository.save(Market.builder()
                        .mandiName(rec.getMarket())
                        .district(rec.getDistrict())
                        .state(rec.getState())
                        .build()));

        // Find or create Crop
        Crop crop = cropRepository.findByNameIgnoreCase(rec.getCommodity())
                .orElseGet(() -> cropRepository.save(Crop.builder()
                        .name(rec.getCommodity())
                        .category("PERISHABLE")
                        .perishabilityDays(7)
                        .standardUnit("kg")
                        .build()));

        // Quality check
        String qualityStatus = "VERIFIED";
        long daysOld = ChronoUnit.DAYS.between(rec.getArrivalDate(), LocalDate.now());
        if (daysOld > 2) {
            qualityStatus = "STALE";
        }

        // Deduplication & Upsert
        Optional<MarketPrice> existing = marketPriceRepository
                .findByMarketIdAndCropIdAndArrivalDateAndVarietyName(market.getId(), crop.getId(), rec.getArrivalDate(), rec.getVariety());

        if (existing.isPresent()) {
            MarketPrice mp = existing.get();
            mp.setMinPricePerKg(minKg);
            mp.setMaxPricePerKg(maxKg);
            mp.setModalPricePerKg(modalKg);
            mp.setDataQualityStatus(qualityStatus);
            mp.setSourceIdentifier(rec.getSourceUrl());
            marketPriceRepository.save(mp);
        } else {
            marketPriceRepository.save(MarketPrice.builder()
                    .market(market)
                    .crop(crop)
                    .varietyName(rec.getVariety())
                    .minPricePerKg(minKg)
                    .maxPricePerKg(maxKg)
                    .modalPricePerKg(modalKg)
                    .arrivalDate(rec.getArrivalDate())
                    .dataSourceName("AGMARKNET")
                    .sourceIdentifier(rec.getSourceUrl())
                    .dataQualityStatus(qualityStatus)
                    .build());
        }
    }

    private BigDecimal normalizeToKg(BigDecimal price, String unit) {
        if (price == null) return BigDecimal.ZERO;
        if ("Quintal".equalsIgnoreCase(unit) || "quintals".equalsIgnoreCase(unit)) {
            return price.divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        } else if ("Tonne".equalsIgnoreCase(unit) || "Ton".equalsIgnoreCase(unit)) {
            return price.divide(new BigDecimal("1000"), 2, RoundingMode.HALF_UP);
        }
        return price.setScale(2, RoundingMode.HALF_UP);
    }
}
