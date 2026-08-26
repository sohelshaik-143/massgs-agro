package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "market_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "market_id", nullable = false)
    private Market market;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Column(name = "variety_name")
    private String varietyName;

    @Column(name = "min_price_per_kg", nullable = false)
    private BigDecimal minPricePerKg;

    @Column(name = "max_price_per_kg", nullable = false)
    private BigDecimal maxPricePerKg;

    @Column(name = "modal_price_per_kg", nullable = false)
    private BigDecimal modalPricePerKg;

    @Column(name = "arrival_date", nullable = false)
    private LocalDate arrivalDate;

    @Column(name = "data_source_name", nullable = false)
    private String dataSourceName; // AGMARKNET, ENAM, OPEN_GOV

    @Column(name = "source_identifier")
    private String sourceIdentifier;

    @Column(name = "data_quality_status", nullable = false)
    private String dataQualityStatus; // VERIFIED, PARTIALLY_VERIFIED, STALE, INVALID

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
