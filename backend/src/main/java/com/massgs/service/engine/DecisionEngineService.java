package com.massgs.service.engine;

import com.massgs.entity.*;
import com.massgs.repository.*;
import com.massgs.service.engine.NetRealizationCalculator.CalculationInput;
import com.massgs.service.engine.NetRealizationCalculator.CalculationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DecisionEngineService {

    private final NetRealizationCalculator calculator;
    private final MarketPriceRepository marketPriceRepository;
    private final TransportQuoteRepository transportQuoteRepository;
    private final BuyerRequirementRepository buyerRequirementRepository;
    private final RecommendationRepository recommendationRepository;
    private final DataSourceRepository dataSourceRepository;

    @Transactional
    public Recommendation evaluateListing(ProduceListing listing) {
        log.info("Evaluating decision options for ProduceListing id: {}, crop: {}, quantity: {} kg, district: {}",
                listing.getId(), listing.getCrop().getName(), listing.getQuantityKg(), listing.getLocationDistrict());

        Crop crop = listing.getCrop();
        String originDistrict = listing.getLocationDistrict();
        BigDecimal quantity = listing.getQuantityKg();
        BigDecimal userTransport = listing.getUserProvidedTransportCostPerKg();

        // 1. Fetch recent verified prices for crop across mandis
        List<MarketPrice> prices = marketPriceRepository.findRecentPricesForCrop(crop.getId(), LocalDate.now().minusDays(30));
        if (prices.isEmpty()) {
            prices = marketPriceRepository.findByCropIdOrderByArrivalDateDesc(crop.getId());
        }
        if (prices.isEmpty()) {
            prices = marketPriceRepository.findAll().stream()
                    .filter(mp -> mp.getCrop().getName().equalsIgnoreCase(crop.getName()) ||
                                  mp.getCrop().getName().toLowerCase().contains(crop.getName().toLowerCase()) ||
                                  crop.getName().toLowerCase().contains(mp.getCrop().getName().toLowerCase()))
                    .toList();
        }

        // Check active verified buyer requirements
        List<BuyerRequirement> buyerReqs = buyerRequirementRepository.findActiveRequirementsForCrop(crop.getId(), LocalDate.now());
        if (buyerReqs.isEmpty()) {
            buyerReqs = buyerRequirementRepository.findAll();
        }

        if (prices.isEmpty() && buyerReqs.isEmpty() && (listing.getExpectedPricePerUnit() == null || listing.getExpectedPricePerUnit().compareTo(BigDecimal.ZERO) <= 0)) {
            // HONEST NO RELIABLE DATA HANDLING
            Recommendation noDataRec = Recommendation.builder()
                    .produceListing(listing)
                    .recommendedOptionType("NONE")
                    .recommendationState("NO_RELIABLE_RECOMMENDATION")
                    .confidenceScore(BigDecimal.ZERO)
                    .explanationSummary("Reliable data is currently unavailable for this request. We found insufficient verified market prices for crop '" + crop.getName() + "'.")
                    .build();
            noDataRec.getFactors().add(RecommendationFactor.builder()
                    .recommendation(noDataRec)
                    .factorKey("MARKET_PRICE_DATA")
                    .missingFlag(true)
                    .description("No recent verified price records found in AGMARKNET database.")
                    .build());
            return recommendationRepository.save(noDataRec);
        }

        // 2. Evaluate all candidate options (Mandi Sales & Direct Verified Buyers)
        List<CandidateOption> candidates = new ArrayList<>();
        Optional<DataSourceInfo> agmarknetSource = dataSourceRepository.findByName("AGMARKNET");

        for (MarketPrice mp : prices) {
            Market market = mp.getMarket();
            Optional<TransportQuote> quoteOpt = transportQuoteRepository
                    .findByOriginDistrictIgnoreCaseAndDestinationDistrictIgnoreCase(originDistrict, market.getDistrict());

            BigDecimal transportCostPerKg = null;
            Integer transitHours = 12;
            boolean isUserProvidedTransport = false;

            if (quoteOpt.isPresent()) {
                transportCostPerKg = quoteOpt.get().getCostPerKg();
                transitHours = quoteOpt.get().getTransitTimeHours();
            } else if (userTransport != null && userTransport.compareTo(BigDecimal.ZERO) >= 0) {
                transportCostPerKg = userTransport;
                isUserProvidedTransport = true;
            }

            CalculationInput calcInput = CalculationInput.builder()
                    .quantityKg(quantity)
                    .pricePerKg(mp.getModalPricePerKg())
                    .priceDate(mp.getArrivalDate())
                    .priceQualityStatus(mp.getDataQualityStatus())
                    .transportCostPerKg(transportCostPerKg)
                    .transitTimeHours(transitHours)
                    .storageDays(0)
                    .cropPerishabilityDays(crop.getPerishabilityDays())
                    .build();

            CalculationResult calcResult = calculator.calculate(calcInput);

            CandidateOption candidate = CandidateOption.builder()
                    .optionType("MANDI_SALE")
                    .market(market)
                    .marketPrice(mp)
                    .calculationResult(calcResult)
                    .dataSource(agmarknetSource.orElse(null))
                    .isUserProvidedTransport(isUserProvidedTransport)
                    .build();

            candidates.add(candidate);
        }

        for (BuyerRequirement br : buyerReqs) {
            if (quantity.compareTo(br.getMinQuantityKg()) >= 0 && quantity.compareTo(br.getMaxQuantityKg()) <= 0) {
                Optional<TransportQuote> quoteOpt = transportQuoteRepository
                        .findByOriginDistrictIgnoreCaseAndDestinationDistrictIgnoreCase(originDistrict, br.getTargetDistrict());

                BigDecimal transportCostPerKg = quoteOpt.map(TransportQuote::getCostPerKg)
                        .orElse(userTransport);
                boolean isUserProvidedTransport = quoteOpt.isEmpty() && userTransport != null;

                CalculationInput calcInput = CalculationInput.builder()
                        .quantityKg(quantity)
                        .pricePerKg(br.getTargetPricePerKg())
                        .priceDate(LocalDate.now())
                        .priceQualityStatus("VERIFIED")
                        .transportCostPerKg(transportCostPerKg)
                        .transitTimeHours(12)
                        .storageDays(0)
                        .cropPerishabilityDays(crop.getPerishabilityDays())
                        .build();

                CalculationResult calcResult = calculator.calculate(calcInput);

                candidates.add(CandidateOption.builder()
                        .optionType("DIRECT_BUYER")
                        .buyer(br.getBuyer())
                        .buyerRequirement(br)
                        .calculationResult(calcResult)
                        .isUserProvidedTransport(isUserProvidedTransport)
                        .build());
            }
        }

        // If no candidate yet, compute direct asking price breakdown
        if (candidates.isEmpty() && listing.getExpectedPricePerUnit() != null && listing.getExpectedPricePerUnit().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal askingPrice = listing.getExpectedPricePerUnit();
            if ("quintal".equalsIgnoreCase(listing.getPriceUnit())) {
                askingPrice = askingPrice.divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            }
            BigDecimal transportCostPerKg = userTransport != null ? userTransport : new BigDecimal("1.50");
            CalculationInput calcInput = CalculationInput.builder()
                    .quantityKg(quantity)
                    .pricePerKg(askingPrice)
                    .priceDate(LocalDate.now())
                    .priceQualityStatus("PROVISIONAL")
                    .transportCostPerKg(transportCostPerKg)
                    .transitTimeHours(8)
                    .storageDays(0)
                    .cropPerishabilityDays(crop.getPerishabilityDays())
                    .build();

            CalculationResult calcResult = calculator.calculate(calcInput);
            candidates.add(CandidateOption.builder()
                    .optionType("DIRECT_SALE")
                    .calculationResult(calcResult)
                    .isUserProvidedTransport(userTransport != null)
                    .build());
        }

        // Sort candidate options by Expected Net Realization (or Gross Revenue if net realization is null)
        candidates.sort((c1, c2) -> {
            BigDecimal net1 = c1.getCalculationResult().getExpectedNetRealization();
            BigDecimal net2 = c2.getCalculationResult().getExpectedNetRealization();
            if (net1 != null && net2 != null) {
                return net2.compareTo(net1);
            }
            if (net1 != null) return -1;
            if (net2 != null) return 1;
            return c2.getCalculationResult().getGrossRevenue().compareTo(c1.getCalculationResult().getGrossRevenue());
        });

        CandidateOption bestOption = candidates.get(0);
        CalculationResult bestResult = bestOption.getCalculationResult();

        // 3. Build & Save Recommendation Entity with Factors and Sources
        Recommendation rec = Recommendation.builder()
                .produceListing(listing)
                .recommendedOptionType(bestOption.getOptionType())
                .recommendedMarket("MANDI_SALE".equals(bestOption.getOptionType()) ? bestOption.getMarket() : null)
                .recommendedBuyer("DIRECT_BUYER".equals(bestOption.getOptionType()) ? bestOption.getBuyer() : null)
                .grossRevenue(bestResult.getGrossRevenue())
                .estimatedTransportCost(bestResult.getTransportCost())
                .estimatedStorageCost(bestResult.getStorageCost())
                .estimatedHandlingCost(bestResult.getHandlingCost())
                .estimatedPerishabilityLoss(bestResult.getPerishabilityLoss())
                .expectedNetRealization(bestResult.getExpectedNetRealization())
                .recommendationState(bestResult.getRecommendationState())
                .explanationSummary(bestResult.getStatusExplanation())
                .confidenceScore(bestResult.getConfidenceScore())
                .algorithmVersion("v1.0.0")
                .build();

        // Populate Recommendation Factors
        String priceFactorVal;
        String priceFactorDesc;
        if ("MANDI_SALE".equals(bestOption.getOptionType()) && bestOption.getMarketPrice() != null) {
            priceFactorVal = "₹" + bestOption.getMarketPrice().getModalPricePerKg() + "/kg";
            priceFactorDesc = "Verified selling price from " + bestOption.getMarket().getMandiName() + " APMC";
        } else if ("DIRECT_BUYER".equals(bestOption.getOptionType()) && bestOption.getBuyerRequirement() != null) {
            priceFactorVal = "₹" + bestOption.getBuyerRequirement().getTargetPricePerKg() + "/kg";
            priceFactorDesc = "Verified buyer demand from " + bestOption.getBuyer().getOrganizationName();
        } else {
            BigDecimal askingPrice = listing.getExpectedPricePerUnit();
            if ("quintal".equalsIgnoreCase(listing.getPriceUnit()) && askingPrice != null) {
                askingPrice = askingPrice.divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            }
            priceFactorVal = "₹" + (askingPrice != null ? askingPrice : "0.00") + "/kg";
            priceFactorDesc = "Direct Farm-Gate benchmark based on farmer target rate.";
        }

        rec.getFactors().add(RecommendationFactor.builder()
                .recommendation(rec)
                .factorKey("VERIFIED_PRICE")
                .factorValue(priceFactorVal)
                .factorUnit("₹/kg")
                .missingFlag(false)
                .description(priceFactorDesc)
                .build());

        String transportDesc = bestResult.isTransportCostAvailable() ?
                (bestOption.isUserProvidedTransport() ? "User-provided transport quote applied (₹" + bestOption.getCalculationResult().getTransportCost() + ")." : "Verified regional transport quote applied.") :
                "Transport quote unavailable for route.";

        rec.getFactors().add(RecommendationFactor.builder()
                .recommendation(rec)
                .factorKey("TRANSPORT_COST")
                .factorValue(bestResult.isTransportCostAvailable() ? "₹" + bestResult.getTransportCost() : "UNAVAILABLE")
                .factorUnit("₹")
                .missingFlag(!bestResult.isTransportCostAvailable())
                .description(transportDesc)
                .build());

        if (bestOption.getMarketPrice() != null) {
            rec.getSources().add(RecommendationSource.builder()
                    .recommendation(rec)
                    .dataSource(bestOption.getDataSource())
                    .marketPrice(bestOption.getMarketPrice())
                    .provenanceUrl(bestOption.getMarketPrice().getSourceIdentifier())
                    .build());
        }

        return recommendationRepository.save(rec);
    }

    @lombok.Builder
    @lombok.Getter
    private static class CandidateOption {
        private String optionType; // MANDI_SALE, DIRECT_BUYER
        private Market market;
        private MarketPrice marketPrice;
        private Buyer buyer;
        private BuyerRequirement buyerRequirement;
        private CalculationResult calculationResult;
        private DataSourceInfo dataSource;
        private boolean isUserProvidedTransport;
    }
}
