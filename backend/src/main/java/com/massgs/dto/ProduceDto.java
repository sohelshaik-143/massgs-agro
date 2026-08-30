package com.massgs.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProduceDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateListingRequest {
        private Long farmerId;
        private String farmerName;
        private String contactPhone;

        @NotNull
        private String cropName;

        private String varietyName;

        @NotNull
        private BigDecimal quantityKg;

        private String quantityUnit; // kg, quintal, tonne, bag_50kg

        private BigDecimal expectedPricePerUnit;
        private String priceUnit; // kg, quintal

        @NotNull
        private LocalDate readyDate;

        private String village;
        private String mandal;

        @NotNull
        private String district;

        @NotNull
        private String state;

        private String qualityGrade; // A, B, C
        private String description;
        private String photoUrl;

        private BigDecimal userProvidedTransportCostPerKg; // Optional user transport quote
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListingResponse {
        private Long id;
        private Long farmerId;
        private String farmerMassgsId;
        private String farmerName;
        private String cropName;
        private String cropTeluguName;
        private String cropCategory;
        private String varietyName;
        private BigDecimal quantityKg;
        private String quantityUnit;
        private BigDecimal expectedPricePerUnit;
        private String priceUnit;
        private LocalDate readyDate;
        private String locationVillage;
        private String locationMandal;
        private String locationDistrict;
        private String locationState;
        private String qualityGrade;
        private String description;
        private String photoUrl;
        private String status;
        private BigDecimal userProvidedTransportCostPerKg;
        private BigDecimal latestMandiModalPrice;
        private String mandiComparisonText;
        private MarketplaceDto.UserTrustProfile sellerTrust;
        private LocalDateTime createdAt;
    }
}
