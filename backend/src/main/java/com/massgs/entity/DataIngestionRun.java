package com.massgs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_ingestion_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataIngestionRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "data_source_id", nullable = false)
    private DataSourceInfo dataSource;

    @Column(name = "execution_timestamp")
    private LocalDateTime executionTimestamp;

    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, PARTIAL

    @Column(name = "records_processed")
    private Integer recordsProcessed;

    @Column(name = "records_failed")
    private Integer recordsFailed;

    @Column(name = "log_details", columnDefinition = "TEXT")
    private String logDetails;

    @PrePersist
    protected void onCreate() {
        this.executionTimestamp = LocalDateTime.now();
    }
}
