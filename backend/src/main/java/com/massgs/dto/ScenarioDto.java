package com.massgs.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class ScenarioDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimulationRequest {
        private Long produceListingId;
        private BigDecimal customTransportCostPerKg;
        private LocalDate customReadyDate;
        private Integer customStorageDays;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimulationResponse {
        private Long produceListingId;
        private String cropName;
        private BigDecimal quantityKg;
        private BigDecimal grossRevenue;
        private BigDecimal appliedTransportCost;
        private BigDecimal storageCost;
        private BigDecimal handlingCost;
        private BigDecimal apmcFee;
        private BigDecimal perishabilityLoss;
        private BigDecimal computedNetRealization;
        private String disclaimer;
    }
}
