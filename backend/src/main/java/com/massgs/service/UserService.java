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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered.");
        }

        String role = request.getRole();
        if (role == null || !role.startsWith("ROLE_")) {
            role = "ROLE_FARMER";
        }

        String massgsId = otpAuthService.generatePermanentMassgsId(role);

        User user = User.builder()
                .massgsId(massgsId)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(role)
                .phoneNumber(request.getPhoneNumber())
                .district(request.getDistrict())
                .state(request.getState())
                .village(request.getVillage())
                .mandal(request.getMandal())
                .isPhoneVerified(request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank())
                .build();
        user = userRepository.save(user);

        Long roleEntityId = null;

        if ("ROLE_FARMER".equals(role)) {
            String district = request.getDistrict() != null ? request.getDistrict() : "Guntur";
            String state = request.getState() != null ? request.getState() : "Andhra Pradesh";
            Farmer farmer = Farmer.builder()
                    .massgsId(massgsId)
                    .user(user)
                    .district(district)
                    .state(state)
                    .village(request.getVillage())
                    .mandal(request.getMandal())
                    .build();
            farmer = farmerRepository.save(farmer);
            roleEntityId = farmer.getId();
        } else if ("ROLE_BUYER".equals(role)) {
            String org = request.getOrganizationName() != null ? request.getOrganizationName() : request.getFullName() + " Agri Trading";
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
                    .district(request.getDistrict())
                    .state(request.getState())
                    .village(request.getVillage())
                    .mandal(request.getMandal())
                    .build();
            buyer = buyerRepository.save(buyer);
            roleEntityId = buyer.getId();
        }

        auditService.logAction(user.getId(), "USER_REGISTERED", "User", user.getId(), "Registered with role: " + role + " and MASSGS ID: " + massgsId);

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        String token = tokenProvider.generateToken(auth);

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

    public AuthDto.AuthResponse loginUser(AuthDto.LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        String token = tokenProvider.generateToken(auth);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Long roleEntityId = null;
        if ("ROLE_FARMER".equals(user.getRole())) {
            roleEntityId = farmerRepository.findByUserId(user.getId()).map(Farmer::getId).orElse(null);
        } else if ("ROLE_BUYER".equals(user.getRole())) {
            roleEntityId = buyerRepository.findByUserId(user.getId()).map(Buyer::getId).orElse(null);
        }

        auditService.logAction(user.getId(), "USER_LOGIN", "User", user.getId(), "User logged in with MASSGS ID: " + user.getMassgsId());

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
}
