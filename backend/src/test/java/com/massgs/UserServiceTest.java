package com.massgs;

import com.massgs.dto.AuthDto;
import com.massgs.entity.Buyer;
import com.massgs.entity.Farmer;
import com.massgs.entity.User;
import com.massgs.repository.BuyerRepository;
import com.massgs.repository.FarmerRepository;
import com.massgs.repository.UserRepository;
import com.massgs.security.JwtTokenProvider;
import com.massgs.service.AuditService;
import com.massgs.service.OtpAuthService;
import com.massgs.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FarmerRepository farmerRepository;
    @Mock
    private BuyerRepository buyerRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider tokenProvider;
    @Mock
    private OtpAuthService otpAuthService;
    @Mock
    private AuditService auditService;
    @Mock
    private Authentication authentication;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository,
                farmerRepository,
                buyerRepository,
                passwordEncoder,
                authenticationManager,
                tokenProvider,
                otpAuthService,
                auditService
        );
    }

    @Test
    void testRegisterFarmer_Success_GeneratesPermanentId() {
        when(userRepository.existsByEmail("farmer@test.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("9876543210")).thenReturn(false);
        when(otpAuthService.generatePermanentMassgsId("ROLE_FARMER")).thenReturn("MASSGS-F-8K42P7Q9");
        when(passwordEncoder.encode("secret123")).thenReturn("$2a$10$hashedPassword");

        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(10L);
            return u;
        });
        when(farmerRepository.save(any(Farmer.class))).thenAnswer(i -> {
            Farmer f = i.getArgument(0);
            f.setId(100L);
            return f;
        });

        AuthDto.AuthResponse res = userService.registerUser(AuthDto.RegisterRequest.builder()
                .fullName("Venkat Reddy")
                .email("farmer@test.com")
                .phoneNumber("9876543210")
                .password("secret123")
                .confirmPassword("secret123")
                .role("FARMER")
                .district("Guntur")
                .state("Andhra Pradesh")
                .build());

        assertThat(res.getMassgsId()).isEqualTo("MASSGS-F-8K42P7Q9");
        assertThat(res.getFullName()).isEqualTo("Venkat Reddy");
        assertThat(res.getRole()).isEqualTo("ROLE_FARMER");
        assertThat(res.getMessage()).contains("Account created successfully");
        verify(userRepository, times(1)).save(any(User.class));
        verify(farmerRepository, times(1)).save(any(Farmer.class));
    }

    @Test
    void testRegisterBuyer_Success_GeneratesBuyerId() {
        when(userRepository.existsByEmail("buyer@test.com")).thenReturn(false);
        when(otpAuthService.generatePermanentMassgsId("ROLE_BUYER")).thenReturn("MASSGS-B-4H91XK27");
        when(passwordEncoder.encode("buyerpass")).thenReturn("$2a$10$hashedBuyerPassword");

        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(20L);
            return u;
        });
        when(buyerRepository.save(any(Buyer.class))).thenAnswer(i -> {
            Buyer b = i.getArgument(0);
            b.setId(200L);
            return b;
        });

        AuthDto.AuthResponse res = userService.registerUser(AuthDto.RegisterRequest.builder()
                .fullName("Krishna Trading")
                .email("buyer@test.com")
                .password("buyerpass")
                .confirmPassword("buyerpass")
                .role("BUYER")
                .organizationName("Krishna Agro Enterprises")
                .build());

        assertThat(res.getMassgsId()).isEqualTo("MASSGS-B-4H91XK27");
        assertThat(res.getRole()).isEqualTo("ROLE_BUYER");
        verify(buyerRepository, times(1)).save(any(Buyer.class));
    }

    @Test
    void testRegister_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.registerUser(AuthDto.RegisterRequest.builder()
                .fullName("Test User")
                .email("existing@test.com")
                .password("password123")
                .role("FARMER")
                .build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void testLogin_WithValidCredentials_ReturnsTokenAndProfile() {
        User user = User.builder()
                .id(10L)
                .massgsId("MASSGS-F-8K42P7Q9")
                .email("farmer@test.com")
                .fullName("Venkat Reddy")
                .role("ROLE_FARMER")
                .passwordHash("$2a$10$hashedPassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateToken(authentication)).thenReturn("jwt.token.valid");
        when(userRepository.findByEmail("farmer@test.com")).thenReturn(Optional.of(user));
        when(farmerRepository.findByUserId(10L)).thenReturn(Optional.of(Farmer.builder().id(100L).build()));

        AuthDto.AuthResponse res = userService.loginUser(AuthDto.LoginRequest.builder()
                .identifier("farmer@test.com")
                .password("secret123")
                .build());

        assertThat(res.getToken()).isEqualTo("jwt.token.valid");
        assertThat(res.getMassgsId()).isEqualTo("MASSGS-F-8K42P7Q9");
        assertThat(res.getFullName()).isEqualTo("Venkat Reddy");
    }

    @Test
    void testLogin_WithInvalidPassword_ThrowsException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> userService.loginUser(AuthDto.LoginRequest.builder()
                .identifier("farmer@test.com")
                .password("wrongpassword")
                .build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void testForgotPassword_AndResetPassword_Success() {
        User user = User.builder()
                .id(10L)
                .massgsId("MASSGS-F-8K42P7Q9")
                .email("farmer@test.com")
                .passwordHash("oldHash")
                .build();

        when(userRepository.findByEmail("farmer@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        AuthDto.ForgotPasswordResponse forgotRes = userService.forgotPassword(AuthDto.ForgotPasswordRequest.builder()
                .identifier("farmer@test.com")
                .build());

        assertThat(forgotRes.getResetToken()).isNotNull();
        String token = forgotRes.getResetToken();

        user.setPasswordResetToken(token);
        user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(15));
        when(userRepository.findByPasswordResetToken(token)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newSecret123")).thenReturn("$2a$10$newHashedPassword");

        AuthDto.AuthResponse resetRes = userService.resetPassword(AuthDto.ResetPasswordRequest.builder()
                .token(token)
                .newPassword("newSecret123")
                .build());

        assertThat(resetRes.getMessage()).contains("Password has been reset successfully");
        assertThat(user.getPasswordHash()).isEqualTo("$2a$10$newHashedPassword");
        assertThat(user.getPasswordResetToken()).isNull();
    }
}
