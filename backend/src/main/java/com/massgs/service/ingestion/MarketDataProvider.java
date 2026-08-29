package com.massgs.service.ingestion;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface MarketDataProvider {

    String getProviderName();

    String getProviderUrl();

    boolean isLiveApiAvailable();

    List<RawMarketRecord> fetchMarketRecords(String commodity, String state);

    @Getter
    @Builder
    class RawMarketRecord {
        private String state;
        private String district;
        private String market;
        private String commodity;
        private String variety;
        private String grade;
        private LocalDate arrivalDate;
        private BigDecimal minPricePerUnit;
        private BigDecimal maxPricePerUnit;
        private BigDecimal modalPricePerUnit;
        private String reportedUnit; // "Quintal", "Tonne", "Kg"
        private String sourceUrl;
    }
}
