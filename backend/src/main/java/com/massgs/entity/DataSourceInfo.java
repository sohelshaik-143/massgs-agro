package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataSourceInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "provider_url", nullable = false)
    private String providerUrl;

    @Column(nullable = false)
    private String status; // CONNECTED, DEGRADED, DISCONNECTED

    @Column(name = "last_successful_ingestion")
    private LocalDateTime lastSuccessfulIngestion;

    @Column(name = "total_record_count")
    private Integer totalRecordCount;

    @Column(name = "stale_record_count")
    private Integer staleRecordCount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.totalRecordCount == null) this.totalRecordCount = 0;
        if (this.staleRecordCount == null) this.staleRecordCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
