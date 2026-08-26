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

    @Query("SELECT br FROM BuyerRequirement br WHERE br.crop.id = :cropId AND br.status = 'ACTIVE' AND br.validUntil >= :currentDate")
    List<BuyerRequirement> findActiveRequirementsForCrop(@Param("cropId") Long cropId, @Param("currentDate") LocalDate currentDate);
}
