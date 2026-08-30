package com.massgs.repository;

import com.massgs.entity.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BuyerRepository extends JpaRepository<Buyer, Long> {
    Optional<Buyer> findByUserId(Long userId);
    Optional<Buyer> findByMassgsId(String massgsId);
    List<Buyer> findByVerifiedStatusNot(String verifiedStatus);
    List<Buyer> findByDistrictIgnoreCase(String district);
}
