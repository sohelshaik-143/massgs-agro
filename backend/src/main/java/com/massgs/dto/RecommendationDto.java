package com.massgs.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class RecommendationDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long produceListingId;
        private String cropName;
        private BigDecimal quantityKg;
        private String recommendedOptionType; // MANDI_SALE, DIRECT_BUYER
        private String recommendedMarketName;
        private String recommendedMarketDistrict;
        private String recommendedBuyerName;
        private String buyerProvenanceIndicator;
        private BigDecimal grossRevenue;
        private BigDecimal estimatedTransportCost;
        private boolean transportCostAvailable;
        private BigDecimal estimatedStorageCost;
        private BigDecimal estimatedHandlingCost;
        private BigDecimal estimatedPerishabilityLoss;
        private BigDecimal expectedNetRealization;
        private String recommendationState; // RECOMMENDED, LIMITED_CONFIDENCE, NO_RELIABLE_RECOMMENDATION
        private String explanationSummary;
        private List<String> detailedReasons;
        private BigDecimal confidenceScore;
        private LocalDateTime createdAt;
        private List<Factor> factors;
        private List<Source> sources;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Factor {
        private String factorKey;
        private String factorValue;
        private String factorUnit;
        private Boolean missingFlag;
        private String description;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Source {
        private String dataSourceName;
        private String mandiName;
        private String provenanceUrl;
        private String dataQualityStatus;
        private LocalDateTime fetchedAt;
    }
}
