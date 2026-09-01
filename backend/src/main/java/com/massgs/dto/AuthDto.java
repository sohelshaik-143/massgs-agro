package com.massgs.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class AuthDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OtpRequestDto {
        @NotBlank
        private String phoneNumber;

        private String role; // ROLE_FARMER, ROLE_BUYER, ROLE_ADMIN
        private String fullName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OtpRequestResponse {
        private String phoneNumber;
        private int expiresInSeconds;
        private int resendCooldownSeconds;
        private String message;
        private String debugOtpCode;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OtpVerifyDto {
        @NotBlank
        private String phoneNumber;

        @NotBlank
        private String otpCode;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank
        private String identifier; // Email, Mobile number, or MASSGS User ID

        @NotBlank
        private String password;

        // Fallback for legacy JSON using 'email' field
        public String getIdentifier() {
            if (identifier != null && !identifier.isBlank()) {
                return identifier;
            }
            return email;
        }

        private String email;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank
        private String fullName;

        private String email;

        private String phoneNumber;

        @NotBlank
        private String password;

        private String confirmPassword;

        @NotBlank
        private String role; // FARMER or BUYER (or ROLE_FARMER / ROLE_BUYER)

        private String district;
        private String state;
        private String mandal;
        private String village;
        private String organizationName;
        private String buyerType;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForgotPasswordRequest {
        @NotBlank
        private String identifier; // Email or Mobile Number
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForgotPasswordResponse {
        private String message;
        private String resetToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResetPasswordRequest {
        @NotBlank
        private String token;

        @NotBlank
        private String newPassword;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        private String massgsId;
        private String email;
        private String phoneNumber;
        private String fullName;
        private String role;
        private String district;
        private String state;
        private Long userId;
        private Long roleEntityId;
        private String message;
    }
}
