package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "aggregation_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AggregationMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private AggregationGroup group;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produce_listing_id", nullable = false)
    private ProduceListing produceListing;

    @Column(name = "contributed_quantity_kg", nullable = false)
    private BigDecimal contributedQuantityKg;

    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        this.joinedAt = LocalDateTime.now();
    }
}
