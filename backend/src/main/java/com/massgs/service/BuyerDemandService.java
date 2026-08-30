package com.massgs.service;

import com.massgs.dto.DemandDto;
import com.massgs.entity.Buyer;
import com.massgs.entity.BuyerRequirement;
import com.massgs.entity.Crop;
import com.massgs.entity.ProduceListing;
import com.massgs.entity.User;
import com.massgs.repository.BuyerRepository;
import com.massgs.repository.BuyerRequirementRepository;
import com.massgs.repository.CropRepository;
import com.massgs.repository.ProduceListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BuyerDemandService {

    private final BuyerRequirementRepository buyerRequirementRepository;
    private final BuyerRepository buyerRepository;
    private final CropRepository cropRepository;
    private final ProduceListingRepository produceListingRepository;
    private final CropKnowledgeService cropKnowledgeService;
    private final AuditService auditService;

    @Transactional
    public DemandDto.DemandResponse createDemand(DemandDto.CreateDemandRequest request, User currentUser) {
        Buyer buyer = buyerRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    String massgsId = "MASSGS-B-" + (100000 + (int)(Math.random() * 900000));
                    return buyerRepository.save(Buyer.builder()
                            .massgsId(massgsId)
                            .user(currentUser)
                            .organizationName(currentUser.getFullName() != null ? currentUser.getFullName() + " Agri Trading" : "Verified Platform Buyer")
                            .buyerType("LOCAL_BUYER")
                            .verifiedStatus("VERIFIED_PLATFORM")
                            .provenanceIndicator("Verified Platform Buyer")
                            .contactPhone(currentUser.getPhoneNumber())
                            .contactEmail(currentUser.getEmail())
                            .district(currentUser.getDistrict() != null ? currentUser.getDistrict() : (request.getTargetDistrict() != null ? request.getTargetDistrict() : "Guntur"))
                            .state(currentUser.getState() != null ? currentUser.getState() : "Andhra Pradesh")
                            .build());
                });

        CropKnowledgeService.CropSearchResult cropResult = cropKnowledgeService.resolveCropQuery(request.getCropName());
        Crop crop;
        if (cropResult.getCanonicalCrop() != null) {
            crop = cropResult.getCanonicalCrop();
        } else {
            crop = cropRepository.findByNameIgnoreCase(request.getCropName())
                    .orElseGet(() -> cropRepository.save(Crop.builder()
                            .name(request.getCropName())
                            .category("COMMERCIAL")
                            .perishabilityDays(30)
                            .standardUnit("kg")
                            .build()));
        }

        LocalDate validUntil = request.getValidUntil() != null ? request.getValidUntil() : LocalDate.now().plusDays(30);
        if (validUntil.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Demand expiry date cannot be in the past.");
        }

        BuyerRequirement demand = BuyerRequirement.builder()
                .buyer(buyer)
                .crop(crop)
                .minQuantityKg(request.getMinQuantityKg())
                .maxQuantityKg(request.getMaxQuantityKg())
                .targetPricePerKg(request.getTargetPricePerKg())
                .targetVillage(request.getTargetVillage())
                .targetMandal(request.getTargetMandal())
                .targetDistrict(request.getTargetDistrict() != null ? request.getTargetDistrict() : buyer.getDistrict())
                .targetState(request.getTargetState() != null ? request.getTargetState() : "Andhra Pradesh")
                .qualitySpecs(request.getQualitySpecs())
                .requiredByDate(request.getRequiredByDate() != null ? request.getRequiredByDate() : validUntil)
                .validUntil(validUntil)
                .status("ACTIVE")
                .build();

        demand = buyerRequirementRepository.save(demand);

        auditService.logAction(currentUser.getId(), "DEMAND_CREATED", "BuyerRequirement", demand.getId(),
                "Buyer " + buyer.getMassgsId() + " created demand for " + crop.getName() + " (" +
                demand.getMinQuantityKg() + "-" + demand.getMaxQuantityKg() + " kg) in " + demand.getTargetDistrict());

        return mapToResponse(demand);
    }

    public List<DemandDto.DemandResponse> getActiveDemands(String cropName, String district) {
        LocalDate today = LocalDate.now();
        List<BuyerRequirement> demands = buyerRequirementRepository.findAllActiveRequirements(today);

        if (cropName != null && !cropName.isBlank()) {
            demands = demands.stream()
                    .filter(d -> d.getCrop().getName().equalsIgnoreCase(cropName) ||
                                (d.getCrop().getTeluguName() != null && d.getCrop().getTeluguName().equalsIgnoreCase(cropName)))
                    .collect(Collectors.toList());
        }

        if (district != null && !district.isBlank()) {
            demands = demands.stream()
                    .filter(d -> d.getTargetDistrict() == null || d.getTargetDistrict().equalsIgnoreCase(district))
                    .collect(Collectors.toList());
        }

        return demands.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<DemandDto.DemandResponse> getBuyerDemands(Long buyerId) {
        return buyerRequirementRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Smart Recommendations: Recommend real buyers for a farmer's produce listing.
     * Uses ONLY genuine active unexpired demands.
     */
    public List<DemandDto.DemandRecommendationMatch> getRecommendationsForListing(Long listingId) {
        ProduceListing listing = produceListingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + listingId));

        LocalDate today = LocalDate.now();
        List<BuyerRequirement> activeDemands = buyerRequirementRepository.findActiveRequirementsForCrop(listing.getCrop().getId(), today);

        if (activeDemands.isEmpty()) {
            return Collections.emptyList();
        }

        List<DemandDto.DemandRecommendationMatch> matches = new ArrayList<>();

        for (BuyerRequirement d : activeDemands) {
            boolean cropMatch = true;
            boolean locationMatch = d.getTargetDistrict() != null &&
                    d.getTargetDistrict().equalsIgnoreCase(listing.getLocationDistrict());

            BigDecimal listingQty = listing.getQuantityKg();
            boolean quantityMatch = listingQty.compareTo(d.getMinQuantityKg()) >= 0 &&
                    (d.getMaxQuantityKg() == null || listingQty.compareTo(d.getMaxQuantityKg()) <= 0);

            StringBuilder reason = new StringBuilder();
            reason.append("Recommended because this buyer currently needs ").append(listing.getCrop().getName());
            
            if (locationMatch) {
                reason.append(", is located in your district (").append(listing.getLocationDistrict()).append(")");
            }
            if (quantityMatch) {
                reason.append(", and your lot size of ").append(listingQty).append(" kg fits their required range (")
                        .append(d.getMinQuantityKg()).append("-").append(d.getMaxQuantityKg()).append(" kg)");
            }
            reason.append(".");

            double score = 60.0;
            if (locationMatch) score += 25.0;
            if (quantityMatch) score += 15.0;

            matches.add(DemandDto.DemandRecommendationMatch.builder()
                    .demand(mapToResponse(d))
                    .matchReason(reason.toString())
                    .cropMatch(cropMatch)
                    .locationMatch(locationMatch)
                    .quantityMatch(quantityMatch)
                    .compatibilityScore(score)
                    .build());
        }

        matches.sort((a, b) -> Double.compare(b.getCompatibilityScore(), a.getCompatibilityScore()));
        return matches;
    }

    private DemandDto.DemandResponse mapToResponse(BuyerRequirement d) {
        return DemandDto.DemandResponse.builder()
                .id(d.getId())
                .buyerId(d.getBuyer().getId())
                .buyerMassgsId(d.getBuyer().getMassgsId())
                .organizationName(d.getBuyer().getOrganizationName())
                .buyerType(d.getBuyer().getBuyerType())
                .verifiedStatus(d.getBuyer().getVerifiedStatus())
                .cropId(d.getCrop().getId())
                .cropName(d.getCrop().getName())
                .cropTeluguName(d.getCrop().getTeluguName())
                .minQuantityKg(d.getMinQuantityKg())
                .maxQuantityKg(d.getMaxQuantityKg())
                .targetPricePerKg(d.getTargetPricePerKg())
                .targetVillage(d.getTargetVillage())
                .targetMandal(d.getTargetMandal())
                .targetDistrict(d.getTargetDistrict())
                .targetState(d.getTargetState())
                .qualitySpecs(d.getQualitySpecs())
                .requiredByDate(d.getRequiredByDate())
                .validUntil(d.getValidUntil())
                .status(d.getStatus())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
