package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "produce_listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProduceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Column(name = "variety_name")
    private String varietyName;

    @Column(name = "quantity_kg", nullable = false)
    private BigDecimal quantityKg;

    @Column(name = "quantity_unit")
    @Builder.Default
    private String quantityUnit = "kg"; // kg, quintal, tonne, bag_50kg

    @Column(name = "expected_price_per_unit")
    private BigDecimal expectedPricePerUnit;

    @Column(name = "price_unit")
    @Builder.Default
    private String priceUnit = "kg"; // kg, quintal

    @Column(name = "ready_date", nullable = false)
    private LocalDate readyDate;

    @Column(name = "location_village")
    private String locationVillage;

    @Column(name = "location_mandal")
    private String locationMandal;

    @Column(name = "location_district", nullable = false)
    private String locationDistrict;

    @Column(name = "location_state", nullable = false)
    private String locationState;

    @Column(name = "quality_grade")
    @Builder.Default
    private String qualityGrade = "A"; // A, B, C

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(nullable = false)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE, NEGOTIATING, SOLD, EXPIRED

    @Column(name = "user_provided_transport_cost_per_kg")
    private BigDecimal userProvidedTransportCostPerKg;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "AVAILABLE";
        }
        if (this.quantityUnit == null) {
            this.quantityUnit = "kg";
        }
        if (this.priceUnit == null) {
            this.priceUnit = "kg";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
