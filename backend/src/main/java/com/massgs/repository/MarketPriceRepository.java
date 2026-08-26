package com.massgs.repository;

import com.massgs.entity.MarketPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MarketPriceRepository extends JpaRepository<MarketPrice, Long> {

    List<MarketPrice> findByCropIdOrderByArrivalDateDesc(Long cropId);

    @Query("SELECT mp FROM MarketPrice mp WHERE mp.crop.id = :cropId AND mp.market.id = :marketId ORDER BY mp.arrivalDate DESC")
    List<MarketPrice> findLatestByCropAndMarket(@Param("cropId") Long cropId, @Param("marketId") Long marketId);

    Optional<MarketPrice> findByMarketIdAndCropIdAndArrivalDateAndVarietyName(
            Long marketId, Long cropId, LocalDate arrivalDate, String varietyName);

    @Query("SELECT mp FROM MarketPrice mp WHERE mp.crop.id = :cropId AND mp.arrivalDate >= :sinceDate ORDER BY mp.modalPricePerKg DESC")
    List<MarketPrice> findRecentPricesForCrop(@Param("cropId") Long cropId, @Param("sinceDate") LocalDate sinceDate);
}
