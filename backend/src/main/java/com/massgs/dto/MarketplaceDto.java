package com.massgs.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class MarketplaceDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateOfferRequest {
        @NotNull
        private Long produceListingId;

        @NotNull
        private BigDecimal offeredPricePerKg;

        @NotNull
        private BigDecimal offeredQuantityKg;

        private String deliveryTerms; // FARM_GATE_PICKUP, BUYER_WAREHOUSE_DELIVERY, APMC_YARD
        private LocalDate validUntil;
        private String notes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OfferResponse {
        private Long id;
        private String offerCode;
        private Long produceListingId;
        private String cropName;
        private String cropTeluguName;
        private Long buyerId;
        private String buyerMassgsId;
        private String buyerOrgName;
        private Long farmerId;
        private String farmerMassgsId;
        private String farmerName;
        private BigDecimal offeredPricePerKg;
        private BigDecimal offeredQuantityKg;
        private BigDecimal totalAmount;
        private String deliveryTerms;
        private LocalDate validUntil;
        private String notes;
        private String status;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AgreementResponse {
        private Long id;
        private String agreementCode;
        private Long offerId;
        private String farmerMassgsId;
        private String farmerName;
        private String buyerMassgsId;
        private String buyerOrgName;
        private String cropName;
        private BigDecimal quantityKg;
        private BigDecimal pricePerKg;
        private BigDecimal totalAmount;
        private String termsSummary;
        private Boolean farmerAccepted;
        private LocalDateTime farmerAcceptedAt;
        private Boolean buyerAccepted;
        private LocalDateTime buyerAcceptedAt;
        private String status;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionResponse {
        private Long id;
        private String transactionCode;
        private Long produceListingId;
        private Long farmerUserId;
        private String farmerMassgsId;
        private String farmerName;
        private Long buyerUserId;
        private String buyerMassgsId;
        private String buyerOrgName;
        private String cropName;
        private String cropTeluguName;
        private BigDecimal agreedPricePerKg;
        private BigDecimal quantityKg;
        private BigDecimal totalAmount;
        private String deliveryLocation;
        private String status;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmitFeedbackRequest {
        @NotNull
        private Long transactionId;

        @NotNull
        private Integer rating; // 1 to 5

        private String comment;
        private String tags;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeedbackResponse {
        private Long id;
        private Long transactionId;
        private String reviewerMassgsId;
        private String reviewerName;
        private String revieweeMassgsId;
        private String revieweeName;
        private Integer rating;
        private String comment;
        private String tags;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserTrustProfile {
        private Long userId;
        private String massgsId;
        private String fullName;
        private String role;
        private Boolean mobileVerified;
        private Boolean profileCompleted;
        private Long completedTransactionsCount;
        private Double averageRating;
        private String formattedRating;
        private Long totalReviewsCount;
        private Long openDisputesCount;
        private String trustBadge;
        private Boolean hasEnoughFeedback;
        private String feedbackSummaryMessage;
        private List<FeedbackResponse> reviews;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateDisputeRequest {
        @NotNull
        private Long transactionId;

        @NotNull
        private String category; // PRODUCT_NOT_AS_DESCRIBED, QUANTITY_MISMATCH, PAYMENT_ISSUE, AGREEMENT_BREACH, MISLEADING_LISTING, HARASSMENT, OTHER

        @NotNull
        private String description;

        private String evidenceUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DisputeResponse {
        private Long id;
        private String disputeCode;
        private Long transactionId;
        private String raisedByMassgsId;
        private String raisedByName;
        private String againstMassgsId;
        private String againstName;
        private String category;
        private String description;
        private String evidenceUrl;
        private String status;
        private String adminResolutionNotes;
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
    }
}
