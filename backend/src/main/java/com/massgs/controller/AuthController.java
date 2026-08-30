package com.massgs.controller;

import com.massgs.dto.AuthDto;
import com.massgs.entity.Buyer;
import com.massgs.entity.Farmer;
import com.massgs.entity.User;
import com.massgs.repository.BuyerRepository;
import com.massgs.repository.FarmerRepository;
import com.massgs.repository.UserRepository;
import com.massgs.security.UserPrincipal;
import com.massgs.service.OtpAuthService;
import com.massgs.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final OtpAuthService otpAuthService;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;

    @PostMapping("/otp/request")
    public ResponseEntity<AuthDto.OtpRequestResponse> requestOtp(@Valid @RequestBody AuthDto.OtpRequestDto request) {
        return ResponseEntity.ok(otpAuthService.requestOtp(request));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthDto.AuthResponse> verifyOtp(@Valid @RequestBody AuthDto.OtpVerifyDto request) {
        return ResponseEntity.ok(otpAuthService.verifyOtp(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(userService.loginUser(request));
    }

    @GetMapping("/profile")
    public ResponseEntity<AuthDto.AuthResponse> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            return ResponseEntity.status(401).build();
        }

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));

        Long roleEntityId = null;
        if ("ROLE_FARMER".equals(user.getRole())) {
            roleEntityId = farmerRepository.findByUserId(user.getId()).map(Farmer::getId).orElse(null);
        } else if ("ROLE_BUYER".equals(user.getRole())) {
            roleEntityId = buyerRepository.findByUserId(user.getId()).map(Buyer::getId).orElse(null);
        }

        return ResponseEntity.ok(AuthDto.AuthResponse.builder()
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
                .build());
    }
}
