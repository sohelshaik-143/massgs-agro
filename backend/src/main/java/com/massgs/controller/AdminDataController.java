package com.massgs.controller;

import com.massgs.dto.DataMonitoringDto;
import com.massgs.entity.DataIngestionRun;
import com.massgs.entity.DataSourceInfo;
import com.massgs.repository.DataIngestionRunRepository;
import com.massgs.repository.DataSourceRepository;
import com.massgs.repository.MarketPriceRepository;
import com.massgs.service.ingestion.AgmarknetIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDataController {

    private final DataSourceRepository dataSourceRepository;
    private final DataIngestionRunRepository ingestionRunRepository;
    private final MarketPriceRepository marketPriceRepository;
    private final AgmarknetIngestionService ingestionService;

    @GetMapping("/data-monitoring")
    public ResponseEntity<DataMonitoringDto.SystemHealthStatus> getSystemDataHealth() {
        List<DataSourceInfo> sources = dataSourceRepository.findAll();
        List<DataIngestionRun> recentRuns = ingestionRunRepository.findTop10ByOrderByExecutionTimestampDesc();

        long totalPrices = marketPriceRepository.count();
        long staleCount = marketPriceRepository.findAll().stream()
                .filter(p -> "STALE".equalsIgnoreCase(p.getDataQualityStatus()))
                .count();

        List<DataMonitoringDto.SourceSummary> sourceSummaries = sources.stream().map(s -> DataMonitoringDto.SourceSummary.builder()
                .id(s.getId())
                .name(s.getName())
                .providerUrl(s.getProviderUrl())
                .status(s.getStatus())
                .lastSuccessfulIngestion(s.getLastSuccessfulIngestion())
                .totalRecordCount(s.getTotalRecordCount())
                .staleRecordCount(s.getStaleRecordCount())
                .build()).collect(Collectors.toList());

        List<DataMonitoringDto.IngestionRunSummary> runSummaries = recentRuns.stream().map(r -> DataMonitoringDto.IngestionRunSummary.builder()
                .id(r.getId())
                .dataSourceName(r.getDataSource().getName())
                .executionTimestamp(r.getExecutionTimestamp())
                .status(r.getStatus())
                .recordsProcessed(r.getRecordsProcessed())
                .recordsFailed(r.getRecordsFailed())
                .logDetails(r.getLogDetails())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(DataMonitoringDto.SystemHealthStatus.builder()
                .dataSources(sourceSummaries)
                .recentIngestionRuns(runSummaries)
                .totalVerifiedPricesCount(totalPrices)
                .stalePricesCount(staleCount)
                .dataIntegrityRule("ABSOLUTE DATA INTEGRITY: System strictly forbids fake prices, fake buyers, or unverified AI scores.")
                .build());
    }

    @PostMapping("/trigger-ingestion")
    public ResponseEntity<DataMonitoringDto.IngestionRunSummary> triggerIngestion() {
        DataIngestionRun run = ingestionService.ingestVerifiedSnapshot();
        return ResponseEntity.ok(DataMonitoringDto.IngestionRunSummary.builder()
                .id(run.getId())
                .dataSourceName(run.getDataSource().getName())
                .executionTimestamp(run.getExecutionTimestamp())
                .status(run.getStatus())
                .recordsProcessed(run.getRecordsProcessed())
                .recordsFailed(run.getRecordsFailed())
                .logDetails(run.getLogDetails())
                .build());
    }
}
