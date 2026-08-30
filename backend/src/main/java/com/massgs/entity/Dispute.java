package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispute_code", nullable = false, unique = true, length = 30)
    private String disputeCode; // e.g. DIS-20260830-102938

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transaction_id", nullable = false)
    private MarketplaceTransaction transaction;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "raised_by_user_id", nullable = false)
    private User raisedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "against_user_id", nullable = false)
    private User againstUser;

    @Column(nullable = false, length = 100)
    private String category; // PRODUCT_NOT_AS_DESCRIBED, QUANTITY_MISMATCH, PAYMENT_ISSUE, AGREEMENT_BREACH, MISLEADING_LISTING, HARASSMENT, OTHER

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "OPEN"; // OPEN, UNDER_REVIEW, RESOLVED, REJECTED

    @Column(name = "admin_resolution_notes", columnDefinition = "TEXT")
    private String adminResolutionNotes;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "OPEN";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
