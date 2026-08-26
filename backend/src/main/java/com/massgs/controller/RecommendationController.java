package com.massgs.controller;

import com.massgs.dto.RecommendationDto;
import com.massgs.entity.ProduceListing;
import com.massgs.entity.Recommendation;
import com.massgs.repository.ProduceListingRepository;
import com.massgs.repository.RecommendationRepository;
import com.massgs.service.engine.DecisionEngineService;
import com.massgs.service.engine.ExplainableRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final ProduceListingRepository produceListingRepository;
    private final DecisionEngineService decisionEngineService;
    private final ExplainableRecommendationService explainableService;
    private final RecommendationRepository recommendationRepository;

    @PostMapping
    public ResponseEntity<RecommendationDto.Response> generateRecommendation(@RequestParam Long produceListingId) {
        ProduceListing listing = produceListingRepository.findById(produceListingId)
                .orElseThrow(() -> new IllegalArgumentException("Produce listing not found: " + produceListingId));

        Recommendation recommendation = decisionEngineService.evaluateListing(listing);
        return ResponseEntity.ok(mapToResponse(recommendation));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecommendationDto.Response> getRecommendationById(@PathVariable Long id) {
        Recommendation rec = recommendationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recommendation not found: " + id));
        return ResponseEntity.ok(mapToResponse(rec));
    }

    @GetMapping("/listing/{listingId}")
    public ResponseEntity<RecommendationDto.Response> getLatestByListing(@PathVariable Long listingId) {
        Recommendation rec = recommendationRepository.findFirstByProduceListingIdOrderByCreatedAtDesc(listingId)
                .orElseGet(() -> {
                    ProduceListing listing = produceListingRepository.findById(listingId)
                            .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + listingId));
                    return decisionEngineService.evaluateListing(listing);
                });
        return ResponseEntity.ok(mapToResponse(rec));
    }

    private RecommendationDto.Response mapToResponse(Recommendation rec) {
        List<String> reasons = explainableService.buildDetailedReasons(rec);

        List<RecommendationDto.Factor> factors = rec.getFactors().stream().map(f -> RecommendationDto.Factor.builder()
                .factorKey(f.getFactorKey())
                .factorValue(f.getFactorValue())
                .factorUnit(f.getFactorUnit())
                .missingFlag(f.getMissingFlag())
                .description(f.getDescription())
                .build()).collect(Collectors.toList());

        List<RecommendationDto.Source> sources = rec.getSources().stream().map(s -> RecommendationDto.Source.builder()
                .dataSourceName(s.getDataSource() != null ? s.getDataSource().getName() : "AGMARKNET")
                .mandiName(s.getMarketPrice() != null ? s.getMarketPrice().getMarket().getMandiName() : "N/A")
                .provenanceUrl(s.getProvenanceUrl())
                .dataQualityStatus(s.getMarketPrice() != null ? s.getMarketPrice().getDataQualityStatus() : "VERIFIED")
                .fetchedAt(s.getFetchedAt())
                .build()).collect(Collectors.toList());

        boolean hasMissingTransport = rec.getFactors().stream()
                .anyMatch(f -> "TRANSPORT_COST".equals(f.getFactorKey()) && Boolean.TRUE.equals(f.getMissingFlag()));

        return RecommendationDto.Response.builder()
                .id(rec.getId())
                .produceListingId(rec.getProduceListing().getId())
                .cropName(rec.getProduceListing().getCrop().getName())
                .quantityKg(rec.getProduceListing().getQuantityKg())
                .recommendedOptionType(rec.getRecommendedOptionType())
                .recommendedMarketName(rec.getRecommendedMarket() != null ? rec.getRecommendedMarket().getMandiName() : null)
                .recommendedMarketDistrict(rec.getRecommendedMarket() != null ? rec.getRecommendedMarket().getDistrict() : null)
                .recommendedBuyerName(rec.getRecommendedBuyer() != null ? rec.getRecommendedBuyer().getOrganizationName() : null)
                .buyerProvenanceIndicator(rec.getRecommendedBuyer() != null ? rec.getRecommendedBuyer().getProvenanceIndicator() : "Verified Market Data")
                .grossRevenue(rec.getGrossRevenue())
                .estimatedTransportCost(rec.getEstimatedTransportCost())
                .transportCostAvailable(!hasMissingTransport)
                .estimatedStorageCost(rec.getEstimatedStorageCost())
                .estimatedHandlingCost(rec.getEstimatedHandlingCost())
                .estimatedPerishabilityLoss(rec.getEstimatedPerishabilityLoss())
                .expectedNetRealization(rec.getExpectedNetRealization())
                .recommendationState(rec.getRecommendationState())
                .explanationSummary(rec.getExplanationSummary())
                .detailedReasons(reasons)
                .confidenceScore(rec.getConfidenceScore())
                .createdAt(rec.getCreatedAt())
                .factors(factors)
                .sources(sources)
                .build();
    }
}
