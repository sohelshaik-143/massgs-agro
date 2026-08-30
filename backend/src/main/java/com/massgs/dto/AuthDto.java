package com.massgs.dto;

import jakarta.validation.constraints.Email;
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
        @Email
        private String email;

        @NotBlank
        private String password;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String password;

        @NotBlank
        private String fullName;

        @NotBlank
        private String role; // ROLE_FARMER, ROLE_BUYER, ROLE_ADMIN

        private String phoneNumber;
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
    }
}
