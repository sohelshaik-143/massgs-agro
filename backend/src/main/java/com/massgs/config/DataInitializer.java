package com.massgs.config;

import com.massgs.entity.Buyer;
import com.massgs.entity.Farmer;
import com.massgs.entity.User;
import com.massgs.repository.BuyerRepository;
import com.massgs.repository.FarmerRepository;
import com.massgs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedDemoFarmer();
        seedDemoBuyer();
    }

    private void seedDemoFarmer() {
        String farmerEmail = "farmer.venkat@massgs.com";
        String farmerMassgsId = "MASSGS-F-8K42P7Q9";
        String farmerPhone = "9123456780";

        if (userRepository.findByEmailIgnoreCase(farmerEmail).isEmpty() &&
            userRepository.findByMassgsIdIgnoreCase(farmerMassgsId).isEmpty()) {

            User farmerUser = User.builder()
                    .massgsId(farmerMassgsId)
                    .email(farmerEmail)
                    .phoneNumber(farmerPhone)
                    .passwordHash(passwordEncoder.encode("password123"))
                    .fullName("Venkat Farmer")
                    .role("ROLE_FARMER")
                    .isPhoneVerified(true)
                    .accountStatus("ACTIVE")
                    .district("Guntur")
                    .state("Andhra Pradesh")
                    .mandal("Tenali")
                    .village("Angalakuduru")
                    .build();

            farmerUser = userRepository.save(farmerUser);

            if (farmerRepository.findByUserId(farmerUser.getId()).isEmpty()) {
                Farmer farmer = Farmer.builder()
                        .massgsId(farmerMassgsId)
                        .user(farmerUser)
                        .district("Guntur")
                        .state("Andhra Pradesh")
                        .mandal("Tenali")
                        .village("Angalakuduru")
                        .preferredLanguage("te")
                        .build();
                farmerRepository.save(farmer);
            }
            log.info("Initialized default Demo Farmer: {} ({})", farmerEmail, farmerMassgsId);
        }
    }

    private void seedDemoBuyer() {
        String buyerEmail = "procurement@coastalagro.com";
        String buyerMassgsId = "MASSGS-B-4H91XK27";
        String buyerPhone = "9876543210";

        if (userRepository.findByEmailIgnoreCase(buyerEmail).isEmpty() &&
            userRepository.findByMassgsIdIgnoreCase(buyerMassgsId).isEmpty()) {

            User buyerUser = User.builder()
                    .massgsId(buyerMassgsId)
                    .email(buyerEmail)
                    .phoneNumber(buyerPhone)
                    .passwordHash(passwordEncoder.encode("password123"))
                    .fullName("Coastal Agro Procurement")
                    .role("ROLE_BUYER")
                    .isPhoneVerified(true)
                    .accountStatus("ACTIVE")
                    .district("Guntur")
                    .state("Andhra Pradesh")
                    .mandal("Guntur Urban")
                    .village("Market Yard")
                    .build();

            buyerUser = userRepository.save(buyerUser);

            if (buyerRepository.findByUserId(buyerUser.getId()).isEmpty()) {
                Buyer buyer = Buyer.builder()
                        .massgsId(buyerMassgsId)
                        .user(buyerUser)
                        .organizationName("Coastal Agro Procurement Ltd")
                        .buyerType("APMC_TRADER")
                        .verifiedStatus("VERIFIED_PLATFORM")
                        .provenanceIndicator("Verified Platform Buyer")
                        .contactEmail(buyerEmail)
                        .contactPhone(buyerPhone)
                        .district("Guntur")
                        .state("Andhra Pradesh")
                        .mandal("Guntur Urban")
                        .village("Market Yard")
                        .build();
                buyerRepository.save(buyer);
            }
            log.info("Initialized default Demo Buyer: {} ({})", buyerEmail, buyerMassgsId);
        }
    }
}
