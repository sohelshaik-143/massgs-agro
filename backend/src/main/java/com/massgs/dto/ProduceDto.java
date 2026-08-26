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

        @NotNull
        private String cropName;

        private String varietyName;

        @NotNull
        private BigDecimal quantityKg;

        @NotNull
        private LocalDate readyDate;

        @NotNull
        private String district;

        @NotNull
        private String state;

        private String qualityGrade; // A, B, C
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListingResponse {
        private Long id;
        private Long farmerId;
        private String farmerName;
        private String cropName;
        private String cropCategory;
        private String varietyName;
        private BigDecimal quantityKg;
        private LocalDate readyDate;
        private String locationDistrict;
        private String locationState;
        private String qualityGrade;
        private String status;
        private LocalDateTime createdAt;
    }
}
