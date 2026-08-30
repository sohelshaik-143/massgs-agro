package com.massgs.repository;

import com.massgs.entity.ProduceListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduceListingRepository extends JpaRepository<ProduceListing, Long> {
    List<ProduceListing> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<ProduceListing> findByStatusOrderByCreatedAtDesc(String status);
    List<ProduceListing> findByCropIdAndLocationStateAndStatus(Long cropId, String state, String status);
    List<ProduceListing> findByCropIdAndLocationDistrictAndStatus(Long cropId, String district, String status);
    List<ProduceListing> findByCropIdAndStatus(Long cropId, String status);

    @Query("SELECT p FROM ProduceListing p WHERE p.status = 'AVAILABLE' AND (" +
           "LOWER(p.crop.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(p.crop.teluguName IS NOT NULL AND LOWER(p.crop.teluguName) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "LOWER(p.locationDistrict) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(p.locationMandal IS NOT NULL AND LOWER(p.locationMandal) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(p.locationVillage IS NOT NULL AND LOWER(p.locationVillage) LIKE LOWER(CONCAT('%', :query, '%'))))")
    List<ProduceListing> searchActiveListings(@Param("query") String query);
}
