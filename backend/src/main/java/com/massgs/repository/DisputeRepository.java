package com.massgs.repository;

import com.massgs.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    Optional<Dispute> findByDisputeCode(String disputeCode);

    List<Dispute> findByRaisedByIdOrderByCreatedAtDesc(Long raisedByUserId);

    List<Dispute> findByAgainstUserIdOrderByCreatedAtDesc(Long againstUserId);

    List<Dispute> findByTransactionIdOrderByCreatedAtDesc(Long transactionId);

    List<Dispute> findByStatusOrderByCreatedAtDesc(String status);
}
