package com.massgs.controller;

import com.massgs.entity.Location;
import com.massgs.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/search")
    public ResponseEntity<List<Location>> searchLocations(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(locationService.search(query));
    }

    @GetMapping("/districts")
    public ResponseEntity<List<String>> getDistricts(@RequestParam(required = false) String state) {
        return ResponseEntity.ok(locationService.getDistricts(state));
    }

    @GetMapping("/mandals")
    public ResponseEntity<List<String>> getMandals(@RequestParam String district) {
        return ResponseEntity.ok(locationService.getMandals(district));
    }

    @GetMapping("/villages")
    public ResponseEntity<List<String>> getVillages(@RequestParam String mandal) {
        return ResponseEntity.ok(locationService.getVillages(mandal));
    }
}
