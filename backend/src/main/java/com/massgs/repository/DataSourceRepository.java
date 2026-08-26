package com.massgs.repository;

import com.massgs.entity.DataSourceInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DataSourceRepository extends JpaRepository<DataSourceInfo, Long> {
    Optional<DataSourceInfo> findByName(String name);
}
