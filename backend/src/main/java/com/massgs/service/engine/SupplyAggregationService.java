package com.massgs.service.engine;

import com.massgs.entity.AggregationGroup;
import com.massgs.entity.AggregationMember;
import com.massgs.entity.Crop;
import com.massgs.entity.ProduceListing;
import com.massgs.repository.AggregationGroupRepository;
import com.massgs.repository.ProduceListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplyAggregationService {

    private final ProduceListingRepository produceListingRepository;
    private final AggregationGroupRepository aggregationGroupRepository;

    @Transactional
    public List<AggregationGroup> findOrFormAggregationOpportunities(Crop crop, String district) {
        log.info("Checking genuine platform supply aggregation for crop: {}, district: {}", crop.getName(), district);

        List<ProduceListing> listings = produceListingRepository
                .findByCropIdAndLocationDistrictAndStatus(crop.getId(), district, "AVAILABLE");

        if (listings.size() < 2) {
            log.info("No sufficient verified platform supply found to form aggregation (found {} listings).", listings.size());
            return aggregationGroupRepository.findByCropIdAndTargetDistrictAndStatus(crop.getId(), district, "FORMING");
        }

        // Form or update active aggregation group from real platform listings
        List<AggregationGroup> existing = aggregationGroupRepository
                .findByCropIdAndTargetDistrictAndStatus(crop.getId(), district, "FORMING");

        AggregationGroup group;
        if (existing.isEmpty()) {
            group = AggregationGroup.builder()
                    .crop(crop)
                    .targetDistrict(district)
                    .totalQuantityKg(BigDecimal.ZERO)
                    .status("FORMING")
                    .build();
            group = aggregationGroupRepository.save(group);
        } else {
            group = existing.get(0);
        }

        BigDecimal totalQty = BigDecimal.ZERO;
        for (ProduceListing listing : listings) {
            boolean alreadyMember = group.getMembers().stream()
                    .anyMatch(m -> m.getProduceListing().getId().equals(listing.getId()));

            if (!alreadyMember) {
                AggregationMember member = AggregationMember.builder()
                        .group(group)
                        .produceListing(listing)
                        .contributedQuantityKg(listing.getQuantityKg())
                        .build();
                group.getMembers().add(member);
            }
            totalQty = totalQty.add(listing.getQuantityKg());
        }

        group.setTotalQuantityKg(totalQty);
        if (totalQty.compareTo(new BigDecimal("2000.00")) >= 0) {
            group.setStatus("READY_FOR_BULK_SALE");
        }

        aggregationGroupRepository.save(group);
        return List.of(group);
    }
}
