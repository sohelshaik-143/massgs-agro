package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_code", nullable = false, unique = true, length = 50)
    private String transactionCode; // e.g. TXN-20260830-941028

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produce_listing_id", nullable = false)
    private ProduceListing produceListing;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "offer_id")
    private Offer offer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agreement_id")
    private DigitalAgreement agreement;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Column(name = "agreed_price_per_kg", nullable = false)
    private BigDecimal agreedPricePerKg;

    @Column(name = "quantity_kg", nullable = false)
    private BigDecimal quantityKg;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "transport_cost_paid")
    @Builder.Default
    private BigDecimal transportCostPaid = BigDecimal.ZERO;

    @Column(name = "delivery_location")
    private String deliveryLocation;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "AGREED"; // PENDING, NEGOTIATION, AGREED, IN_PROGRESS, COMPLETED, CANCELLED, DISPUTED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "AGREED";
        if (this.transportCostPaid == null) this.transportCostPaid = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
