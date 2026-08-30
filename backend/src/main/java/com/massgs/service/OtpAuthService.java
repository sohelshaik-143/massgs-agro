package com.massgs.service;

import com.massgs.dto.AuthDto;
import com.massgs.entity.Buyer;
import com.massgs.entity.Farmer;
import com.massgs.entity.OtpVerification;
import com.massgs.entity.User;
import com.massgs.repository.BuyerRepository;
import com.massgs.repository.FarmerRepository;
import com.massgs.repository.OtpVerificationRepository;
import com.massgs.repository.UserRepository;
import com.massgs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpAuthService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    private static final Random RANDOM = new SecureRandom();

    /**
     * Generate and send a 6-digit OTP to a mobile number with rate limiting and cooldown.
     */
    @Transactional
    public AuthDto.OtpRequestResponse requestOtp(AuthDto.OtpRequestDto request) {
        String phone = cleanPhoneNumber(request.getPhoneNumber());
        if (phone.length() < 10) {
            throw new IllegalArgumentException("Invalid phone number. Please enter a valid 10-digit mobile number.");
        }

        // Rate limiting: Max 5 OTP requests per hour per phone
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentCount = otpVerificationRepository.countRecentRequests(phone, oneHourAgo);
        if (recentCount >= 5) {
            throw new IllegalStateException("Too many OTP requests. Please wait an hour before requesting again.");
        }

        // Resend cooldown: 30 seconds
        Optional<OtpVerification> lastActiveOpt = otpVerificationRepository
                .findFirstByPhoneNumberAndIsVerifiedFalseOrderByCreatedAtDesc(phone);
        if (lastActiveOpt.isPresent()) {
            OtpVerification last = lastActiveOpt.get();
            if (last.getResendAvailableAt() != null && LocalDateTime.now().isBefore(last.getResendAvailableAt())) {
                long secondsLeft = java.time.Duration.between(LocalDateTime.now(), last.getResendAvailableAt()).getSeconds();
                throw new IllegalStateException("Please wait " + Math.max(1, secondsLeft) + " seconds before requesting a new OTP.");
            }
        }

        // Generate cryptographic 6-digit OTP
        String otpCode = String.format("%06d", RANDOM.nextInt(1000000));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(5);
        LocalDateTime resendAt = now.plusSeconds(30);

        String role = request.getRole() != null ? request.getRole() : "ROLE_FARMER";
        if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role.toUpperCase();
        }

        OtpVerification otp = OtpVerification.builder()
                .phoneNumber(phone)
                .otpCode(otpCode)
                .purpose("LOGIN")
                .role(role)
                .fullName(request.getFullName())
                .expiresAt(expiresAt)
                .resendAvailableAt(resendAt)
                .attempts(0)
                .maxAttempts(3)
                .isVerified(false)
                .build();

        otpVerificationRepository.save(otp);

        auditService.logAction(null, "OTP_REQUESTED", "OtpVerification", otp.getId(),
                "OTP requested for phone: " + maskPhone(phone) + ", role: " + role);

        log.info("OTP generated for {}: {} (Expires in 5 mins)", maskPhone(phone), otpCode);

        return AuthDto.OtpRequestResponse.builder()
                .phoneNumber(phone)
                .expiresInSeconds(300)
                .resendCooldownSeconds(30)
                .message("OTP sent successfully to " + maskPhone(phone) + ".")
                .debugOtpCode(otpCode) // Provided in development for seamless verification
                .build();
    }

    /**
     * Verify OTP and log in / register the user with a permanent MASSGS ID.
     */
    @Transactional
    public AuthDto.AuthResponse verifyOtp(AuthDto.OtpVerifyDto request) {
        String phone = cleanPhoneNumber(request.getPhoneNumber());
        String code = request.getOtpCode() != null ? request.getOtpCode().trim() : "";

        OtpVerification otp = otpVerificationRepository
                .findFirstByPhoneNumberAndIsVerifiedFalseOrderByCreatedAtDesc(phone)
                .orElseThrow(() -> new IllegalArgumentException("No active OTP request found for this number. Please request a new OTP."));

        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP.");
        }

        if (otp.getAttempts() >= otp.getMaxAttempts()) {
            throw new IllegalStateException("Maximum OTP verification attempts exceeded. Please request a new OTP.");
        }

        if (!otp.getOtpCode().equals(code)) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpVerificationRepository.save(otp);
            int remaining = otp.getMaxAttempts() - otp.getAttempts();
            throw new IllegalArgumentException("Incorrect OTP. " + remaining + " attempt(s) remaining.");
        }

        // Mark OTP as verified
        otp.setIsVerified(true);
        otpVerificationRepository.save(otp);

        // Find or create User with permanent MASSGS ID
        String role = otp.getRole() != null ? otp.getRole() : "ROLE_FARMER";
        Optional<User> userOpt = userRepository.findByPhoneNumber(phone);
        User user;
        Long roleEntityId;
        String massgsId;

        if (userOpt.isPresent()) {
            user = userOpt.get();
            user.setIsPhoneVerified(true);
            user = userRepository.save(user);
            massgsId = user.getMassgsId();

            if ("ROLE_FARMER".equals(user.getRole())) {
                roleEntityId = farmerRepository.findByUserId(user.getId()).map(Farmer::getId).orElse(null);
            } else {
                roleEntityId = buyerRepository.findByUserId(user.getId()).map(Buyer::getId).orElse(null);
            }
        } else {
            // Generate permanent MASSGS ID
            massgsId = generatePermanentMassgsId(role);
            String name = otp.getFullName() != null && !otp.getFullName().isBlank() 
                    ? otp.getFullName() 
                    : ("ROLE_BUYER".equals(role) ? "Buyer " + phone.substring(phone.length() - 4) : "Farmer " + phone.substring(phone.length() - 4));
            String email = phone + "@massgs.in";

            user = User.builder()
                    .massgsId(massgsId)
                    .phoneNumber(phone)
                    .isPhoneVerified(true)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(code + "_secure_pass"))
                    .fullName(name)
                    .role(role)
                    .district("Guntur")
                    .state("Andhra Pradesh")
                    .build();
            user = userRepository.save(user);

            if ("ROLE_FARMER".equals(role)) {
                Farmer farmer = farmerRepository.save(Farmer.builder()
                        .massgsId(massgsId)
                        .user(user)
                        .district("Guntur")
                        .state("Andhra Pradesh")
                        .preferredLanguage("en")
                        .build());
                roleEntityId = farmer.getId();
            } else {
                Buyer buyer = buyerRepository.save(Buyer.builder()
                        .massgsId(massgsId)
                        .user(user)
                        .organizationName(name + " Agri Trading")
                        .buyerType("LOCAL_BUYER")
                        .verifiedStatus("VERIFIED_PLATFORM")
                        .contactPhone(phone)
                        .contactEmail(email)
                        .district("Guntur")
                        .state("Andhra Pradesh")
                        .provenanceIndicator("Verified Platform Buyer")
                        .build());
                roleEntityId = buyer.getId();
            }
        }

        // Generate stateless JWT session token
        String token = tokenProvider.generateTokenFromEmail(user.getEmail());

        auditService.logAction(user.getId(), "OTP_LOGIN_SUCCESS", "User", user.getId(),
                "User logged in via OTP with MASSGS ID: " + massgsId);

        return AuthDto.AuthResponse.builder()
                .token(token)
                .massgsId(user.getMassgsId())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .role(user.getRole())
                .district(user.getDistrict())
                .state(user.getState())
                .userId(user.getId())
                .roleEntityId(roleEntityId)
                .build();
    }

    /**
     * Generate a unique, permanent, non-reusable MASSGS ID.
     * Format: MASSGS-F-XXXXXX (Farmer), MASSGS-B-XXXXXX (Buyer), MASSGS-A-XXXXXX (Admin)
     */
    public String generatePermanentMassgsId(String role) {
        String prefix = "MASSGS-F-";
        if ("ROLE_BUYER".equalsIgnoreCase(role) || "BUYER".equalsIgnoreCase(role)) {
            prefix = "MASSGS-B-";
        } else if ("ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)) {
            prefix = "MASSGS-A-";
        }

        String massgsId;
        int attempts = 0;
        do {
            int randomNum = 100000 + RANDOM.nextInt(900000);
            massgsId = prefix + randomNum;
            attempts++;
            if (attempts > 50) {
                massgsId = prefix + System.currentTimeMillis() % 1000000;
                break;
            }
        } while (userRepository.existsByMassgsId(massgsId));

        return massgsId;
    }

    private String cleanPhoneNumber(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^0-9]", "");
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) return phone;
        return phone.substring(0, 2) + "******" + phone.substring(phone.length() - 2);
    }
}
