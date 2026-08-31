package com.massgs;

import com.massgs.dto.MarketplaceDto;
import com.massgs.entity.*;
import com.massgs.repository.*;
import com.massgs.service.AuditService;
import com.massgs.service.MarketplaceWorkflowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MarketplaceWorkflowTest {

    @Mock
    private OfferRepository offerRepository;
    @Mock
    private DigitalAgreementRepository agreementRepository;
    @Mock
    private MarketplaceTransactionRepository transactionRepository;
    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private DisputeRepository disputeRepository;
    @Mock
    private ProduceListingRepository produceListingRepository;
    @Mock
    private FarmerRepository farmerRepository;
    @Mock
    private BuyerRepository buyerRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditService auditService;

    private MarketplaceWorkflowService workflowService;

    private User farmerUser;
    private User buyerUser;
    private Farmer farmer;
    private Buyer buyer;
    private Crop crop;
    private ProduceListing listing;

    @BeforeEach
    void setUp() {
        workflowService = new MarketplaceWorkflowService(
                offerRepository,
                agreementRepository,
                transactionRepository,
                feedbackRepository,
                disputeRepository,
                produceListingRepository,
                farmerRepository,
                buyerRepository,
                userRepository,
                auditService
        );

        farmerUser = User.builder().id(10L).massgsId("MASSGS-F-111111").fullName("Farmer Venkat").role("ROLE_FARMER").isPhoneVerified(true).build();
        buyerUser = User.builder().id(20L).massgsId("MASSGS-B-222222").fullName("Buyer Krishna").role("ROLE_BUYER").isPhoneVerified(true).build();

        farmer = Farmer.builder().id(1L).massgsId("MASSGS-F-111111").user(farmerUser).district("Guntur").state("Andhra Pradesh").build();
        buyer = Buyer.builder().id(2L).massgsId("MASSGS-B-222222").user(buyerUser).organizationName("Krishna Agro").district("Guntur").state("Andhra Pradesh").build();
        crop = Crop.builder().id(1L).name("Red Chilli").teluguName("ఎర్ర మిరప").category("SEMI_PERISHABLE").perishabilityDays(60).build();

        listing = ProduceListing.builder()
                .id(100L)
                .farmer(farmer)
                .crop(crop)
                .quantityKg(new BigDecimal("1000"))
                .locationDistrict("Guntur")
                .locationState("Andhra Pradesh")
                .expectedPricePerUnit(new BigDecimal("220.00"))
                .status("AVAILABLE")
                .readyDate(LocalDate.now())
                .build();
    }

    @Test
    void testCreateOffer_WhenValid_SavesOfferAndReturnsDto() {
        when(produceListingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(buyerRepository.findByUserId(20L)).thenReturn(Optional.of(buyer));
        when(offerRepository.save(any())).thenAnswer(i -> {
            Offer o = i.getArgument(0);
            o.setId(500L);
            return o;
        });

        MarketplaceDto.OfferResponse response = workflowService.createOffer(MarketplaceDto.CreateOfferRequest.builder()
                .produceListingId(100L)
                .offeredPricePerKg(new BigDecimal("215.00"))
                .offeredQuantityKg(new BigDecimal("500"))
                .deliveryTerms("FARM_GATE_PICKUP")
                .build(), buyerUser);

        assertThat(response.getOfferCode()).startsWith("OFR-");
        assertThat(response.getOfferedPricePerKg()).isEqualTo(new BigDecimal("215.00"));
        assertThat(response.getOfferedQuantityKg()).isEqualTo(new BigDecimal("500"));
        assertThat(response.getTotalAmount()).isEqualTo(new BigDecimal("107500.00"));
        assertThat(response.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void testRespondToOffer_AcceptFirstOffer_Success() {
        Offer offer1 = Offer.builder()
                .id(501L)
                .offerCode("OFR-20260831-501")
                .produceListing(listing)
                .buyer(buyer)
                .farmer(farmer)
                .offeredPricePerKg(new BigDecimal("210.00"))
                .offeredQuantityKg(new BigDecimal("500"))
                .totalAmount(new BigDecimal("105000.00"))
                .status("PENDING")
                .build();

        when(offerRepository.findById(501L)).thenReturn(Optional.of(offer1));
        when(offerRepository.findByFarmerIdOrderByCreatedAtDesc(1L)).thenReturn(java.util.Collections.emptyList());
        when(offerRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(agreementRepository.save(any())).thenAnswer(i -> {
            DigitalAgreement a = i.getArgument(0);
            a.setId(901L);
            return a;
        });

        MarketplaceDto.OfferResponse response = workflowService.respondToOffer(501L, "ACCEPT", null, farmerUser);

        assertThat(response.getStatus()).isEqualTo("ACCEPTED");
        verify(agreementRepository, times(1)).save(any(DigitalAgreement.class));
    }

    @Test
    void testRespondToOffer_AcceptDuplicateOfferSameBuyerSameCrop_ThrowsIllegalStateException() {
        Offer offerAlreadyAccepted = Offer.builder()
                .id(501L)
                .offerCode("OFR-20260831-501")
                .produceListing(listing)
                .buyer(buyer)
                .farmer(farmer)
                .offeredPricePerKg(new BigDecimal("210.00"))
                .offeredQuantityKg(new BigDecimal("500"))
                .totalAmount(new BigDecimal("105000.00"))
                .status("ACCEPTED")
                .build();

        Offer secondOfferSameBuyerSameCrop = Offer.builder()
                .id(502L)
                .offerCode("OFR-20260831-502")
                .produceListing(listing)
                .buyer(buyer)
                .farmer(farmer)
                .offeredPricePerKg(new BigDecimal("215.00"))
                .offeredQuantityKg(new BigDecimal("400"))
                .totalAmount(new BigDecimal("86000.00"))
                .status("PENDING")
                .build();

        when(offerRepository.findById(502L)).thenReturn(Optional.of(secondOfferSameBuyerSameCrop));
        when(offerRepository.findByFarmerIdOrderByCreatedAtDesc(1L)).thenReturn(java.util.List.of(offerAlreadyAccepted, secondOfferSameBuyerSameCrop));

        assertThatThrownBy(() -> workflowService.respondToOffer(502L, "ACCEPT", null, farmerUser))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Multiple accepted offers from the same buyer for the same crop are not allowed");

        verify(agreementRepository, never()).save(any());
    }

    @Test
    void testRespondToOffer_AcceptOfferSameBuyerDifferentCrop_Success() {
        Crop tomato = Crop.builder().id(2L).name("Tomato").teluguName("టమోటా").build();
        ProduceListing tomatoListing = ProduceListing.builder()
                .id(101L)
                .farmer(farmer)
                .crop(tomato)
                .quantityKg(new BigDecimal("500"))
                .build();

        Offer chiliAcceptedOffer = Offer.builder()
                .id(501L)
                .offerCode("OFR-20260831-501")
                .produceListing(listing) // Red Chilli
                .buyer(buyer)
                .farmer(farmer)
                .status("ACCEPTED")
                .build();

        Offer tomatoOfferSameBuyer = Offer.builder()
                .id(503L)
                .offerCode("OFR-20260831-503")
                .produceListing(tomatoListing) // Tomato (different crop)
                .buyer(buyer) // Same buyer
                .farmer(farmer)
                .offeredPricePerKg(new BigDecimal("35.00"))
                .offeredQuantityKg(new BigDecimal("500"))
                .totalAmount(new BigDecimal("17500.00"))
                .status("PENDING")
                .build();

        when(offerRepository.findById(503L)).thenReturn(Optional.of(tomatoOfferSameBuyer));
        when(offerRepository.findByFarmerIdOrderByCreatedAtDesc(1L)).thenReturn(java.util.List.of(chiliAcceptedOffer, tomatoOfferSameBuyer));
        when(offerRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(agreementRepository.save(any())).thenAnswer(i -> {
            DigitalAgreement a = i.getArgument(0);
            a.setId(902L);
            return a;
        });

        MarketplaceDto.OfferResponse response = workflowService.respondToOffer(503L, "ACCEPT", null, farmerUser);

        assertThat(response.getStatus()).isEqualTo("ACCEPTED");
        verify(agreementRepository, times(1)).save(any(DigitalAgreement.class));
    }

    @Test
    void testRespondToOffer_AcceptOfferDifferentBuyerSameCrop_Success() {
        User buyer2User = User.builder().id(21L).massgsId("MASSGS-B-333333").fullName("Buyer Rao").role("ROLE_BUYER").build();
        Buyer buyer2 = Buyer.builder().id(3L).massgsId("MASSGS-B-333333").user(buyer2User).organizationName("Rao Agro").build();

        Offer buyer1AcceptedOffer = Offer.builder()
                .id(501L)
                .offerCode("OFR-20260831-501")
                .produceListing(listing)
                .buyer(buyer)
                .farmer(farmer)
                .status("ACCEPTED")
                .build();

        Offer buyer2OfferSameCrop = Offer.builder()
                .id(504L)
                .offerCode("OFR-20260831-504")
                .produceListing(listing)
                .buyer(buyer2) // Different buyer
                .farmer(farmer)
                .offeredPricePerKg(new BigDecimal("225.00"))
                .offeredQuantityKg(new BigDecimal("500"))
                .totalAmount(new BigDecimal("112500.00"))
                .status("PENDING")
                .build();

        when(offerRepository.findById(504L)).thenReturn(Optional.of(buyer2OfferSameCrop));
        when(offerRepository.findByFarmerIdOrderByCreatedAtDesc(1L)).thenReturn(java.util.List.of(buyer1AcceptedOffer, buyer2OfferSameCrop));
        when(offerRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(agreementRepository.save(any())).thenAnswer(i -> {
            DigitalAgreement a = i.getArgument(0);
            a.setId(903L);
            return a;
        });

        MarketplaceDto.OfferResponse response = workflowService.respondToOffer(504L, "ACCEPT", null, farmerUser);

        assertThat(response.getStatus()).isEqualTo("ACCEPTED");
        verify(agreementRepository, times(1)).save(any(DigitalAgreement.class));
    }
}
