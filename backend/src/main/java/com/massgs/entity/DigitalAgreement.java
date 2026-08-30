package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agreements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agreement_code", nullable = false, unique = true, length = 30)
    private String agreementCode; // e.g. AGR-20260830-819203

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @Column(name = "agreement_version", nullable = false, length = 20)
    @Builder.Default
    private String agreementVersion = "v1.0-2026";

    @Column(name = "terms_summary", columnDefinition = "TEXT", nullable = false)
    private String termsSummary;

    @Column(name = "farmer_accepted", nullable = false)
    @Builder.Default
    private Boolean farmerAccepted = false;

    @Column(name = "farmer_accepted_at")
    private LocalDateTime farmerAcceptedAt;

    @Column(name = "buyer_accepted", nullable = false)
    @Builder.Default
    private Boolean buyerAccepted = false;

    @Column(name = "buyer_accepted_at")
    private LocalDateTime buyerAcceptedAt;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING_SIGNATURES"; // PENDING_SIGNATURES, FULLY_SIGNED, REJECTED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING_SIGNATURES";
    }
}
