package com.massgs.service.engine;

import com.massgs.entity.Recommendation;
import com.massgs.entity.RecommendationFactor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExplainableRecommendationService {

    public List<String> buildDetailedReasons(Recommendation recommendation) {
        List<String> reasons = new ArrayList<>();

        if ("NO_RELIABLE_RECOMMENDATION".equalsIgnoreCase(recommendation.getRecommendationState())) {
            reasons.add("Insufficient verified market prices exist in the database for this crop and location.");
            reasons.add("The system prefers showing no recommendation over inventing unverified prices or buyers.");
            return reasons;
        }

        if ("MANDI_SALE".equalsIgnoreCase(recommendation.getRecommendedOptionType()) && recommendation.getRecommendedMarket() != null) {
            reasons.add("Mandi APMC '" + recommendation.getRecommendedMarket().getMandiName() + "' currently offers the highest verified modal price.");
        } else if ("DIRECT_BUYER".equalsIgnoreCase(recommendation.getRecommendedOptionType()) && recommendation.getRecommendedBuyer() != null) {
            reasons.add("Verified platform buyer '" + recommendation.getRecommendedBuyer().getOrganizationName() + "' offers a direct contract quote.");
        }

        boolean missingTransport = false;
        for (RecommendationFactor factor : recommendation.getFactors()) {
            if ("TRANSPORT_COST".equals(factor.getFactorKey()) && Boolean.TRUE.equals(factor.getMissingFlag())) {
                missingTransport = true;
                break;
            }
        }

        if (missingTransport) {
            reasons.add("WARNING: Verified transport quote is unavailable for your route. Gross revenue is ₹" +
                    recommendation.getGrossRevenue() + ", but final net realization cannot be calculated reliably until transport quote is entered.");
        } else if (recommendation.getExpectedNetRealization() != null) {
            reasons.add("Expected Net Realization of ₹" + recommendation.getExpectedNetRealization() +
                    " accounts for APMC market fees, handling charges, and verified transport costs.");
        }

        if (recommendation.getEstimatedPerishabilityLoss() != null && recommendation.getEstimatedPerishabilityLoss().compareTo(BigDecimal.ZERO) > 0) {
            reasons.add("Notice: Estimated perishability loss of ₹" + recommendation.getEstimatedPerishabilityLoss() +
                    " was applied due to commodity readiness and storage duration.");
        }

        return reasons;
    }
}
