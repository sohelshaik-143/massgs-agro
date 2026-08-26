package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transport_quotes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportQuote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "origin_district", nullable = false)
    private String originDistrict;

    @Column(name = "destination_district", nullable = false)
    private String destinationDistrict;

    @Column(name = "cost_per_kg", nullable = false)
    private BigDecimal costPerKg;

    @Column(name = "distance_km", nullable = false)
    private BigDecimal distanceKm;

    @Column(name = "transit_time_hours", nullable = false)
    private Integer transitTimeHours;

    @Column(name = "verified_provider_name")
    private String verifiedProviderName;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.lastUpdated = LocalDateTime.now();
    }
}
