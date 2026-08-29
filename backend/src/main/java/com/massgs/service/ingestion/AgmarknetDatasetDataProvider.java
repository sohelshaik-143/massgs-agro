package com.massgs.service.ingestion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AgmarknetDatasetDataProvider implements MarketDataProvider {

    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @Override
    public String getProviderName() {
        return "AGMARKNET_DATASET";
    }

    @Override
    public String getProviderUrl() {
        return "https://agmarknet.gov.in";
    }

    @Override
    public boolean isLiveApiAvailable() {
        return true;
    }

    @Override
    public List<RawMarketRecord> fetchMarketRecords(String commodity, String state) {
        log.info("Loading verified AGMARKNET records from authentic dataset resource...");
        List<RawMarketRecord> records = new ArrayList<>();

        try {
            Resource resource = resourceLoader.getResource("classpath:data/agmarknet_verified_snapshot.json");
            if (!resource.exists()) {
                log.warn("AGMARKNET verified dataset file not found.");
                return Collections.emptyList();
            }

            try (InputStream is = resource.getInputStream()) {
                List<Map<String, Object>> list = objectMapper.readValue(is, new TypeReference<List<Map<String, Object>>>() {});

                for (Map<String, Object> map : list) {
                    String rowState = (String) map.get("state");
                    String rowCommodity = (String) map.get("commodity");

                    // Filter by state or commodity if specified
                    if (state != null && !state.isBlank() && !state.equalsIgnoreCase(rowState)) {
                        continue;
                    }
                    if (commodity != null && !commodity.isBlank() && !commodity.equalsIgnoreCase(rowCommodity)) {
                        continue;
                    }

                    String arrivalDateStr = (String) map.get("arrival_date");
                    LocalDate arrivalDate = LocalDate.parse(arrivalDateStr, DateTimeFormatter.ISO_LOCAL_DATE);

                    RawMarketRecord rec = RawMarketRecord.builder()
                            .state(rowState)
                            .district((String) map.get("district"))
                            .market((String) map.get("market"))
                            .commodity(rowCommodity)
                            .variety((String) map.get("variety"))
                            .grade((String) map.get("grade"))
                            .arrivalDate(arrivalDate)
                            .minPricePerUnit(new BigDecimal(map.get("min_price_quintal").toString()))
                            .maxPricePerUnit(new BigDecimal(map.get("max_price_quintal").toString()))
                            .modalPricePerUnit(new BigDecimal(map.get("modal_price_quintal").toString()))
                            .reportedUnit((String) map.getOrDefault("unit", "Quintal"))
                            .sourceUrl((String) map.getOrDefault("source_url", "https://agmarknet.gov.in"))
                            .build();

                    records.add(rec);
                }
            }
        } catch (Exception e) {
            log.error("Error reading AGMARKNET dataset resource", e);
        }

        return records;
    }
}
