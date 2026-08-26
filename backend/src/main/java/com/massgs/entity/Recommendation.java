package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produce_listing_id", nullable = false)
    private ProduceListing produceListing;

    @Column(name = "recommended_option_type", nullable = false)
    private String recommendedOptionType; // MANDI_SALE, DIRECT_BUYER, AGGREGATED_FPO

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recommended_market_id")
    private Market recommendedMarket;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recommended_buyer_id")
    private Buyer recommendedBuyer;

    @Column(name = "gross_revenue")
    private BigDecimal grossRevenue;

    @Column(name = "estimated_transport_cost")
    private BigDecimal estimatedTransportCost;

    @Column(name = "estimated_storage_cost")
    private BigDecimal estimatedStorageCost;

    @Column(name = "estimated_handling_cost")
    private BigDecimal estimatedHandlingCost;

    @Column(name = "estimated_perishability_loss")
    private BigDecimal estimatedPerishabilityLoss;

    @Column(name = "expected_net_realization")
    private BigDecimal expectedNetRealization;

    @Column(name = "recommendation_state", nullable = false)
    private String recommendationState; // RECOMMENDED, LIMITED_CONFIDENCE, NO_RELIABLE_RECOMMENDATION

    @Column(name = "explanation_summary", columnDefinition = "TEXT", nullable = false)
    private String explanationSummary;

    @Column(name = "confidence_score")
    private BigDecimal confidenceScore;

    @Column(name = "algorithm_version")
    private String algorithmVersion;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "recommendation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RecommendationFactor> factors = new ArrayList<>();

    @OneToMany(mappedBy = "recommendation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RecommendationSource> sources = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.algorithmVersion == null) this.algorithmVersion = "v1.0.0";
    }
}
