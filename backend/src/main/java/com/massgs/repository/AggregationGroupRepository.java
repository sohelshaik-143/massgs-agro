package com.massgs.repository;

import com.massgs.entity.AggregationGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AggregationGroupRepository extends JpaRepository<AggregationGroup, Long> {
    List<AggregationGroup> findByCropIdAndTargetDistrictAndStatus(Long cropId, String district, String status);
    List<AggregationGroup> findByStatusOrderByCreatedAtDesc(String status);
}
