package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "buyers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Buyer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "massgs_id", nullable = false, unique = true, length = 30)
    private String massgsId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "organization_name", nullable = false)
    private String organizationName;

    @Column(name = "buyer_type", nullable = false)
    @Builder.Default
    private String buyerType = "LOCAL_BUYER"; // INSTITUTIONAL, APMC_TRADER, PROCESSOR, EXPORTER, LOCAL_BUYER

    @Column(name = "verified_status", nullable = false)
    @Builder.Default
    private String verifiedStatus = "VERIFIED_PLATFORM"; // VERIFIED_PLATFORM, EXTERNAL_VERIFIED, UNVERIFIED

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    private String district;
    private String state;
    private String mandal;
    private String village;

    @Column(name = "provenance_indicator")
    @Builder.Default
    private String provenanceIndicator = "Verified Platform Buyer";

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
