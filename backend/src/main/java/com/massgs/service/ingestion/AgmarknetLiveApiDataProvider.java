package com.massgs.service.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AgmarknetLiveApiDataProvider implements MarketDataProvider {

    @Value("${agmarknet.api.url:https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070}")
    private String apiUrl;

    @Value("${agmarknet.api.key:579b464db66ec23bdd000001cdd3946f1f4b42d740c06173a11684c3}")
    private String apiKey;

    private final ObjectMapper objectMapper;
    private final AgmarknetDatasetDataProvider datasetFallbackProvider;

    @Override
    public String getProviderName() {
        return "AGMARKNET_LIVE_API";
    }

    @Override
    public String getProviderUrl() {
        return apiUrl;
    }

    @Override
    public boolean isLiveApiAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public List<RawMarketRecord> fetchMarketRecords(String commodity, String state) {
        log.info("Attempting live API fetch from Open Government Data Platform (Data.gov.in)...");

        if (!isLiveApiAvailable()) {
            log.info("No API key configured for live endpoint. Delegating to verified dataset provider.");
            return datasetFallbackProvider.fetchMarketRecords(commodity, state);
        }

        try {
            RestTemplate restTemplate = new RestTemplateBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .readTimeout(Duration.ofSeconds(5))
                    .build();

            StringBuilder urlBuilder = new StringBuilder(apiUrl)
                    .append("?api-key=").append(apiKey)
                    .append("&format=json")
                    .append("&limit=50");

            if (state != null && !state.isBlank()) {
                urlBuilder.append("&filters[state]=").append(state);
            }
            if (commodity != null && !commodity.isBlank()) {
                urlBuilder.append("&filters[commodity]=").append(commodity);
            }

            ResponseEntity<String> response = restTemplate.getForEntity(urlBuilder.toString(), String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode recordsNode = root.path("records");

                if (recordsNode.isArray() && recordsNode.size() > 0) {
                    List<RawMarketRecord> records = new ArrayList<>();
                    for (JsonNode node : recordsNode) {
                        try {
                            String arrivalDateStr = node.path("arrival_date").asText();
                            LocalDate arrivalDate = parseFlexibleDate(arrivalDateStr);

                            BigDecimal minPrice = new BigDecimal(node.path("min_price").asText("0"));
                            BigDecimal maxPrice = new BigDecimal(node.path("max_price").asText("0"));
                            BigDecimal modalPrice = new BigDecimal(node.path("modal_price").asText("0"));

                            if (modalPrice.compareTo(BigDecimal.ZERO) <= 0) continue;

                            records.add(RawMarketRecord.builder()
                                    .state(node.path("state").asText())
                                    .district(node.path("district").asText())
                                    .market(node.path("market").asText())
                                    .commodity(node.path("commodity").asText())
                                    .variety(node.path("variety").asText("FAQ"))
                                    .grade(node.path("grade").asText("FAQ"))
                                    .arrivalDate(arrivalDate)
                                    .minPricePerUnit(minPrice)
                                    .maxPricePerUnit(maxPrice)
                                    .modalPricePerUnit(modalPrice)
                                    .reportedUnit("Quintal")
                                    .sourceUrl(apiUrl)
                                    .build());
                        } catch (Exception ex) {
                            log.warn("Skipping unparseable live API record: {}", node, ex);
                        }
                    }

                    if (!records.isEmpty()) {
                        log.info("Successfully fetched {} live records from Data.gov.in API", records.size());
                        return records;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Live API fetch failed or rate-limited: {}. Falling back to verified dataset.", e.getMessage());
        }

        return datasetFallbackProvider.fetchMarketRecords(commodity, state);
    }

    private LocalDate parseFlexibleDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            try {
                return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } catch (Exception ex) {
                return LocalDate.now();
            }
        }
    }
}
