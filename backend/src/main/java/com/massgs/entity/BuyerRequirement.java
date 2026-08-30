package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "buyer_requirements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuyerRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Column(name = "min_quantity_kg", nullable = false)
    private BigDecimal minQuantityKg;

    @Column(name = "max_quantity_kg", nullable = false)
    private BigDecimal maxQuantityKg;

    @Column(name = "target_price_per_kg", nullable = false)
    private BigDecimal targetPricePerKg;

    @Column(name = "target_village")
    private String targetVillage;

    @Column(name = "target_mandal")
    private String targetMandal;

    @Column(name = "target_district")
    private String targetDistrict;

    @Column(name = "target_state")
    private String targetState;

    @Column(name = "quality_specs")
    private String qualitySpecs;

    @Column(name = "required_by_date")
    private LocalDate requiredByDate;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, FULFILLED, EXPIRED, CANCELLED

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "ACTIVE";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
