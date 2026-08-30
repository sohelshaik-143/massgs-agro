package com.massgs.controller;

import com.massgs.dto.MarketplaceDto;
import com.massgs.entity.User;
import com.massgs.repository.UserRepository;
import com.massgs.security.UserPrincipal;
import com.massgs.service.MarketplaceWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
public class MarketplaceController {

    private final MarketplaceWorkflowService workflowService;
    private final UserRepository userRepository;

    // ==========================================
    // 1. OFFERS
    // ==========================================

    @PostMapping("/offers")
    public ResponseEntity<MarketplaceDto.OfferResponse> createOffer(@Valid @RequestBody MarketplaceDto.CreateOfferRequest request) {
        User currentUser = resolveCurrentUser();
        return ResponseEntity.ok(workflowService.createOffer(request, currentUser));
    }

    @PostMapping("/offers/{id}/respond")
    public ResponseEntity<MarketplaceDto.OfferResponse> respondToOffer(
            @PathVariable Long id,
            @RequestParam String action,
            @RequestParam(required = false) BigDecimal counterPrice) {
        User currentUser = resolveCurrentUser();
        return ResponseEntity.ok(workflowService.respondToOffer(id, action, counterPrice, currentUser));
    }

    @GetMapping("/offers/farmer/{farmerId}")
    public ResponseEntity<List<MarketplaceDto.OfferResponse>> getFarmerOffers(@PathVariable Long farmerId) {
        return ResponseEntity.ok(workflowService.getFarmerOffers(farmerId));
    }

    @GetMapping("/offers/buyer/{buyerId}")
    public ResponseEntity<List<MarketplaceDto.OfferResponse>> getBuyerOffers(@PathVariable Long buyerId) {
        return ResponseEntity.ok(workflowService.getBuyerOffers(buyerId));
    }

    // ==========================================
    // 2. AGREEMENTS
    // ==========================================

    @PostMapping("/agreements/{id}/accept")
    public ResponseEntity<MarketplaceDto.AgreementResponse> acceptAgreement(@PathVariable Long id) {
        User currentUser = resolveCurrentUser();
        return ResponseEntity.ok(workflowService.acceptAgreement(id, currentUser));
    }

    @GetMapping("/agreements/farmer/{farmerId}")
    public ResponseEntity<List<MarketplaceDto.AgreementResponse>> getFarmerAgreements(@PathVariable Long farmerId) {
        return ResponseEntity.ok(workflowService.getFarmerAgreements(farmerId));
    }

    @GetMapping("/agreements/buyer/{buyerId}")
    public ResponseEntity<List<MarketplaceDto.AgreementResponse>> getBuyerAgreements(@PathVariable Long buyerId) {
        return ResponseEntity.ok(workflowService.getBuyerAgreements(buyerId));
    }

    // ==========================================
    // 3. TRANSACTIONS
    // ==========================================

    @PostMapping("/transactions/{id}/status")
    public ResponseEntity<MarketplaceDto.TransactionResponse> updateTransactionStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        User currentUser = resolveCurrentUser();
        return ResponseEntity.ok(workflowService.updateTransactionStatus(id, status, currentUser));
    }

    @GetMapping("/transactions/farmer/{farmerId}")
    public ResponseEntity<List<MarketplaceDto.TransactionResponse>> getFarmerTransactions(@PathVariable Long farmerId) {
        return ResponseEntity.ok(workflowService.getFarmerTransactions(farmerId));
    }

    @GetMapping("/transactions/buyer/{buyerId}")
    public ResponseEntity<List<MarketplaceDto.TransactionResponse>> getBuyerTransactions(@PathVariable Long buyerId) {
        return ResponseEntity.ok(workflowService.getBuyerTransactions(buyerId));
    }

    // ==========================================
    // 4. FEEDBACK & TRUST
    // ==========================================

    @PostMapping("/feedback")
    public ResponseEntity<MarketplaceDto.FeedbackResponse> submitFeedback(@Valid @RequestBody MarketplaceDto.SubmitFeedbackRequest request) {
        User currentUser = resolveCurrentUser();
        return ResponseEntity.ok(workflowService.submitFeedback(request, currentUser));
    }

    @GetMapping("/trust/{userId}")
    public ResponseEntity<MarketplaceDto.UserTrustProfile> getUserTrustProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(workflowService.getUserTrustProfile(userId));
    }

    // ==========================================
    // 5. DISPUTES
    // ==========================================

    @PostMapping("/disputes")
    public ResponseEntity<MarketplaceDto.DisputeResponse> reportProblem(@Valid @RequestBody MarketplaceDto.CreateDisputeRequest request) {
        User currentUser = resolveCurrentUser();
        return ResponseEntity.ok(workflowService.reportProblem(request, currentUser));
    }

    @PostMapping("/disputes/{id}/resolve")
    public ResponseEntity<MarketplaceDto.DisputeResponse> resolveDispute(
            @PathVariable Long id,
            @RequestParam String resolutionNotes,
            @RequestParam String status) {
        User currentUser = resolveCurrentUser();
        return ResponseEntity.ok(workflowService.resolveDispute(id, resolutionNotes, status, currentUser));
    }

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
            return userRepository.findById(principal.getId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));
        }
        // Fallback for public demo testing
        return userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No registered user found in system. Please login first."));
    }
}
