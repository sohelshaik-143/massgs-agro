package com.massgs.repository;

import com.massgs.entity.MarketplaceTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketplaceTransactionRepository extends JpaRepository<MarketplaceTransaction, Long> {

    Optional<MarketplaceTransaction> findByTransactionCode(String transactionCode);

    List<MarketplaceTransaction> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    List<MarketplaceTransaction> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    List<MarketplaceTransaction> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT COUNT(t) FROM MarketplaceTransaction t WHERE t.farmer.id = :farmerId AND t.status = 'COMPLETED'")
    long countCompletedByFarmerId(@Param("farmerId") Long farmerId);

    @Query("SELECT COUNT(t) FROM MarketplaceTransaction t WHERE t.buyer.id = :buyerId AND t.status = 'COMPLETED'")
    long countCompletedByBuyerId(@Param("buyerId") Long buyerId);
}
