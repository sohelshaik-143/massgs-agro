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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produce listing not found with ID: " + request.getProduceListingId()));

        List<MarketPrice> recentPrices = marketPriceRepository.findRecentPricesForCrop(listing.getCrop().getId(), LocalDate.now().minusDays(7));
        if (recentPrices.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No verified market price available for crop '" + listing.getCrop().getName() + "'. Simulation requires verified market data.");
        }

        MarketPrice baseMarketPrice = recentPrices.get(0);
        BigDecimal basePrice = baseMarketPrice.getModalPricePerKg();

        CalculationInput input = CalculationInput.builder()
                .quantityKg(listing.getQuantityKg())
                .pricePerKg(basePrice)
                .priceDate(baseMarketPrice.getArrivalDate())
                .priceQualityStatus(baseMarketPrice.getDataQualityStatus())
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
                .disclaimer("Simulated using verified " + baseMarketPrice.getMarket().getMandiName() +
                        " APMC modal price (₹" + basePrice + "/kg) and user-provided parameters.")
                .build());
    }
}
