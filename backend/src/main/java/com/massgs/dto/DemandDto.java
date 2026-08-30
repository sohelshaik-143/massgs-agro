package com.massgs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DemandDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateDemandRequest {
        private Long buyerId;

        @NotBlank
        private String cropName;

        @NotNull
        private BigDecimal minQuantityKg;

        @NotNull
        private BigDecimal maxQuantityKg;

        @NotNull
        private BigDecimal targetPricePerKg;

        private String targetVillage;
        private String targetMandal;
        private String targetDistrict;
        private String targetState;
        private String qualitySpecs;
        private LocalDate requiredByDate;

        @NotNull
        private LocalDate validUntil;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DemandResponse {
        private Long id;
        private Long buyerId;
        private String buyerMassgsId;
        private String organizationName;
        private String buyerType;
        private String verifiedStatus;
        private Long cropId;
        private String cropName;
        private String cropTeluguName;
        private BigDecimal minQuantityKg;
        private BigDecimal maxQuantityKg;
        private BigDecimal targetPricePerKg;
        private String targetVillage;
        private String targetMandal;
        private String targetDistrict;
        private String targetState;
        private String qualitySpecs;
        private LocalDate requiredByDate;
        private LocalDate validUntil;
        private String status;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DemandRecommendationMatch {
        private DemandResponse demand;
        private String matchReason;
        private boolean locationMatch;
        private boolean quantityMatch;
        private boolean cropMatch;
        private double compatibilityScore;
    }
}
