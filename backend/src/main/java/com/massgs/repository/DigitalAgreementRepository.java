package com.massgs.repository;

import com.massgs.entity.DigitalAgreement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DigitalAgreementRepository extends JpaRepository<DigitalAgreement, Long> {

    Optional<DigitalAgreement> findByAgreementCode(String agreementCode);

    Optional<DigitalAgreement> findByOfferId(Long offerId);

    List<DigitalAgreement> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    List<DigitalAgreement> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);
}
