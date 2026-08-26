package com.massgs.repository;

import com.massgs.entity.DataIngestionRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataIngestionRunRepository extends JpaRepository<DataIngestionRun, Long> {
    List<DataIngestionRun> findTop10ByOrderByExecutionTimestampDesc();
}
