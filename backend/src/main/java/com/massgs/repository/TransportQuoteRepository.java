package com.massgs.repository;

import com.massgs.entity.TransportQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransportQuoteRepository extends JpaRepository<TransportQuote, Long> {
    Optional<TransportQuote> findByOriginDistrictIgnoreCaseAndDestinationDistrictIgnoreCase(
            String originDistrict, String destinationDistrict);
}
