package com.massgs.controller;

import com.massgs.dto.ProduceDto;
import com.massgs.entity.Crop;
import com.massgs.entity.Farmer;
import com.massgs.entity.ProduceListing;
import com.massgs.entity.User;
import com.massgs.repository.CropRepository;
import com.massgs.repository.FarmerRepository;
import com.massgs.repository.ProduceListingRepository;
import com.massgs.repository.UserRepository;
import com.massgs.security.UserPrincipal;
import com.massgs.service.AuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/farmer")
@RequiredArgsConstructor
public class FarmerProduceController {

    private final ProduceListingRepository produceListingRepository;
    private final FarmerRepository farmerRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @PostMapping("/produce")
    public ResponseEntity<ProduceDto.ListingResponse> createProduceListing(@Valid @RequestBody ProduceDto.CreateListingRequest request) {
        Farmer farmer = resolveFarmer(request);

        Crop crop = cropRepository.findByNameIgnoreCase(request.getCropName())
                .orElseGet(() -> cropRepository.save(Crop.builder()
                        .name(request.getCropName())
                        .category("PERISHABLE")
                        .perishabilityDays(7)
                        .standardUnit("kg")
                        .build()));

        ProduceListing listing = ProduceListing.builder()
                .farmer(farmer)
                .crop(crop)
                .varietyName(request.getVarietyName() != null ? request.getVarietyName() : "Standard Variety")
                .quantityKg(request.getQuantityKg())
                .readyDate(request.getReadyDate())
                .locationDistrict(request.getDistrict())
                .locationState(request.getState())
                .qualityGrade(request.getQualityGrade() != null ? request.getQualityGrade() : "A")
                .userProvidedTransportCostPerKg(request.getUserProvidedTransportCostPerKg())
                .status("AVAILABLE")
                .build();

        listing = produceListingRepository.save(listing);

        auditService.logAction(farmer.getUser().getId(), "PRODUCE_LISTING_CREATED", "ProduceListing", listing.getId(),
                "Farmer listed " + listing.getQuantityKg() + " kg of " + crop.getName() + " in " + listing.getLocationDistrict());

        return ResponseEntity.ok(mapToResponse(listing));
    }

    @GetMapping("/produce")
    public ResponseEntity<List<ProduceDto.ListingResponse>> getFarmerListings(@RequestParam(required = false) Long farmerId) {
        List<ProduceListing> listings;
        if (farmerId != null) {
            listings = produceListingRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        } else {
            listings = produceListingRepository.findAll();
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
                        return farmerRepository.save(Farmer.builder()
                                .user(user)
                                .district(request.getDistrict())
                                .state(request.getState())
                                .build());
                    });
        }

        // Check existing farmers in DB or create a real user profile for this submission
        return farmerRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    String farmerName = request.getFarmerName() != null ? request.getFarmerName() : "Registered Farmer";
                    String email = "farmer_" + UUID.randomUUID().toString().substring(0, 8) + "@massgs.in";
                    User newUser = userRepository.save(User.builder()
                            .email(email)
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .fullName(farmerName)
                            .role("ROLE_FARMER")
                            .phoneNumber(request.getContactPhone() != null ? request.getContactPhone() : "")
                            .build());

                    return farmerRepository.save(Farmer.builder()
                            .user(newUser)
                            .district(request.getDistrict())
                            .state(request.getState())
                            .preferredLanguage("en")
                            .build());
                });
    }

    private ProduceDto.ListingResponse mapToResponse(ProduceListing listing) {
        return ProduceDto.ListingResponse.builder()
                .id(listing.getId())
                .farmerId(listing.getFarmer().getId())
                .farmerName(listing.getFarmer().getUser().getFullName())
                .cropName(listing.getCrop().getName())
                .cropCategory(listing.getCrop().getCategory())
                .varietyName(listing.getVarietyName())
                .quantityKg(listing.getQuantityKg())
                .readyDate(listing.getReadyDate())
                .locationDistrict(listing.getLocationDistrict())
                .locationState(listing.getLocationState())
                .qualityGrade(listing.getQualityGrade())
                .status(listing.getStatus())
                .userProvidedTransportCostPerKg(listing.getUserProvidedTransportCostPerKg())
                .createdAt(listing.getCreatedAt())
                .build();
    }
}
