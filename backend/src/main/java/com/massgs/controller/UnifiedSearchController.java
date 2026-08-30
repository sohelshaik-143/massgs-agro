package com.massgs.controller;

import com.massgs.dto.DemandDto;
import com.massgs.dto.ProduceDto;
import com.massgs.entity.*;
import com.massgs.repository.*;
import com.massgs.service.BuyerDemandService;
import com.massgs.service.CropKnowledgeService;
import com.massgs.service.LocationService;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class UnifiedSearchController {

    private final CropKnowledgeService cropKnowledgeService;
    private final LocationService locationService;
    private final ProduceListingRepository produceListingRepository;
    private final BuyerDemandService buyerDemandService;
    private final MarketPriceRepository marketPriceRepository;

    @GetMapping("/unified")
    public ResponseEntity<UnifiedSearchResult> searchAll(@RequestParam(required = false) String query) {
        if (query == null || query.trim().isBlank()) {
            return ResponseEntity.ok(UnifiedSearchResult.builder()
                    .query("")
                    .crops(Collections.emptyList())
                    .locations(Collections.emptyList())
                    .listings(Collections.emptyList())
                    .demands(Collections.emptyList())
                    .build());
        }

        String clean = query.trim();

        // 1. Crops
        CropKnowledgeService.CropSearchResult cropResult = cropKnowledgeService.resolveCropQuery(clean);
        List<Crop> matchingCrops = new ArrayList<>();
        String suggestion = null;
        if (cropResult.getCanonicalCrop() != null) {
            matchingCrops.add(cropResult.getCanonicalCrop());
            if ("UNCERTAIN_SUGGESTION".equals(cropResult.getStatus())) {
                suggestion = cropResult.getSuggestionPrompt();
            }
        } else if (cropResult.getAllSuggestions() != null) {
            matchingCrops.addAll(cropResult.getAllSuggestions());
        }

        // 2. Locations
        List<Location> locations = locationService.search(clean).stream().limit(10).toList();

        // 3. Active Listings
        List<ProduceListing> listings = produceListingRepository.searchActiveListings(clean).stream().limit(10).toList();
        List<ProduceDto.ListingResponse> listingResponses = listings.stream().map(l -> ProduceDto.ListingResponse.builder()
                .id(l.getId())
                .farmerId(l.getFarmer().getId())
                .farmerMassgsId(l.getFarmer().getMassgsId())
                .farmerName(l.getFarmer().getUser().getFullName())
                .cropName(l.getCrop().getName())
                .cropTeluguName(l.getCrop().getTeluguName())
                .quantityKg(l.getQuantityKg())
                .expectedPricePerUnit(l.getExpectedPricePerUnit())
                .priceUnit(l.getPriceUnit())
                .locationVillage(l.getLocationVillage())
                .locationMandal(l.getLocationMandal())
                .locationDistrict(l.getLocationDistrict())
                .locationState(l.getLocationState())
                .qualityGrade(l.getQualityGrade())
                .photoUrl(l.getPhotoUrl())
                .status(l.getStatus())
                .createdAt(l.getCreatedAt())
                .build()).toList();

        // 4. Active Demands
        List<DemandDto.DemandResponse> demandResponses = buyerDemandService.getActiveDemands(clean, null);
        if (demandResponses.isEmpty()) {
            demandResponses = buyerDemandService.getActiveDemands(null, clean);
        }

        return ResponseEntity.ok(UnifiedSearchResult.builder()
                .query(clean)
                .suggestionPrompt(suggestion)
                .crops(matchingCrops)
                .locations(locations)
                .listings(listingResponses)
                .demands(demandResponses)
                .build());
    }

    @Getter
    @Builder
    public static class UnifiedSearchResult {
        private String query;
        private String suggestionPrompt;
        private List<Crop> crops;
        private List<Location> locations;
        private List<ProduceDto.ListingResponse> listings;
        private List<DemandDto.DemandResponse> demands;
    }
}
