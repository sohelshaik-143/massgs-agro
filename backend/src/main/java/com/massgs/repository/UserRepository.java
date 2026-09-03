package com.massgs.repository;

import com.massgs.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByMassgsId(String massgsId);
    Optional<User> findByMassgsIdIgnoreCase(String massgsId);
    Optional<User> findByPasswordResetToken(String passwordResetToken);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByMassgsId(String massgsId);
    boolean existsByMassgsIdIgnoreCase(String massgsId);
}
