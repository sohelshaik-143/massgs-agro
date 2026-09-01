package com.massgs.service;

import com.massgs.dto.AuthDto;
import com.massgs.entity.Buyer;
import com.massgs.entity.Farmer;
import com.massgs.entity.User;
import com.massgs.repository.BuyerRepository;
import com.massgs.repository.FarmerRepository;
import com.massgs.repository.UserRepository;
import com.massgs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final OtpAuthService otpAuthService;
    private final AuditService auditService;

    @Transactional
    public AuthDto.AuthResponse registerUser(AuthDto.RegisterRequest request) {
        if (request.getFullName() == null || request.getFullName().trim().isBlank()) {
            throw new IllegalArgumentException("Full Name is required.");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }

        if (request.getConfirmPassword() != null && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match. Please confirm your password.");
        }

        String rawEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        String rawPhone = request.getPhoneNumber() != null ? request.getPhoneNumber().replaceAll("[^0-9]", "") : null;

        if ((rawEmail == null || rawEmail.isBlank()) && (rawPhone == null || rawPhone.isBlank())) {
            throw new IllegalArgumentException("Please provide an Email address or Mobile Number.");
        }

        if (rawEmail != null && !rawEmail.isBlank() && userRepository.existsByEmail(rawEmail)) {
            throw new IllegalArgumentException("An account with this email address already exists.");
        }

        if (rawPhone != null && !rawPhone.isBlank() && userRepository.existsByPhoneNumber(rawPhone)) {
            throw new IllegalArgumentException("An account with this mobile number already exists.");
        }

        String role = request.getRole();
        if (role == null || role.isBlank()) {
            role = "ROLE_FARMER";
        }
        String normalizedRole = role.toUpperCase().trim();
        if (!normalizedRole.startsWith("ROLE_")) {
            normalizedRole = "ROLE_" + normalizedRole;
        }
        if (!"ROLE_FARMER".equals(normalizedRole) && !"ROLE_BUYER".equals(normalizedRole) && !"ROLE_ADMIN".equals(normalizedRole)) {
            normalizedRole = "ROLE_FARMER";
        }

        // Generate permanent unique MASSGS User ID (e.g. MASSGS-F-8K42P7Q9 / MASSGS-B-4H91XK27)
        String massgsId = otpAuthService.generatePermanentMassgsId(normalizedRole);

        String finalEmail = (rawEmail != null && !rawEmail.isBlank())
                ? rawEmail
                : ("user-" + massgsId.toLowerCase().replace("-", "") + "@massgs.local");

        User user = User.builder()
                .massgsId(massgsId)
                .email(finalEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(normalizedRole)
                .phoneNumber(rawPhone)
                .district(request.getDistrict() != null ? request.getDistrict() : "Guntur")
                .state(request.getState() != null ? request.getState() : "Andhra Pradesh")
                .village(request.getVillage())
                .mandal(request.getMandal())
                .accountStatus("ACTIVE")
                .isPhoneVerified(rawPhone != null && !rawPhone.isBlank())
                .build();

        user = userRepository.save(user);

        Long roleEntityId = null;

        if ("ROLE_FARMER".equals(normalizedRole)) {
            Farmer farmer = Farmer.builder()
                    .massgsId(massgsId)
                    .user(user)
                    .district(user.getDistrict())
                    .state(user.getState())
                    .village(request.getVillage())
                    .mandal(request.getMandal())
                    .build();
            farmer = farmerRepository.save(farmer);
            roleEntityId = farmer.getId();
        } else if ("ROLE_BUYER".equals(normalizedRole)) {
            String org = request.getOrganizationName() != null && !request.getOrganizationName().isBlank()
                    ? request.getOrganizationName().trim()
                    : request.getFullName().trim() + " Agro Trading";
            String buyerType = request.getBuyerType() != null ? request.getBuyerType() : "LOCAL_BUYER";
            Buyer buyer = Buyer.builder()
                    .massgsId(massgsId)
                    .user(user)
                    .organizationName(org)
                    .buyerType(buyerType)
                    .verifiedStatus("VERIFIED_PLATFORM")
                    .provenanceIndicator("Verified Platform Buyer")
                    .contactEmail(user.getEmail())
                    .contactPhone(user.getPhoneNumber())
                    .district(user.getDistrict())
                    .state(user.getState())
                    .village(request.getVillage())
                    .mandal(request.getMandal())
                    .build();
            buyer = buyerRepository.save(buyer);
            roleEntityId = buyer.getId();
        }

        auditService.logAction(user.getId(), "USER_REGISTERED", "User", user.getId(),
                "Registered with role: " + normalizedRole + " and MASSGS ID: " + massgsId);

        return AuthDto.AuthResponse.builder()
                .token(null)
                .massgsId(user.getMassgsId())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .role(user.getRole())
                .district(user.getDistrict())
                .state(user.getState())
                .userId(user.getId())
                .roleEntityId(roleEntityId)
                .message("Account created successfully.")
                .build();
    }

    public AuthDto.AuthResponse loginUser(AuthDto.LoginRequest request) {
        String identifier = request.getIdentifier();
        if (identifier == null || identifier.trim().isBlank()) {
            throw new IllegalArgumentException("Please enter your email, mobile number, or MASSGS User ID.");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Please enter your password.");
        }

        String trimmedIdentifier = identifier.trim();

        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(trimmedIdentifier, request.getPassword()));
        } catch (AuthenticationException ex) {
            throw new IllegalArgumentException("Invalid credentials. Please check your email/mobile and password.");
        }

        String token = tokenProvider.generateToken(auth);

        // Find user by email, MASSGS ID, or phone
        Optional<User> userOpt = userRepository.findByEmail(trimmedIdentifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByMassgsId(trimmedIdentifier.toUpperCase());
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhoneNumber(trimmedIdentifier);
        }
        if (userOpt.isEmpty()) {
            String digitsOnly = trimmedIdentifier.replaceAll("[^0-9]", "");
            if (!digitsOnly.isEmpty()) {
                userOpt = userRepository.findByPhoneNumber(digitsOnly);
            }
        }

        User user = userOpt.orElseThrow(() ->
                new IllegalArgumentException("Invalid credentials. Please check your email/mobile and password."));

        Long roleEntityId = null;
        if ("ROLE_FARMER".equals(user.getRole())) {
            roleEntityId = farmerRepository.findByUserId(user.getId()).map(Farmer::getId).orElse(null);
        } else if ("ROLE_BUYER".equals(user.getRole())) {
            roleEntityId = buyerRepository.findByUserId(user.getId()).map(Buyer::getId).orElse(null);
        }

        auditService.logAction(user.getId(), "USER_LOGIN", "User", user.getId(),
                "User logged in with MASSGS ID: " + user.getMassgsId());

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
                .message("Login successful.")
                .build();
    }

    @Transactional
    public AuthDto.ForgotPasswordResponse forgotPassword(AuthDto.ForgotPasswordRequest request) {
        String identifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        if (identifier.isBlank()) {
            return AuthDto.ForgotPasswordResponse.builder()
                    .message("If an account exists for this mobile/email, password reset instructions have been generated.")
                    .build();
        }

        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhoneNumber(identifier.replaceAll("[^0-9]", ""));
        }
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByMassgsId(identifier.toUpperCase());
        }

        String resetToken = null;
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            resetToken = "RST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            user.setPasswordResetToken(resetToken);
            user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            auditService.logAction(user.getId(), "PASSWORD_RESET_REQUESTED", "User", user.getId(),
                    "Password reset token requested for " + user.getMassgsId());
        }

        return AuthDto.ForgotPasswordResponse.builder()
                .message("If an account exists for this mobile/email, password reset instructions have been generated.")
                .resetToken(resetToken)
                .build();
    }

    @Transactional
    public AuthDto.AuthResponse resetPassword(AuthDto.ResetPasswordRequest request) {
        if (request.getToken() == null || request.getToken().trim().isBlank()) {
            throw new IllegalArgumentException("Reset token is required.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long.");
        }

        User user = userRepository.findByPasswordResetToken(request.getToken().trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token."));

        if (user.getPasswordResetExpiresAt() == null || user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Password reset token has expired. Please request a new one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);

        auditService.logAction(user.getId(), "PASSWORD_RESET_SUCCESS", "User", user.getId(),
                "Password reset successfully for " + user.getMassgsId());

        return AuthDto.AuthResponse.builder()
                .massgsId(user.getMassgsId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .message("Password has been reset successfully. Please login with your new password.")
                .build();
    }
}
