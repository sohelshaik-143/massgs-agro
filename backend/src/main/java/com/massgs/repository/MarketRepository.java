package com.massgs.repository;

import com.massgs.entity.Market;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface MarketRepository extends JpaRepository<Market, Long> {
    Optional<Market> findByMandiNameAndDistrictAndState(String mandiName, String district, String state);
    List<Market> findByStateOrderByMandiNameAsc(String state);
    List<Market> findByDistrictOrderByMandiNameAsc(String district);
}
