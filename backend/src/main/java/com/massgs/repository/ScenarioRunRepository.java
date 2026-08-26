package com.massgs.repository;

import com.massgs.entity.ScenarioRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioRunRepository extends JpaRepository<ScenarioRun, Long> {
    List<ScenarioRun> findByProduceListingIdOrderByCreatedAtDesc(Long produceListingId);
}
