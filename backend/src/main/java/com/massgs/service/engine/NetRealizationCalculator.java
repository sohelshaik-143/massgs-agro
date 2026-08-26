package com.massgs.service.engine;

import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class NetRealizationCalculator {

    public static final BigDecimal HANDLING_FEE_PER_KG = new BigDecimal("0.30"); // Standard Mandi Handling Fee
    public static final BigDecimal APMC_CESS_PERCENTAGE = new BigDecimal("0.01"); // 1% APMC Market Fee
    public static final BigDecimal STORAGE_PER_KG_PER_DAY = new BigDecimal("0.15"); // ₹0.15/kg/day standard cold/dry storage

    @Getter
    @Builder
    public static class CalculationInput {
        private BigDecimal quantityKg;
        private BigDecimal pricePerKg;
        private LocalDate priceDate;
        private String priceQualityStatus; // VERIFIED, PARTIALLY_VERIFIED, STALE
        private BigDecimal transportCostPerKg; // null if unknown
        private Integer transitTimeHours;
        private Integer storageDays;
        private Integer cropPerishabilityDays;
    }

    @Getter
    @Builder
    public static class CalculationResult {
        private BigDecimal grossRevenue;
        private BigDecimal transportCost;
        private boolean transportCostAvailable;
        private BigDecimal storageCost;
        private BigDecimal handlingCost;
        private BigDecimal apmcMarketFee;
        private BigDecimal perishabilityLoss;
        private BigDecimal expectedNetRealization;
        private String recommendationState; // RECOMMENDED, LIMITED_CONFIDENCE, NO_RELIABLE_RECOMMENDATION
        private BigDecimal confidenceScore; // 0.00 to 100.00
        private String statusExplanation;
    }

    public CalculationResult calculate(CalculationInput input) {
        if (input == null || input.getQuantityKg() == null || input.getQuantityKg().compareTo(BigDecimal.ZERO) <= 0) {
            return CalculationResult.builder()
                    .recommendationState("NO_RELIABLE_RECOMMENDATION")
                    .confidenceScore(BigDecimal.ZERO)
                    .statusExplanation("Quantity must be greater than zero.")
                    .build();
        }

        if (input.getPricePerKg() == null || input.getPricePerKg().compareTo(BigDecimal.ZERO) <= 0) {
            return CalculationResult.builder()
                    .recommendationState("NO_RELIABLE_RECOMMENDATION")
                    .confidenceScore(BigDecimal.ZERO)
                    .statusExplanation("Verified market price is unavailable for this crop and location.")
                    .build();
        }

        BigDecimal qty = input.getQuantityKg();
        BigDecimal price = input.getPricePerKg();
        BigDecimal grossRevenue = qty.multiply(price).setScale(2, RoundingMode.HALF_UP);

        // Handling Cost
        BigDecimal handlingCost = qty.multiply(HANDLING_FEE_PER_KG).setScale(2, RoundingMode.HALF_UP);

        // APMC Market Fee
        BigDecimal apmcFee = grossRevenue.multiply(APMC_CESS_PERCENTAGE).setScale(2, RoundingMode.HALF_UP);

        // Storage Cost
        int storageDays = input.getStorageDays() != null ? Math.max(0, input.getStorageDays()) : 0;
        BigDecimal storageCost = qty.multiply(STORAGE_PER_KG_PER_DAY).multiply(new BigDecimal(storageDays))
                .setScale(2, RoundingMode.HALF_UP);

        // Transport Cost Availability
        boolean transportCostAvailable = (input.getTransportCostPerKg() != null && input.getTransportCostPerKg().compareTo(BigDecimal.ZERO) >= 0);
        BigDecimal transportCost = BigDecimal.ZERO;
        if (transportCostAvailable) {
            transportCost = qty.multiply(input.getTransportCostPerKg()).setScale(2, RoundingMode.HALF_UP);
        }

        // Perishability Loss calculation
        BigDecimal lossPercentage = BigDecimal.ZERO;
        if (input.getCropPerishabilityDays() != null && input.getCropPerishabilityDays() > 0) {
            long daysOld = 0;
            if (input.getPriceDate() != null) {
                daysOld = Math.max(0, ChronoUnit.DAYS.between(input.getPriceDate(), LocalDate.now()));
            }
            long totalDelayDays = daysOld + storageDays;
            if (totalDelayDays > input.getCropPerishabilityDays()) {
                // Perishability penalty factor
                double fractionOver = (double)(totalDelayDays - input.getCropPerishabilityDays()) / input.getCropPerishabilityDays();
                lossPercentage = new BigDecimal(Math.min(0.30, fractionOver * 0.15)).setScale(4, RoundingMode.HALF_UP);
            }
        }
        BigDecimal perishabilityLoss = grossRevenue.multiply(lossPercentage).setScale(2, RoundingMode.HALF_UP);

        // Net Realization Calculation
        BigDecimal expectedNetRealization = null;
        String recState;
        BigDecimal confidenceScore;
        StringBuilder explanation = new StringBuilder();

        boolean isPriceStale = "STALE".equalsIgnoreCase(input.getPriceQualityStatus()) ||
                (input.getPriceDate() != null && ChronoUnit.DAYS.between(input.getPriceDate(), LocalDate.now()) > 2);

        if (!transportCostAvailable) {
            recState = "LIMITED_CONFIDENCE";
            confidenceScore = new BigDecimal("50.00");
            explanation.append("Verified transport pricing is unavailable for this route. ");
            explanation.append("Gross revenue is ₹").append(grossRevenue).append(", but final net realization cannot be calculated reliably without transport cost.");
        } else if (isPriceStale) {
            expectedNetRealization = grossRevenue.subtract(transportCost).subtract(storageCost)
                    .subtract(handlingCost).subtract(apmcFee).subtract(perishabilityLoss)
                    .setScale(2, RoundingMode.HALF_UP);
            recState = "LIMITED_CONFIDENCE";
            confidenceScore = new BigDecimal("65.00");
            explanation.append("Market price data is older than 48 hours. ");
            explanation.append("Estimated net realization is ₹").append(expectedNetRealization).append(" (subject to market price freshness).");
        } else {
            expectedNetRealization = grossRevenue.subtract(transportCost).subtract(storageCost)
                    .subtract(handlingCost).subtract(apmcFee).subtract(perishabilityLoss)
                    .setScale(2, RoundingMode.HALF_UP);
            recState = "RECOMMENDED";
            confidenceScore = new BigDecimal("95.00");
            explanation.append("Sufficient verified data exists. Estimated net realization: ₹").append(expectedNetRealization).append(".");
        }

        return CalculationResult.builder()
                .grossRevenue(grossRevenue)
                .transportCost(transportCost)
                .transportCostAvailable(transportCostAvailable)
                .storageCost(storageCost)
                .handlingCost(handlingCost)
                .apmcMarketFee(apmcFee)
                .perishabilityLoss(perishabilityLoss)
                .expectedNetRealization(expectedNetRealization)
                .recommendationState(recState)
                .confidenceScore(confidenceScore)
                .statusExplanation(explanation.toString())
                .build();
    }
}
