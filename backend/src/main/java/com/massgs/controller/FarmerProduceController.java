package com.massgs.controller;

import com.massgs.dto.ProduceDto;
import com.massgs.entity.Crop;
import com.massgs.entity.Farmer;
import com.massgs.entity.MarketPrice;
import com.massgs.entity.ProduceListing;
import com.massgs.entity.User;
import com.massgs.repository.CropRepository;
import com.massgs.repository.FarmerRepository;
import com.massgs.repository.MarketPriceRepository;
import com.massgs.repository.ProduceListingRepository;
import com.massgs.repository.UserRepository;
import com.massgs.security.UserPrincipal;
import com.massgs.service.AuditService;
import com.massgs.service.CropKnowledgeService;
import com.massgs.service.MarketplaceWorkflowService;
import com.massgs.service.OtpAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/farmer")
@RequiredArgsConstructor
public class FarmerProduceController {

    private final ProduceListingRepository produceListingRepository;
    private final FarmerRepository farmerRepository;
    private final CropRepository cropRepository;
    private final MarketPriceRepository marketPriceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CropKnowledgeService cropKnowledgeService;
    private final MarketplaceWorkflowService workflowService;
    private final OtpAuthService otpAuthService;
    private final AuditService auditService;

    @PostMapping("/produce")
    public ResponseEntity<ProduceDto.ListingResponse> createProduceListing(@Valid @RequestBody ProduceDto.CreateListingRequest request) {
        Farmer farmer = resolveFarmer(request);

        CropKnowledgeService.CropSearchResult cropResult = cropKnowledgeService.resolveCropQuery(request.getCropName());
        Crop crop;
        if (cropResult.getCanonicalCrop() != null) {
            crop = cropResult.getCanonicalCrop();
        } else {
            crop = cropRepository.findByNameIgnoreCase(request.getCropName())
                    .orElseGet(() -> cropRepository.save(Crop.builder()
                            .name(request.getCropName())
                            .category("PERISHABLE")
                            .perishabilityDays(7)
                            .standardUnit("kg")
                            .build()));
        }

        ProduceListing listing = ProduceListing.builder()
                .farmer(farmer)
                .crop(crop)
                .varietyName(request.getVarietyName() != null ? request.getVarietyName() : "Standard Variety")
                .quantityKg(request.getQuantityKg())
                .quantityUnit(request.getQuantityUnit() != null ? request.getQuantityUnit() : "kg")
                .expectedPricePerUnit(request.getExpectedPricePerUnit())
                .priceUnit(request.getPriceUnit() != null ? request.getPriceUnit() : "kg")
                .readyDate(request.getReadyDate())
                .locationVillage(request.getVillage())
                .locationMandal(request.getMandal())
                .locationDistrict(request.getDistrict())
                .locationState(request.getState())
                .qualityGrade(request.getQualityGrade() != null ? request.getQualityGrade() : "A")
                .description(request.getDescription())
                .photoUrl(request.getPhotoUrl())
                .userProvidedTransportCostPerKg(request.getUserProvidedTransportCostPerKg())
                .status("AVAILABLE")
                .build();

        listing = produceListingRepository.save(listing);

        auditService.logAction(farmer.getUser().getId(), "PRODUCE_LISTING_CREATED", "ProduceListing", listing.getId(),
                "Farmer " + farmer.getMassgsId() + " listed " + listing.getQuantityKg() + " kg of " + crop.getName() + " in " + listing.getLocationDistrict());

        return ResponseEntity.ok(mapToResponse(listing));
    }

    @GetMapping("/produce")
    public ResponseEntity<List<ProduceDto.ListingResponse>> getFarmerListings(
            @RequestParam(required = false) Long farmerId,
            @RequestParam(required = false) String crop,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String query) {

        List<ProduceListing> listings;
        if (farmerId != null) {
            listings = produceListingRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        } else if (query != null && !query.isBlank()) {
            listings = produceListingRepository.searchActiveListings(query.trim());
        } else {
            listings = produceListingRepository.findByStatusOrderByCreatedAtDesc("AVAILABLE");
            if (listings.isEmpty()) {
                listings = produceListingRepository.findAll();
            }
        }

        if (crop != null && !crop.isBlank()) {
            listings = listings.stream()
                    .filter(l -> l.getCrop().getName().equalsIgnoreCase(crop) ||
                                (l.getCrop().getTeluguName() != null && l.getCrop().getTeluguName().equalsIgnoreCase(crop)))
                    .collect(Collectors.toList());
        }

        if (district != null && !district.isBlank()) {
            listings = listings.stream()
                    .filter(l -> l.getLocationDistrict().equalsIgnoreCase(district))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(listings.stream().map(this::mapToResponse).collect(Collectors.toList()));
    }

    @GetMapping("/produce/{id}")
    public ResponseEntity<ProduceDto.ListingResponse> getProduceListingById(@PathVariable Long id) {
        ProduceListing listing = produceListingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produce listing not found: " + id));
        return ResponseEntity.ok(mapToResponse(listing));
    }

    private Farmer resolveFarmer(ProduceDto.CreateListingRequest request) {
        if (request.getFarmerId() != null) {
            return farmerRepository.findById(request.getFarmerId())
                    .orElseThrow(() -> new IllegalArgumentException("Farmer with ID " + request.getFarmerId() + " not found"));
        }

        // Check if authenticated
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
            return farmerRepository.findByUserId(principal.getId())
                    .orElseGet(() -> {
                        User user = userRepository.findById(principal.getId()).orElseThrow();
                        String massgsId = user.getMassgsId() != null ? user.getMassgsId() : otpAuthService.generatePermanentMassgsId("ROLE_FARMER");
                        user.setMassgsId(massgsId);
                        userRepository.save(user);

                        return farmerRepository.save(Farmer.builder()
                                .massgsId(massgsId)
                                .user(user)
                                .district(request.getDistrict())
                                .state(request.getState())
                                .village(request.getVillage())
                                .mandal(request.getMandal())
                                .build());
                    });
        }

        // Check existing farmers in DB or create a real user profile for this submission
        return farmerRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    String massgsId = otpAuthService.generatePermanentMassgsId("ROLE_FARMER");
                    String farmerName = request.getFarmerName() != null ? request.getFarmerName() : "Registered Farmer";
                    String email = "farmer_" + UUID.randomUUID().toString().substring(0, 8) + "@massgs.in";
                    User newUser = userRepository.save(User.builder()
                            .massgsId(massgsId)
                            .email(email)
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .fullName(farmerName)
                            .role("ROLE_FARMER")
                            .phoneNumber(request.getContactPhone() != null ? request.getContactPhone() : "")
                            .district(request.getDistrict())
                            .state(request.getState())
                            .village(request.getVillage())
                            .mandal(request.getMandal())
                            .isPhoneVerified(true)
                            .build());

                    return farmerRepository.save(Farmer.builder()
                            .massgsId(massgsId)
                            .user(newUser)
                            .district(request.getDistrict())
                            .state(request.getState())
                            .village(request.getVillage())
                            .mandal(request.getMandal())
                            .preferredLanguage("en")
                            .build());
                });
    }

    private ProduceDto.ListingResponse mapToResponse(ProduceListing listing) {
        // Find latest verified mandi price for this crop & district
        BigDecimal modalPrice = null;
        String comparisonText = null;

        List<MarketPrice> prices = marketPriceRepository.findByCropIdOrderByArrivalDateDesc(listing.getCrop().getId());
        Optional<MarketPrice> recentPriceOpt = prices.stream()
                .filter(p -> p.getMarket().getDistrict().equalsIgnoreCase(listing.getLocationDistrict()))
                .findFirst();

        if (recentPriceOpt.isEmpty() && !prices.isEmpty()) {
            recentPriceOpt = Optional.of(prices.get(0));
        }

        if (recentPriceOpt.isPresent()) {
            MarketPrice mp = recentPriceOpt.get();
            modalPrice = mp.getModalPricePerKg();
            if (listing.getExpectedPricePerUnit() != null && modalPrice != null) {
                BigDecimal askingKg = listing.getExpectedPricePerUnit();
                if ("quintal".equalsIgnoreCase(listing.getPriceUnit())) {
                    askingKg = askingKg.divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                }
                BigDecimal diff = askingKg.subtract(modalPrice);
                if (diff.compareTo(BigDecimal.ZERO) > 0) {
                    comparisonText = "₹" + diff + "/kg above latest " + mp.getMarket().getMandiName() + " reference (₹" + modalPrice + "/kg, " + mp.getArrivalDate() + ")";
                } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
                    comparisonText = "₹" + diff.abs() + "/kg below latest " + mp.getMarket().getMandiName() + " reference (₹" + modalPrice + "/kg, " + mp.getArrivalDate() + ")";
                } else {
                    comparisonText = "Matches latest " + mp.getMarket().getMandiName() + " mandi modal price (₹" + modalPrice + "/kg, " + mp.getArrivalDate() + ")";
                }
            }
        }

        var trustProfile = workflowService.getUserTrustProfile(listing.getFarmer().getUser().getId());

        return ProduceDto.ListingResponse.builder()
                .id(listing.getId())
                .farmerId(listing.getFarmer().getId())
                .farmerMassgsId(listing.getFarmer().getMassgsId())
                .farmerName(listing.getFarmer().getUser().getFullName())
                .cropName(listing.getCrop().getName())
                .cropTeluguName(listing.getCrop().getTeluguName())
                .cropCategory(listing.getCrop().getCategory())
                .varietyName(listing.getVarietyName())
                .quantityKg(listing.getQuantityKg())
                .quantityUnit(listing.getQuantityUnit())
                .expectedPricePerUnit(listing.getExpectedPricePerUnit())
                .priceUnit(listing.getPriceUnit())
                .readyDate(listing.getReadyDate())
                .locationVillage(listing.getLocationVillage())
                .locationMandal(listing.getLocationMandal())
                .locationDistrict(listing.getLocationDistrict())
                .locationState(listing.getLocationState())
                .qualityGrade(listing.getQualityGrade())
                .description(listing.getDescription())
                .photoUrl(listing.getPhotoUrl())
                .status(listing.getStatus())
                .userProvidedTransportCostPerKg(listing.getUserProvidedTransportCostPerKg())
                .latestMandiModalPrice(modalPrice)
                .mandiComparisonText(comparisonText)
                .sellerTrust(trustProfile)
                .createdAt(listing.getCreatedAt())
                .build();
    }
}
