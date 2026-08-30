package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "crop_aliases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropAlias {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Column(name = "alias_name", nullable = false, length = 100)
    private String aliasName;

    @Column(name = "language_code", length = 10)
    @Builder.Default
    private String languageCode = "te"; // te, en, hi, local

    @Column(name = "alias_type", length = 50)
    @Builder.Default
    private String aliasType = "REGIONAL_SYNONYM"; // TRANSLATION, MANDI_TERM, VARIETY, PHONETIC
}
