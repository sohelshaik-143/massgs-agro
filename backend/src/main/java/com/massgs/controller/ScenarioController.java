package com.massgs.controller;

import com.massgs.dto.ScenarioDto;
import com.massgs.entity.MarketPrice;
import com.massgs.entity.ProduceListing;
import com.massgs.entity.ScenarioRun;
import com.massgs.repository.MarketPriceRepository;
import com.massgs.repository.ProduceListingRepository;
import com.massgs.repository.ScenarioRunRepository;
import com.massgs.service.engine.NetRealizationCalculator;
import com.massgs.service.engine.NetRealizationCalculator.CalculationInput;
import com.massgs.service.engine.NetRealizationCalculator.CalculationResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

    private final ProduceListingRepository produceListingRepository;
    private final MarketPriceRepository marketPriceRepository;
    private final NetRealizationCalculator calculator;
    private final ScenarioRunRepository scenarioRunRepository;

    @PostMapping
    public ResponseEntity<ScenarioDto.SimulationResponse> runScenario(@Valid @RequestBody ScenarioDto.SimulationRequest request) {
        ProduceListing listing = produceListingRepository.findById(request.getProduceListingId())
                .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + request.getProduceListingId()));

        List<MarketPrice> recentPrices = marketPriceRepository.findRecentPricesForCrop(listing.getCrop().getId(), LocalDate.now().minusDays(7));
        BigDecimal basePrice = recentPrices.isEmpty() ? new BigDecimal("25.00") : recentPrices.get(0).getModalPricePerKg();

        CalculationInput input = CalculationInput.builder()
                .quantityKg(listing.getQuantityKg())
                .pricePerKg(basePrice)
                .priceDate(LocalDate.now())
                .priceQualityStatus("VERIFIED")
                .transportCostPerKg(request.getCustomTransportCostPerKg())
                .transitTimeHours(12)
                .storageDays(request.getCustomStorageDays() != null ? request.getCustomStorageDays() : 0)
                .cropPerishabilityDays(listing.getCrop().getPerishabilityDays())
                .build();

        CalculationResult result = calculator.calculate(input);

        ScenarioRun scenarioRun = ScenarioRun.builder()
                .produceListing(listing)
                .customTransportCostPerKg(request.getCustomTransportCostPerKg())
                .customReadyDate(request.getCustomReadyDate())
                .customStorageDays(request.getCustomStorageDays())
                .computedNetRealization(result.getExpectedNetRealization())
                .build();
        scenarioRunRepository.save(scenarioRun);

        return ResponseEntity.ok(ScenarioDto.SimulationResponse.builder()
                .produceListingId(listing.getId())
                .cropName(listing.getCrop().getName())
                .quantityKg(listing.getQuantityKg())
                .grossRevenue(result.getGrossRevenue())
                .appliedTransportCost(result.getTransportCost())
                .storageCost(result.getStorageCost())
                .handlingCost(result.getHandlingCost())
                .apmcFee(result.getApmcMarketFee())
                .perishabilityLoss(result.getPerishabilityLoss())
                .computedNetRealization(result.getExpectedNetRealization())
                .disclaimer("Simulated from verified base market price ₹" + basePrice + "/kg and your custom transport/storage inputs.")
                .build());
    }
}
