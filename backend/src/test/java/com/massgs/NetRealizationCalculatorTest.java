package com.massgs;

import com.massgs.service.engine.NetRealizationCalculator;
import com.massgs.service.engine.NetRealizationCalculator.CalculationInput;
import com.massgs.service.engine.NetRealizationCalculator.CalculationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

public class NetRealizationCalculatorTest {

    private NetRealizationCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new NetRealizationCalculator();
    }

    @Test
    void testCalculateNetRealization_FullVerifiedData() {
        CalculationInput input = CalculationInput.builder()
                .quantityKg(new BigDecimal("1000.00"))
                .pricePerKg(new BigDecimal("25.00")) // Gross = 25000
                .priceDate(LocalDate.now())
                .priceQualityStatus("VERIFIED")
                .transportCostPerKg(new BigDecimal("2.50")) // Transport = 2500
                .transitTimeHours(12)
                .storageDays(0)
                .cropPerishabilityDays(7)
                .build();

        CalculationResult result = calculator.calculate(input);

        assertThat(result.getGrossRevenue()).isEqualByComparingTo("25000.00");
        assertThat(result.getTransportCost()).isEqualByComparingTo("2500.00");
        assertThat(result.getHandlingCost()).isEqualByComparingTo("300.00"); // 1000 * 0.30
        assertThat(result.getApmcMarketFee()).isEqualByComparingTo("250.00"); // 25000 * 0.01
        assertThat(result.getExpectedNetRealization()).isNotNull();
        assertThat(result.getRecommendationState()).isEqualTo("RECOMMENDED");
        assertThat(result.isTransportCostAvailable()).isTrue();
    }

    @Test
    void testCalculateNetRealization_MissingTransportCost() {
        CalculationInput input = CalculationInput.builder()
                .quantityKg(new BigDecimal("500.00"))
                .pricePerKg(new BigDecimal("30.00"))
                .priceDate(LocalDate.now())
                .priceQualityStatus("VERIFIED")
                .transportCostPerKg(null) // MISSING
                .storageDays(0)
                .cropPerishabilityDays(5)
                .build();

        CalculationResult result = calculator.calculate(input);

        assertThat(result.isTransportCostAvailable()).isFalse();
        assertThat(result.getExpectedNetRealization()).isNull();
        assertThat(result.getRecommendationState()).isEqualTo("LIMITED_CONFIDENCE");
        assertThat(result.getStatusExplanation()).contains("Verified transport pricing is unavailable");
    }

    @Test
    void testCalculateNetRealization_MissingPrice() {
        CalculationInput input = CalculationInput.builder()
                .quantityKg(new BigDecimal("1000.00"))
                .pricePerKg(null) // MISSING
                .build();

        CalculationResult result = calculator.calculate(input);

        assertThat(result.getRecommendationState()).isEqualTo("NO_RELIABLE_RECOMMENDATION");
        assertThat(result.getConfidenceScore()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
