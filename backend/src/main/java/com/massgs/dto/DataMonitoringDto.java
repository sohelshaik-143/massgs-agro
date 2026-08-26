package com.massgs.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class DataMonitoringDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SourceSummary {
        private Long id;
        private String name;
        private String providerUrl;
        private String status; // CONNECTED, DEGRADED, DISCONNECTED
        private LocalDateTime lastSuccessfulIngestion;
        private Integer totalRecordCount;
        private Integer staleRecordCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IngestionRunSummary {
        private Long id;
        private String dataSourceName;
        private LocalDateTime executionTimestamp;
        private String status;
        private Integer recordsProcessed;
        private Integer recordsFailed;
        private String logDetails;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SystemHealthStatus {
        private List<SourceSummary> dataSources;
        private List<IngestionRunSummary> recentIngestionRuns;
        private long totalVerifiedPricesCount;
        private long stalePricesCount;
        private String dataIntegrityRule;
    }
}
