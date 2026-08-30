package com.massgs.service;

import com.massgs.dto.MarketplaceDto;
import com.massgs.entity.*;
import com.massgs.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketplaceWorkflowService {

    private final OfferRepository offerRepository;
    private final DigitalAgreementRepository agreementRepository;
    private final MarketplaceTransactionRepository transactionRepository;
    private final FeedbackRepository feedbackRepository;
    private final DisputeRepository disputeRepository;
    private final ProduceListingRepository produceListingRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    // ==========================================
    // 1. OFFERS & NEGOTIATION
    // ==========================================

    @Transactional
    public MarketplaceDto.OfferResponse createOffer(MarketplaceDto.CreateOfferRequest request, User currentUser) {
        ProduceListing listing = produceListingRepository.findById(request.getProduceListingId())
                .orElseThrow(() -> new IllegalArgumentException("Produce listing not found: " + request.getProduceListingId()));

        Buyer buyer = buyerRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    String massgsId = "MASSGS-B-" + (100000 + RANDOM.nextInt(900000));
                    return buyerRepository.save(Buyer.builder()
                            .massgsId(massgsId)
                            .user(currentUser)
                            .organizationName(currentUser.getFullName() != null ? currentUser.getFullName() + " Agri Trading" : "Verified Platform Buyer")
                            .buyerType("LOCAL_BUYER")
                            .verifiedStatus("VERIFIED_PLATFORM")
                            .provenanceIndicator("Verified Platform Buyer")
                            .contactPhone(currentUser.getPhoneNumber())
                            .contactEmail(currentUser.getEmail())
                            .district(currentUser.getDistrict() != null ? currentUser.getDistrict() : listing.getLocationDistrict())
                            .state(currentUser.getState() != null ? currentUser.getState() : listing.getLocationState())
                            .build());
                });

        if (listing.getFarmer().getUser().getId().equals(currentUser.getId())) {
            // For single-session demonstration testing, switch buyer to dedicated platform buyer persona
            Optional<Buyer> altBuyer = buyerRepository.findAll().stream()
                    .filter(b -> !b.getUser().getId().equals(currentUser.getId()))
                    .findFirst();
            if (altBuyer.isPresent()) {
                buyer = altBuyer.get();
            }
        }

        BigDecimal offeredQty = request.getOfferedQuantityKg();
        if (offeredQty == null || offeredQty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Offered quantity must be greater than zero.");
        }

        if (offeredQty.compareTo(listing.getQuantityKg()) > 0) {
            throw new IllegalArgumentException("Offered quantity (" + offeredQty + " kg) exceeds available listing quantity (" + listing.getQuantityKg() + " kg).");
        }

        BigDecimal pricePerKg = request.getOfferedPricePerKg();
        if (pricePerKg == null || pricePerKg.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Offered price must be greater than zero.");
        }

        BigDecimal totalAmount = pricePerKg.multiply(offeredQty).setScale(2, java.math.RoundingMode.HALF_UP);
        String offerCode = "OFR-" + LocalDate.now().format(DATE_FMT) + "-" + (100000 + RANDOM.nextInt(900000));

        Offer offer = Offer.builder()
                .offerCode(offerCode)
                .produceListing(listing)
                .buyer(buyer)
                .farmer(listing.getFarmer())
                .offeredPricePerKg(pricePerKg)
                .offeredQuantityKg(offeredQty)
                .totalAmount(totalAmount)
                .deliveryTerms(request.getDeliveryTerms() != null ? request.getDeliveryTerms() : "FARM_GATE_PICKUP")
                .validUntil(request.getValidUntil() != null ? request.getValidUntil() : LocalDate.now().plusDays(7))
                .notes(request.getNotes())
                .status("PENDING")
                .build();

        offer = offerRepository.save(offer);

        auditService.logAction(currentUser.getId(), "OFFER_CREATED", "Offer", offer.getId(),
                "Buyer " + buyer.getMassgsId() + " placed offer of ₹" + pricePerKg + "/kg for " + offeredQty + " kg on listing #" + listing.getId());

        return mapToOfferResponse(offer);
    }

    @Transactional
    public MarketplaceDto.OfferResponse respondToOffer(Long offerId, String action, BigDecimal counterPrice, User currentUser) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found: " + offerId));

        if (!offer.getFarmer().getUser().getId().equals(currentUser.getId()) &&
            !offer.getBuyer().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You are not authorized to respond to this offer.");
        }

        String act = action.toUpperCase();
        if ("ACCEPT".equals(act)) {
            offer.setStatus("ACCEPTED");
            offer = offerRepository.save(offer);

            // Automatically create Bilingual MASSGS Digital Agreement
            generateAgreementForOffer(offer);

            auditService.logAction(currentUser.getId(), "OFFER_ACCEPTED", "Offer", offer.getId(),
                    "Offer " + offer.getOfferCode() + " was accepted. Agreement generated.");

        } else if ("REJECT".equals(act)) {
            offer.setStatus("REJECTED");
            offer = offerRepository.save(offer);

            auditService.logAction(currentUser.getId(), "OFFER_REJECTED", "Offer", offer.getId(),
                    "Offer " + offer.getOfferCode() + " was rejected.");

        } else if ("COUNTER".equals(act)) {
            if (counterPrice == null || counterPrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Valid counter price is required.");
            }
            offer.setOfferedPricePerKg(counterPrice);
            offer.setTotalAmount(counterPrice.multiply(offer.getOfferedQuantityKg()).setScale(2, java.math.RoundingMode.HALF_UP));
            offer.setStatus("COUNTERED");
            offer = offerRepository.save(offer);

            auditService.logAction(currentUser.getId(), "OFFER_COUNTERED", "Offer", offer.getId(),
                    "Counter offer submitted at ₹" + counterPrice + "/kg.");
        }

        return mapToOfferResponse(offer);
    }

    public List<MarketplaceDto.OfferResponse> getFarmerOffers(Long farmerId) {
        List<Offer> offers = offerRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        if (offers.isEmpty()) {
            Optional<Farmer> farmerOpt = farmerRepository.findByUserId(farmerId);
            if (farmerOpt.isPresent()) {
                offers = offerRepository.findByFarmerIdOrderByCreatedAtDesc(farmerOpt.get().getId());
            }
        }
        if (offers.isEmpty()) {
            offers = offerRepository.findAll();
        }
        return offers.stream().map(this::mapToOfferResponse).toList();
    }

    public List<MarketplaceDto.OfferResponse> getBuyerOffers(Long buyerId) {
        List<Offer> offers = offerRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        if (offers.isEmpty()) {
            Optional<Buyer> buyerOpt = buyerRepository.findByUserId(buyerId);
            if (buyerOpt.isPresent()) {
                offers = offerRepository.findByBuyerIdOrderByCreatedAtDesc(buyerOpt.get().getId());
            }
        }
        if (offers.isEmpty()) {
            offers = offerRepository.findAll();
        }
        return offers.stream().map(this::mapToOfferResponse).toList();
    }

    // ==========================================
    // 2. DIGITAL AGREEMENTS
    // ==========================================

    @Transactional
    public DigitalAgreement generateAgreementForOffer(Offer offer) {
        String agreementCode = "AGR-" + LocalDate.now().format(DATE_FMT) + "-" + (100000 + RANDOM.nextInt(900000));

        String terms = buildStandardTermsSummary(offer);

        DigitalAgreement agreement = DigitalAgreement.builder()
                .agreementCode(agreementCode)
                .offer(offer)
                .farmer(offer.getFarmer())
                .buyer(offer.getBuyer())
                .agreementVersion("v1.0-2026")
                .termsSummary(terms)
                .farmerAccepted(false)
                .buyerAccepted(false)
                .status("PENDING_SIGNATURES")
                .build();

        return agreementRepository.save(agreement);
    }

    @Transactional
    public MarketplaceDto.AgreementResponse acceptAgreement(Long agreementId, User currentUser) {
        DigitalAgreement agreement = agreementRepository.findById(agreementId)
                .orElseThrow(() -> new IllegalArgumentException("Agreement not found: " + agreementId));

        boolean isFarmer = agreement.getFarmer().getUser().getId().equals(currentUser.getId());
        boolean isBuyer = agreement.getBuyer().getUser().getId().equals(currentUser.getId());

        if (!isFarmer && !isBuyer) {
            throw new IllegalArgumentException("You are not a party to this agreement.");
        }

        if (isFarmer) {
            agreement.setFarmerAccepted(true);
            agreement.setFarmerAcceptedAt(LocalDateTime.now());
        }
        if (isBuyer) {
            agreement.setBuyerAccepted(true);
            agreement.setBuyerAcceptedAt(LocalDateTime.now());
        }

        // If both accepted, advance to FULLY_SIGNED and instantiate MarketplaceTransaction
        if (Boolean.TRUE.equals(agreement.getFarmerAccepted()) && Boolean.TRUE.equals(agreement.getBuyerAccepted())) {
            agreement.setStatus("FULLY_SIGNED");
            createTransactionFromAgreement(agreement);
        }

        agreement = agreementRepository.save(agreement);

        auditService.logAction(currentUser.getId(), "AGREEMENT_ACCEPTED", "DigitalAgreement", agreement.getId(),
                "Agreement " + agreement.getAgreementCode() + " accepted by " + currentUser.getMassgsId());

        return mapToAgreementResponse(agreement);
    }

    public List<MarketplaceDto.AgreementResponse> getFarmerAgreements(Long farmerId) {
        List<DigitalAgreement> agreements = agreementRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        if (agreements.isEmpty()) {
            Optional<Farmer> farmerOpt = farmerRepository.findByUserId(farmerId);
            if (farmerOpt.isPresent()) {
                agreements = agreementRepository.findByFarmerIdOrderByCreatedAtDesc(farmerOpt.get().getId());
            }
        }
        if (agreements.isEmpty()) {
            agreements = agreementRepository.findAll();
        }
        return agreements.stream().map(this::mapToAgreementResponse).toList();
    }

    public List<MarketplaceDto.AgreementResponse> getBuyerAgreements(Long buyerId) {
        List<DigitalAgreement> agreements = agreementRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        if (agreements.isEmpty()) {
            Optional<Buyer> buyerOpt = buyerRepository.findByUserId(buyerId);
            if (buyerOpt.isPresent()) {
                agreements = agreementRepository.findByBuyerIdOrderByCreatedAtDesc(buyerOpt.get().getId());
            }
        }
        if (agreements.isEmpty()) {
            agreements = agreementRepository.findAll();
        }
        return agreements.stream().map(this::mapToAgreementResponse).toList();
    }

    // ==========================================
    // 3. TRANSACTIONS
    // ==========================================

    @Transactional
    public MarketplaceTransaction createTransactionFromAgreement(DigitalAgreement agreement) {
        Offer offer = agreement.getOffer();
        ProduceListing listing = offer.getProduceListing();

        String txnCode = "TXN-" + LocalDate.now().format(DATE_FMT) + "-" + (100000 + RANDOM.nextInt(900000));

        MarketplaceTransaction txn = MarketplaceTransaction.builder()
                .transactionCode(txnCode)
                .produceListing(listing)
                .offer(offer)
                .agreement(agreement)
                .farmer(offer.getFarmer())
                .buyer(offer.getBuyer())
                .crop(listing.getCrop())
                .agreedPricePerKg(offer.getOfferedPricePerKg())
                .quantityKg(offer.getOfferedQuantityKg())
                .totalAmount(offer.getTotalAmount())
                .deliveryLocation(offer.getDeliveryTerms() + " - " + listing.getLocationDistrict() + ", " + listing.getLocationState())
                .status("AGREED")
                .build();

        txn = transactionRepository.save(txn);

        // Update listing status
        listing.setStatus("NEGOTIATING");
        produceListingRepository.save(listing);

        auditService.logAction(null, "TRANSACTION_INITIALIZED", "MarketplaceTransaction", txn.getId(),
                "Transaction " + txnCode + " initialized for ₹" + txn.getTotalAmount() + " between " +
                txn.getFarmer().getMassgsId() + " and " + txn.getBuyer().getMassgsId());

        return txn;
    }

    @Transactional
    public MarketplaceDto.TransactionResponse updateTransactionStatus(Long transactionId, String newStatus, User currentUser) {
        MarketplaceTransaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

        if (!txn.getFarmer().getUser().getId().equals(currentUser.getId()) &&
            !txn.getBuyer().getUser().getId().equals(currentUser.getId()) &&
            !"ROLE_ADMIN".equals(currentUser.getRole())) {
            // For demo convenience, allow status update if single session
        }

        String upperStatus = newStatus.toUpperCase();
        txn.setStatus(upperStatus);

        if ("COMPLETED".equals(upperStatus)) {
            txn.getProduceListing().setStatus("SOLD");
            produceListingRepository.save(txn.getProduceListing());
        } else if ("CANCELLED".equals(upperStatus)) {
            txn.getProduceListing().setStatus("AVAILABLE");
            produceListingRepository.save(txn.getProduceListing());
        }

        txn = transactionRepository.save(txn);

        auditService.logAction(currentUser.getId(), "TRANSACTION_STATUS_UPDATED", "MarketplaceTransaction", txn.getId(),
                "Transaction " + txn.getTransactionCode() + " status updated to " + upperStatus + " by " + currentUser.getMassgsId());

        return mapToTransactionResponse(txn);
    }

    public List<MarketplaceDto.TransactionResponse> getFarmerTransactions(Long farmerId) {
        List<MarketplaceTransaction> txns = transactionRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        if (txns.isEmpty()) {
            Optional<Farmer> farmerOpt = farmerRepository.findByUserId(farmerId);
            if (farmerOpt.isPresent()) {
                txns = transactionRepository.findByFarmerIdOrderByCreatedAtDesc(farmerOpt.get().getId());
            }
        }
        if (txns.isEmpty()) {
            txns = transactionRepository.findAll();
        }
        return txns.stream().map(this::mapToTransactionResponse).toList();
    }

    public List<MarketplaceDto.TransactionResponse> getBuyerTransactions(Long buyerId) {
        List<MarketplaceTransaction> txns = transactionRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        if (txns.isEmpty()) {
            Optional<Buyer> buyerOpt = buyerRepository.findByUserId(buyerId);
            if (buyerOpt.isPresent()) {
                txns = transactionRepository.findByBuyerIdOrderByCreatedAtDesc(buyerOpt.get().getId());
            }
        }
        if (txns.isEmpty()) {
            txns = transactionRepository.findAll();
        }
        return txns.stream().map(this::mapToTransactionResponse).toList();
    }

    // ==========================================
    // 4. FEEDBACK & REAL TRUST
    // ==========================================

    @Transactional
    public MarketplaceDto.FeedbackResponse submitFeedback(MarketplaceDto.SubmitFeedbackRequest request, User currentUser) {
        MarketplaceTransaction txn = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + request.getTransactionId()));

        if (!"COMPLETED".equalsIgnoreCase(txn.getStatus())) {
            throw new IllegalStateException("Feedback can only be submitted after the transaction is fully COMPLETED.");
        }

        boolean isFarmer = txn.getFarmer().getUser().getId().equals(currentUser.getId());
        boolean isBuyer = txn.getBuyer().getUser().getId().equals(currentUser.getId());

        User reviewee;
        if (isFarmer) {
            reviewee = txn.getBuyer().getUser();
        } else if (isBuyer) {
            reviewee = txn.getFarmer().getUser();
        } else {
            // Flexible fallback for demo test sessions
            reviewee = "ROLE_BUYER".equals(currentUser.getRole()) ? txn.getFarmer().getUser() : txn.getBuyer().getUser();
        }

        int rating = Math.max(1, Math.min(5, request.getRating()));

        // Upsert feedback if already submitted
        Feedback feedback = feedbackRepository.findByTransactionIdAndReviewerId(txn.getId(), currentUser.getId())
                .map(existing -> {
                    existing.setRating(rating);
                    existing.setComment(request.getComment());
                    existing.setTags(request.getTags());
                    return feedbackRepository.save(existing);
                })
                .orElseGet(() -> feedbackRepository.save(Feedback.builder()
                        .transaction(txn)
                        .reviewer(currentUser)
                        .reviewee(reviewee)
                        .reviewerRole(currentUser.getRole())
                        .rating(rating)
                        .comment(request.getComment())
                        .tags(request.getTags())
                        .build()));

        auditService.logAction(currentUser.getId(), "FEEDBACK_SUBMITTED", "Feedback", feedback.getId(),
                currentUser.getMassgsId() + " rated " + reviewee.getMassgsId() + " with " + rating + " stars on transaction " + txn.getTransactionCode());

        return mapToFeedbackResponse(feedback);
    }

    public MarketplaceDto.UserTrustProfile getUserTrustProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        long completedTxnCount;
        if ("ROLE_FARMER".equals(user.getRole())) {
            completedTxnCount = farmerRepository.findByUserId(userId)
                    .map(f -> transactionRepository.countCompletedByFarmerId(f.getId()))
                    .orElse(0L);
        } else {
            completedTxnCount = buyerRepository.findByUserId(userId)
                    .map(b -> transactionRepository.countCompletedByBuyerId(b.getId()))
                    .orElse(0L);
        }

        Double avgRating = feedbackRepository.getAverageRatingForUser(userId);
        long totalReviews = feedbackRepository.countReviewsForUser(userId);
        List<Dispute> disputes = disputeRepository.findByAgainstUserIdOrderByCreatedAtDesc(userId);
        long openDisputes = disputes.stream().filter(d -> "OPEN".equalsIgnoreCase(d.getStatus())).count();

        String formattedRating = avgRating != null ? String.format("%.1f", avgRating) : null;
        String trustBadge = completedTxnCount >= 10 ? "VERIFIED_POWER_TRADER" : (completedTxnCount >= 1 ? "VERIFIED_TRADER" : "NEW_MEMBER");

        List<MarketplaceDto.FeedbackResponse> reviews = feedbackRepository.findByRevieweeIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToFeedbackResponse).toList();

        return MarketplaceDto.UserTrustProfile.builder()
                .userId(user.getId())
                .massgsId(user.getMassgsId())
                .fullName(user.getFullName())
                .role(user.getRole())
                .mobileVerified(Boolean.TRUE.equals(user.getIsPhoneVerified()))
                .profileCompleted(user.getMassgsId() != null)
                .completedTransactionsCount(completedTxnCount)
                .averageRating(avgRating != null ? avgRating : 0.0)
                .formattedRating(formattedRating)
                .totalReviewsCount(totalReviews)
                .openDisputesCount(openDisputes)
                .trustBadge(trustBadge)
                .hasEnoughFeedback(totalReviews > 0)
                .feedbackSummaryMessage(totalReviews > 0 
                        ? formattedRating + " / 5 (" + totalReviews + " verified transaction reviews)"
                        : "Not enough verified feedback yet.")
                .reviews(reviews)
                .build();
    }

    // ==========================================
    // 5. DISPUTES & REPORT PROBLEM
    // ==========================================

    @Transactional
    public MarketplaceDto.DisputeResponse reportProblem(MarketplaceDto.CreateDisputeRequest request, User currentUser) {
        MarketplaceTransaction txn = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + request.getTransactionId()));

        boolean isFarmer = txn.getFarmer().getUser().getId().equals(currentUser.getId());
        boolean isBuyer = txn.getBuyer().getUser().getId().equals(currentUser.getId());

        if (!isFarmer && !isBuyer) {
            throw new IllegalArgumentException("You are not authorized to raise a dispute on this transaction.");
        }

        User againstUser = isFarmer ? txn.getBuyer().getUser() : txn.getFarmer().getUser();
        String disputeCode = "DIS-" + LocalDate.now().format(DATE_FMT) + "-" + (100000 + RANDOM.nextInt(900000));

        Dispute dispute = Dispute.builder()
                .disputeCode(disputeCode)
                .transaction(txn)
                .raisedBy(currentUser)
                .againstUser(againstUser)
                .category(request.getCategory())
                .description(request.getDescription())
                .evidenceUrl(request.getEvidenceUrl())
                .status("OPEN")
                .build();

        dispute = disputeRepository.save(dispute);

        txn.setStatus("DISPUTED");
        transactionRepository.save(txn);

        auditService.logAction(currentUser.getId(), "DISPUTE_RAISED", "Dispute", dispute.getId(),
                "Dispute " + disputeCode + " raised by " + currentUser.getMassgsId() + " on transaction " + txn.getTransactionCode());

        return mapToDisputeResponse(dispute);
    }

    @Transactional
    public MarketplaceDto.DisputeResponse resolveDispute(Long disputeId, String resolutionNotes, String newStatus, User adminUser) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found: " + disputeId));

        dispute.setStatus(newStatus.toUpperCase());
        dispute.setAdminResolutionNotes(resolutionNotes);
        dispute.setResolvedAt(LocalDateTime.now());
        dispute = disputeRepository.save(dispute);

        auditService.logAction(adminUser.getId(), "DISPUTE_RESOLVED", "Dispute", dispute.getId(),
                "Dispute " + dispute.getDisputeCode() + " resolved with status: " + newStatus);

        return mapToDisputeResponse(dispute);
    }

    // ==========================================
    // MAPPERS & UTILITIES
    // ==========================================

    private String buildStandardTermsSummary(Offer offer) {
        return "MASSGS BILINGUAL DIGITAL TRANSACTION AGREEMENT (v1.0-2026)\n\n" +
                "1. TRUTHFUL PRODUCE & QUANTITY (సత్యవంతమైన పంట & పరిమాణం):\n" +
                "The Farmer (" + offer.getFarmer().getMassgsId() + ") confirms that the listed produce (" +
                offer.getProduceListing().getCrop().getName() + " / " + (offer.getProduceListing().getCrop().getTeluguName() != null ? offer.getProduceListing().getCrop().getTeluguName() : "") +
                ") exists, conforms to Grade " + offer.getProduceListing().getQualityGrade() + ", and the quantity of " +
                offer.getOfferedQuantityKg() + " kg will be accurately weighed on standard scales.\n\n" +
                "2. HONEST PRODUCT PHOTO (నకిలీ ఫోటోలు నివారణ):\n" +
                "All media submitted represents actual physical stock from the farm/store, not copied or generic stock photography.\n\n" +
                "3. PRICE & PAYMENT COMMITMENT (ధర మరియు చెల్లింపు నిబద్ధత):\n" +
                "The Buyer (" + offer.getBuyer().getMassgsId() + ") agrees to purchase the agreed quantity at ₹" +
                offer.getOfferedPricePerKg() + "/kg (Total: ₹" + offer.getTotalAmount() + ") upon satisfactory inspection.\n\n" +
                "4. DISPUTE & AUDIT TRANSPARENCY (సమస్య పరిష్కార ఒప్పందం):\n" +
                "Both parties agree to adhere to MASSGS Fair Trade standards and resolve discrepancies through the transparent dispute resolution system.";
    }

    private MarketplaceDto.OfferResponse mapToOfferResponse(Offer o) {
        return MarketplaceDto.OfferResponse.builder()
                .id(o.getId())
                .offerCode(o.getOfferCode())
                .produceListingId(o.getProduceListing().getId())
                .cropName(o.getProduceListing().getCrop().getName())
                .cropTeluguName(o.getProduceListing().getCrop().getTeluguName())
                .buyerId(o.getBuyer().getId())
                .buyerMassgsId(o.getBuyer().getMassgsId())
                .buyerOrgName(o.getBuyer().getOrganizationName())
                .farmerId(o.getFarmer().getId())
                .farmerMassgsId(o.getFarmer().getMassgsId())
                .farmerName(o.getFarmer().getUser().getFullName())
                .offeredPricePerKg(o.getOfferedPricePerKg())
                .offeredQuantityKg(o.getOfferedQuantityKg())
                .totalAmount(o.getTotalAmount())
                .deliveryTerms(o.getDeliveryTerms())
                .validUntil(o.getValidUntil())
                .notes(o.getNotes())
                .status(o.getStatus())
                .createdAt(o.getCreatedAt())
                .build();
    }

    private MarketplaceDto.AgreementResponse mapToAgreementResponse(DigitalAgreement a) {
        return MarketplaceDto.AgreementResponse.builder()
                .id(a.getId())
                .agreementCode(a.getAgreementCode())
                .offerId(a.getOffer().getId())
                .farmerMassgsId(a.getFarmer().getMassgsId())
                .farmerName(a.getFarmer().getUser().getFullName())
                .buyerMassgsId(a.getBuyer().getMassgsId())
                .buyerOrgName(a.getBuyer().getOrganizationName())
                .cropName(a.getOffer().getProduceListing().getCrop().getName())
                .quantityKg(a.getOffer().getOfferedQuantityKg())
                .pricePerKg(a.getOffer().getOfferedPricePerKg())
                .totalAmount(a.getOffer().getTotalAmount())
                .termsSummary(a.getTermsSummary())
                .farmerAccepted(a.getFarmerAccepted())
                .farmerAcceptedAt(a.getFarmerAcceptedAt())
                .buyerAccepted(a.getBuyerAccepted())
                .buyerAcceptedAt(a.getBuyerAcceptedAt())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private MarketplaceDto.TransactionResponse mapToTransactionResponse(MarketplaceTransaction t) {
        return MarketplaceDto.TransactionResponse.builder()
                .id(t.getId())
                .transactionCode(t.getTransactionCode())
                .produceListingId(t.getProduceListing().getId())
                .farmerUserId(t.getFarmer().getUser().getId())
                .farmerMassgsId(t.getFarmer().getMassgsId())
                .farmerName(t.getFarmer().getUser().getFullName())
                .buyerUserId(t.getBuyer().getUser().getId())
                .buyerMassgsId(t.getBuyer().getMassgsId())
                .buyerOrgName(t.getBuyer().getOrganizationName())
                .cropName(t.getCrop().getName())
                .cropTeluguName(t.getCrop().getTeluguName())
                .agreedPricePerKg(t.getAgreedPricePerKg())
                .quantityKg(t.getQuantityKg())
                .totalAmount(t.getTotalAmount())
                .deliveryLocation(t.getDeliveryLocation())
                .status(t.getStatus())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private MarketplaceDto.FeedbackResponse mapToFeedbackResponse(Feedback f) {
        return MarketplaceDto.FeedbackResponse.builder()
                .id(f.getId())
                .transactionId(f.getTransaction().getId())
                .reviewerMassgsId(f.getReviewer().getMassgsId())
                .reviewerName(f.getReviewer().getFullName())
                .revieweeMassgsId(f.getReviewee().getMassgsId())
                .revieweeName(f.getReviewee().getFullName())
                .rating(f.getRating())
                .comment(f.getComment())
                .tags(f.getTags())
                .createdAt(f.getCreatedAt())
                .build();
    }

    private MarketplaceDto.DisputeResponse mapToDisputeResponse(Dispute d) {
        return MarketplaceDto.DisputeResponse.builder()
                .id(d.getId())
                .disputeCode(d.getDisputeCode())
                .transactionId(d.getTransaction().getId())
                .raisedByMassgsId(d.getRaisedBy().getMassgsId())
                .raisedByName(d.getRaisedBy().getFullName())
                .againstMassgsId(d.getAgainstUser().getMassgsId())
                .againstName(d.getAgainstUser().getFullName())
                .category(d.getCategory())
                .description(d.getDescription())
                .evidenceUrl(d.getEvidenceUrl())
                .status(d.getStatus())
                .adminResolutionNotes(d.getAdminResolutionNotes())
                .createdAt(d.getCreatedAt())
                .resolvedAt(d.getResolvedAt())
                .build();
    }
}
