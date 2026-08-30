package com.massgs.repository;

import com.massgs.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findFirstByPhoneNumberAndIsVerifiedFalseOrderByCreatedAtDesc(String phoneNumber);

    @Query("SELECT COUNT(o) FROM OtpVerification o WHERE o.phoneNumber = :phone AND o.createdAt >= :since")
    long countRecentRequests(@Param("phone") String phoneNumber, @Param("since") LocalDateTime since);

    List<OtpVerification> findByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);
}
