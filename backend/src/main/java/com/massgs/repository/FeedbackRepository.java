package com.massgs.repository;

import com.massgs.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findByRevieweeIdOrderByCreatedAtDesc(Long revieweeUserId);

    Optional<Feedback> findByTransactionIdAndReviewerId(Long transactionId, Long reviewerUserId);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.reviewee.id = :userId")
    Double getAverageRatingForUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.reviewee.id = :userId")
    long countReviewsForUser(@Param("userId") Long userId);
}
