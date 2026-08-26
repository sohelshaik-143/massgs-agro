package com.massgs.controller;

import com.massgs.entity.Crop;
import com.massgs.entity.MarketPrice;
import com.massgs.repository.CropRepository;
import com.massgs.repository.MarketPriceRepository;
import com.massgs.service.ingestion.AgmarknetIngestionService;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/markets")
@RequiredArgsConstructor
public class MarketDataController {

    private final MarketPriceRepository marketPriceRepository;
    private final CropRepository cropRepository;
    private final AgmarknetIngestionService ingestionService;

    @GetMapping("/prices")
    public ResponseEntity<List<MarketPriceItem>> getVerifiedMarketPrices(
            @RequestParam(required = false) String crop,
            @RequestParam(required = false) String state) {

        List<MarketPrice> prices;
        if (crop != null && !crop.isBlank()) {
            Optional<Crop> cOpt = cropRepository.findByNameIgnoreCase(crop);
            if (cOpt.isPresent()) {
                prices = marketPriceRepository.findByCropIdOrderByArrivalDateDesc(cOpt.get().getId());
            } else {
                prices = Collections.emptyList();
            }
        } else {
            prices = marketPriceRepository.findAll();
        }

        if (state != null && !state.isBlank()) {
            prices = prices.stream()
                    .filter(p -> state.equalsIgnoreCase(p.getMarket().getState()))
                    .collect(Collectors.toList());
        }

        List<MarketPriceItem> items = prices.stream().map(p -> MarketPriceItem.builder()
                .id(p.getId())
                .mandiName(p.getMarket().getMandiName())
                .district(p.getMarket().getDistrict())
                .state(p.getMarket().getState())
                .cropName(p.getCrop().getName())
                .varietyName(p.getVarietyName())
                .minPricePerKg(p.getMinPricePerKg())
                .maxPricePerKg(p.getMaxPricePerKg())
                .modalPricePerKg(p.getModalPricePerKg())
                .arrivalDate(p.getArrivalDate())
                .dataSourceName(p.getDataSourceName())
                .sourceIdentifier(p.getSourceIdentifier())
                .dataQualityStatus(p.getDataQualityStatus())
                .freshnessDays(Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(p.getArrivalDate(), LocalDate.now())))
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(items);
    }

    @GetMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareMarkets(@RequestParam String cropName) {
        Optional<Crop> cOpt = cropRepository.findByNameIgnoreCase(cropName);
        if (cOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "status", "NO_RELIABLE_DATA",
                    "message", "No verified market data available for crop '" + cropName + "'."
            ));
        }

        List<MarketPrice> prices = marketPriceRepository.findRecentPricesForCrop(cOpt.get().getId(), LocalDate.now().minusDays(7));
        if (prices.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "status", "NO_RELIABLE_DATA",
                    "message", "Reliable market price data is currently unavailable for " + cropName + "."
            ));
        }

        List<MarketPriceItem> items = prices.stream().map(p -> MarketPriceItem.builder()
                .id(p.getId())
                .mandiName(p.getMarket().getMandiName())
                .district(p.getMarket().getDistrict())
                .state(p.getMarket().getState())
                .cropName(p.getCrop().getName())
                .varietyName(p.getVarietyName())
                .minPricePerKg(p.getMinPricePerKg())
                .maxPricePerKg(p.getMaxPricePerKg())
                .modalPricePerKg(p.getModalPricePerKg())
                .arrivalDate(p.getArrivalDate())
                .dataSourceName(p.getDataSourceName())
                .sourceIdentifier(p.getSourceIdentifier())
                .dataQualityStatus(p.getDataQualityStatus())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "status", "VERIFIED",
                "cropName", cropName,
                "markets", items
        ));
    }

    @Getter
    @Builder
    public static class MarketPriceItem {
        private Long id;
        private String mandiName;
        private String district;
        private String state;
        private String cropName;
        private String varietyName;
        private BigDecimal minPricePerKg;
        private BigDecimal maxPricePerKg;
        private BigDecimal modalPricePerKg;
        private LocalDate arrivalDate;
        private String dataSourceName;
        private String sourceIdentifier;
        private String dataQualityStatus;
        private long freshnessDays;
    }
}
