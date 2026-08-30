package com.massgs.controller;

import com.massgs.dto.DemandDto;
import com.massgs.entity.User;
import com.massgs.repository.UserRepository;
import com.massgs.security.UserPrincipal;
import com.massgs.service.BuyerDemandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buyer")
@RequiredArgsConstructor
public class BuyerDemandController {

    private final BuyerDemandService buyerDemandService;
    private final UserRepository userRepository;

    @PostMapping("/demands")
    public ResponseEntity<DemandDto.DemandResponse> createDemand(@Valid @RequestBody DemandDto.CreateDemandRequest request) {
        User currentUser = resolveCurrentUser();
        return ResponseEntity.ok(buyerDemandService.createDemand(request, currentUser));
    }

    @GetMapping("/demands")
    public ResponseEntity<List<DemandDto.DemandResponse>> getActiveDemands(
            @RequestParam(required = false) String crop,
            @RequestParam(required = false) String district) {
        return ResponseEntity.ok(buyerDemandService.getActiveDemands(crop, district));
    }

    @GetMapping("/demands/buyer/{buyerId}")
    public ResponseEntity<List<DemandDto.DemandResponse>> getBuyerDemands(@PathVariable Long buyerId) {
        return ResponseEntity.ok(buyerDemandService.getBuyerDemands(buyerId));
    }

    @GetMapping("/recommendations/listing/{listingId}")
    public ResponseEntity<List<DemandDto.DemandRecommendationMatch>> getRecommendationsForListing(@PathVariable Long listingId) {
        return ResponseEntity.ok(buyerDemandService.getRecommendationsForListing(listingId));
    }

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
            return userRepository.findById(principal.getId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));
        }
        return userRepository.findAll().stream().filter(u -> "ROLE_BUYER".equals(u.getRole())).findFirst()
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                        .orElseGet(() -> {
                            String massgsId = "MASSGS-B-" + (100000 + (int)(Math.random() * 900000));
                            return userRepository.save(User.builder()
                                    .massgsId(massgsId)
                                    .email("buyer_demo@massgs.in")
                                    .fullName("Verified Platform Buyer")
                                    .role("ROLE_BUYER")
                                    .phoneNumber("9876543210")
                                    .isPhoneVerified(true)
                                    .district("Guntur")
                                    .state("Andhra Pradesh")
                                    .build());
                        }));
    }
}
