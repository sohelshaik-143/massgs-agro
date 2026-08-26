package com.massgs.controller;

import com.massgs.entity.AggregationGroup;
import com.massgs.entity.Crop;
import com.massgs.repository.CropRepository;
import com.massgs.service.engine.SupplyAggregationService;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/aggregation")
@RequiredArgsConstructor
public class AggregationController {

    private final CropRepository cropRepository;
    private final SupplyAggregationService aggregationService;

    @GetMapping("/opportunities")
    public ResponseEntity<Object> getAggregationOpportunities(
            @RequestParam String cropName,
            @RequestParam String district) {

        Optional<Crop> cOpt = cropRepository.findByNameIgnoreCase(cropName);
        if (cOpt.isEmpty()) {
            return ResponseEntity.ok(java.util.Map.of(
                    "status", "NO_VERIFIED_AGGREGATION",
                    "message", "No verified farmer supply available for crop '" + cropName + "'."
            ));
        }

        List<AggregationGroup> groups = aggregationService.findOrFormAggregationOpportunities(cOpt.get(), district);

        if (groups.isEmpty()) {
            return ResponseEntity.ok(java.util.Map.of(
                    "status", "NO_VERIFIED_AGGREGATION",
                    "message", "No verified aggregation opportunity currently available in " + district + " for " + cropName + "."
            ));
        }

        List<AggregationGroupDto> dtos = groups.stream().map(g -> AggregationGroupDto.builder()
                .id(g.getId())
                .cropName(g.getCrop().getName())
                .targetDistrict(g.getTargetDistrict())
                .totalQuantityKg(g.getTotalQuantityKg())
                .status(g.getStatus())
                .farmerCount(g.getMembers().size())
                .members(g.getMembers().stream().map(m -> AggregationMemberItem.builder()
                        .produceListingId(m.getProduceListing().getId())
                        .farmerName(m.getProduceListing().getFarmer().getUser().getFullName())
                        .contributedQuantityKg(m.getContributedQuantityKg())
                        .build()).collect(Collectors.toList()))
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(java.util.Map.of(
                "status", "AVAILABLE",
                "opportunities", dtos
        ));
    }

    @Getter
    @Builder
    public static class AggregationGroupDto {
        private Long id;
        private String cropName;
        private String targetDistrict;
        private BigDecimal totalQuantityKg;
        private String status;
        private int farmerCount;
        private List<AggregationMemberItem> members;
    }

    @Getter
    @Builder
    public static class AggregationMemberItem {
        private Long produceListingId;
        private String farmerName;
        private BigDecimal contributedQuantityKg;
    }
}
