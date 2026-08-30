package com.massgs.repository;

import com.massgs.entity.BuyerRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BuyerRequirementRepository extends JpaRepository<BuyerRequirement, Long> {

    @Query("SELECT br FROM BuyerRequirement br WHERE br.crop.id = :cropId AND br.status = 'ACTIVE' AND br.validUntil >= :currentDate ORDER BY br.createdAt DESC")
    List<BuyerRequirement> findActiveRequirementsForCrop(@Param("cropId") Long cropId, @Param("currentDate") LocalDate currentDate);

    @Query("SELECT br FROM BuyerRequirement br WHERE br.status = 'ACTIVE' AND br.validUntil >= :currentDate ORDER BY br.createdAt DESC")
    List<BuyerRequirement> findAllActiveRequirements(@Param("currentDate") LocalDate currentDate);

    List<BuyerRequirement> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    @Query("SELECT br FROM BuyerRequirement br WHERE br.status = 'ACTIVE' AND br.validUntil >= :currentDate AND (" +
           "LOWER(br.crop.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(br.crop.teluguName IS NOT NULL AND LOWER(br.crop.teluguName) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "LOWER(br.targetDistrict) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(br.buyer.organizationName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<BuyerRequirement> searchActiveDemands(@Param("query") String query, @Param("currentDate") LocalDate currentDate);
}
