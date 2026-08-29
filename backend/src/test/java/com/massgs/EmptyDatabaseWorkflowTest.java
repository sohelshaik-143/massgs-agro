package com.massgs;

import com.massgs.entity.*;
import com.massgs.repository.*;
import com.massgs.service.engine.DecisionEngineService;
import com.massgs.service.engine.NetRealizationCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class EmptyDatabaseWorkflowTest {

    @Mock
    private MarketPriceRepository marketPriceRepository;

    @Mock
    private TransportQuoteRepository transportQuoteRepository;

    @Mock
    private BuyerRequirementRepository buyerRequirementRepository;

    @Mock
    private RecommendationRepository recommendationRepository;

    @Mock
    private DataSourceRepository dataSourceRepository;

    private DecisionEngineService decisionEngineService;

    @BeforeEach
    void setUp() {
        NetRealizationCalculator calculator = new NetRealizationCalculator();
        decisionEngineService = new DecisionEngineService(
                calculator,
                marketPriceRepository,
                transportQuoteRepository,
                buyerRequirementRepository,
                recommendationRepository,
                dataSourceRepository
        );
    }

    @Test
    void testEvaluateListing_WhenNoMarketPricesExist_ReturnsNoReliableRecommendation() {
        Crop crop = Crop.builder().id(99L).name("Dragonfruit").category("EXOTIC").perishabilityDays(4).build();
        Farmer farmer = Farmer.builder().id(1L).district("Guntur").state("Andhra Pradesh").build();

        ProduceListing listing = ProduceListing.builder()
                .id(101L)
                .farmer(farmer)
                .crop(crop)
                .quantityKg(new BigDecimal("1000"))
                .locationDistrict("Guntur")
                .locationState("Andhra Pradesh")
                .readyDate(LocalDate.now())
                .build();

        when(marketPriceRepository.findRecentPricesForCrop(any(), any())).thenReturn(Collections.emptyList());
        when(recommendationRepository.save(any(Recommendation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Recommendation result = decisionEngineService.evaluateListing(listing);

        assertThat(result).isNotNull();
        assertThat(result.getRecommendationState()).isEqualTo("NO_RELIABLE_RECOMMENDATION");
        assertThat(result.getConfidenceScore()).isEqualTo(BigDecimal.ZERO);
        assertThat(result.getExplanationSummary()).contains("insufficient verified market prices");
        assertThat(result.getFactors()).anyMatch(f -> "MARKET_PRICE_DATA".equals(f.getFactorKey()) && Boolean.TRUE.equals(f.getMissingFlag()));
    }
}
