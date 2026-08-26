package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recommendation_factors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id", nullable = false)
    private Recommendation recommendation;

    @Column(name = "factor_key", nullable = false)
    private String factorKey;

    @Column(name = "factor_value")
    private String factorValue;

    @Column(name = "factor_unit")
    private String factorUnit;

    @Column(name = "missing_flag")
    private Boolean missingFlag;

    @Column(columnDefinition = "TEXT")
    private String description;
}
