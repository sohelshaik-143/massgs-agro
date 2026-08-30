package com.massgs.repository;

import com.massgs.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    List<Offer> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    List<Offer> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    List<Offer> findByProduceListingIdOrderByCreatedAtDesc(Long produceListingId);

    Optional<Offer> findByOfferCode(String offerCode);
}
