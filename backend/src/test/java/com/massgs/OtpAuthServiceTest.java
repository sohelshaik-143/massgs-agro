package com.massgs;

import com.massgs.dto.AuthDto;
import com.massgs.entity.OtpVerification;
import com.massgs.entity.User;
import com.massgs.repository.BuyerRepository;
import com.massgs.repository.FarmerRepository;
import com.massgs.repository.OtpVerificationRepository;
import com.massgs.repository.UserRepository;
import com.massgs.security.JwtTokenProvider;
import com.massgs.service.AuditService;
import com.massgs.service.OtpAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OtpAuthServiceTest {

    @Mock
    private OtpVerificationRepository otpVerificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FarmerRepository farmerRepository;
    @Mock
    private BuyerRepository buyerRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider tokenProvider;
    @Mock
    private AuditService auditService;

    private OtpAuthService otpAuthService;

    @BeforeEach
    void setUp() {
        otpAuthService = new OtpAuthService(
                otpVerificationRepository,
                userRepository,
                farmerRepository,
                buyerRepository,
                passwordEncoder,
                tokenProvider,
                auditService
        );
    }

    @Test
    void testPermanentIdFormat() {
        String farmerId = otpAuthService.generatePermanentMassgsId("ROLE_FARMER");
        assertThat(farmerId).startsWith("MASSGS-F-");
        assertThat(farmerId.length()).isGreaterThanOrEqualTo(12);

        String buyerId = otpAuthService.generatePermanentMassgsId("ROLE_BUYER");
        assertThat(buyerId).startsWith("MASSGS-B-");

        String adminId = otpAuthService.generatePermanentMassgsId("ROLE_ADMIN");
        assertThat(adminId).startsWith("MASSGS-A-");
    }

    @Test
    void testRequestOtp_WhenValid_GeneratesExpiringOtp() {
        when(otpVerificationRepository.countRecentRequests(any(), any())).thenReturn(0L);
        when(otpVerificationRepository.findFirstByPhoneNumberAndIsVerifiedFalseOrderByCreatedAtDesc(any())).thenReturn(Optional.empty());
        when(otpVerificationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AuthDto.OtpRequestResponse response = otpAuthService.requestOtp(AuthDto.OtpRequestDto.builder()
                .phoneNumber("9876543210")
                .role("ROLE_FARMER")
                .fullName("Rami Reddy")
                .build());

        assertThat(response.getPhoneNumber()).isEqualTo("9876543210");
        assertThat(response.getExpiresInSeconds()).isEqualTo(300);
        assertThat(response.getResendCooldownSeconds()).isEqualTo(30);
        assertThat(response.getDebugOtpCode()).hasSize(6);
    }

    @Test
    void testRequestOtp_WhenRateLimitExceeded_ThrowsException() {
        when(otpVerificationRepository.countRecentRequests(any(), any())).thenReturn(5L);

        assertThatThrownBy(() -> otpAuthService.requestOtp(AuthDto.OtpRequestDto.builder()
                .phoneNumber("9876543210")
                .build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Too many OTP requests");
    }
}
