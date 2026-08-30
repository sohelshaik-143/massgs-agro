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
    void testFeedback_WhenTransactionNotCompleted_ThrowsException() {
        MarketplaceTransaction txn = MarketplaceTransaction.builder()
                .id(1L)
                .transactionCode("TXN-20260830-123456")
                .farmer(farmer)
                .buyer(buyer)
                .crop(crop)
                .agreedPricePerKg(new BigDecimal("200"))
                .quantityKg(new BigDecimal("500"))
                .totalAmount(new BigDecimal("100000"))
                .status("IN_PROGRESS")
                .build();

        when(transactionRepository.findById(1L)).thenReturn(Optional.of(txn));

        assertThatThrownBy(() -> workflowService.submitFeedback(MarketplaceDto.SubmitFeedbackRequest.builder()
                .transactionId(1L)
                .rating(5)
                .comment("Excellent quality produce")
                .build(), buyerUser))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("COMPLETED");
    }
}
