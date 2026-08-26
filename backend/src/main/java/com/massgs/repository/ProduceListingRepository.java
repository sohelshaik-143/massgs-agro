package com.massgs.repository;

import com.massgs.entity.ProduceListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduceListingRepository extends JpaRepository<ProduceListing, Long> {
    List<ProduceListing> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<ProduceListing> findByCropIdAndLocationStateAndStatus(Long cropId, String state, String status);
    List<ProduceListing> findByCropIdAndLocationDistrictAndStatus(Long cropId, String district, String status);
}
