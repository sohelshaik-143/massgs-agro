package com.massgs.service;

import com.massgs.entity.Location;
import com.massgs.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final LocationRepository locationRepository;

    @PostConstruct
    public void initLocations() {
        try {
            seedAuthoritativeLocations();
        } catch (Exception e) {
            log.error("Failed to seed location hierarchy", e);
        }
    }

    @Transactional
    public void seedAuthoritativeLocations() {
        if (locationRepository.count() > 0) {
            return;
        }

        // Andhra Pradesh - Guntur District
        addLocation("Guntur", "Guntur Urban", "Guntur", "Andhra Pradesh", "522001", true);
        addLocation("Tenali", "Tenali", "Guntur", "Andhra Pradesh", "522201", true);
        addLocation("Mangalagiri", "Mangalagiri", "Guntur", "Andhra Pradesh", "522503", false);
        addLocation("Duggirala", "Duggirala", "Guntur", "Andhra Pradesh", "522330", true);
        addLocation("Ponnur", "Ponnur", "Guntur", "Andhra Pradesh", "522124", true);
        addLocation("Medikonduru", "Medikonduru", "Guntur", "Andhra Pradesh", "522438", false);
        addLocation("Prathipadu", "Prathipadu", "Guntur", "Andhra Pradesh", "522019", false);
        addLocation("Tadikonda", "Tadikonda", "Guntur", "Andhra Pradesh", "522236", false);

        // Palnadu District
        addLocation("Narasaraopet", "Narasaraopet", "Palnadu", "Andhra Pradesh", "522601", true);
        addLocation("Chilakaluripet", "Chilakaluripet", "Palnadu", "Andhra Pradesh", "522616", true);
        addLocation("Piduguralla", "Piduguralla", "Palnadu", "Andhra Pradesh", "522413", true);
        addLocation("Sattenapalle", "Sattenapalle", "Palnadu", "Andhra Pradesh", "522403", true);
        addLocation("Macherla", "Macherla", "Palnadu", "Andhra Pradesh", "522426", false);

        // Bapatla District
        addLocation("Bapatla", "Bapatla", "Bapatla", "Andhra Pradesh", "522101", true);
        addLocation("Chirala", "Chirala", "Bapatla", "Andhra Pradesh", "523155", true);
        addLocation("Repalle", "Repalle", "Bapatla", "Andhra Pradesh", "522265", true);

        // Chittoor & Tirupati Districts
        addLocation("Chittoor", "Chittoor", "Chittoor", "Andhra Pradesh", "517001", true);
        addLocation("Palamaner", "Palamaner", "Chittoor", "Andhra Pradesh", "517408", true);
        addLocation("Nagari", "Nagari", "Chittoor", "Andhra Pradesh", "517590", false);
        addLocation("Kuppam", "Kuppam", "Chittoor", "Andhra Pradesh", "517425", true);
        addLocation("Tirupati", "Tirupati Urban", "Tirupati", "Andhra Pradesh", "517501", true);
        addLocation("Srikalahasti", "Srikalahasti", "Tirupati", "Andhra Pradesh", "517644", true);
        addLocation("Gudur", "Gudur", "Tirupati", "Andhra Pradesh", "524101", true);
        addLocation("Chandragiri", "Chandragiri", "Tirupati", "Andhra Pradesh", "517101", false);

        // Annamayya District
        addLocation("Madanapalle", "Madanapalle", "Annamayya", "Andhra Pradesh", "517325", true);
        addLocation("Rayachoti", "Rayachoti", "Annamayya", "Andhra Pradesh", "516269", true);
        addLocation("Rajampet", "Rajampet", "Annamayya", "Andhra Pradesh", "516115", true);

        // Kurnool & Nandyal Districts
        addLocation("Kurnool", "Kurnool Urban", "Kurnool", "Andhra Pradesh", "518001", true);
        addLocation("Adoni", "Adoni", "Kurnool", "Andhra Pradesh", "518301", true);
        addLocation("Yemmiganur", "Yemmiganur", "Kurnool", "Andhra Pradesh", "518360", true);
        addLocation("Kodumur", "Kodumur", "Kurnool", "Andhra Pradesh", "518464", false);
        addLocation("Nandyal", "Nandyal", "Nandyal", "Andhra Pradesh", "518501", true);
        addLocation("Allagadda", "Allagadda", "Nandyal", "Andhra Pradesh", "518543", true);
        addLocation("Dhone", "Dhone", "Nandyal", "Andhra Pradesh", "518222", true);

        // Krishna & NTR Districts
        addLocation("Machilipatnam", "Machilipatnam", "Krishna", "Andhra Pradesh", "521001", true);
        addLocation("Gudivada", "Gudivada", "Krishna", "Andhra Pradesh", "521301", true);
        addLocation("Nuzvid", "Nuzvid", "Krishna", "Andhra Pradesh", "521201", true);
        addLocation("Vijayawada", "Vijayawada Urban", "NTR", "Andhra Pradesh", "520001", true);
        addLocation("Nandigama", "Nandigama", "NTR", "Andhra Pradesh", "521185", true);
        addLocation("Jaggayyapeta", "Jaggayyapeta", "NTR", "Andhra Pradesh", "521175", true);

        // East Godavari, West Godavari, Kakinada, Konaseema
        addLocation("Rajahmundry", "Rajahmundry Urban", "East Godavari", "Andhra Pradesh", "533101", true);
        addLocation("Kovvur", "Kovvur", "East Godavari", "Andhra Pradesh", "534350", true);
        addLocation("Eluru", "Eluru", "Eluru", "Andhra Pradesh", "534001", true);
        addLocation("Tadepalligudem", "Tadepalligudem", "West Godavari", "Andhra Pradesh", "534101", true);
        addLocation("Bhimavaram", "Bhimavaram", "West Godavari", "Andhra Pradesh", "534201", true);
        addLocation("Palakollu", "Palakollu", "West Godavari", "Andhra Pradesh", "534260", true);
        addLocation("Kakinada", "Kakinada Urban", "Kakinada", "Andhra Pradesh", "533001", true);
        addLocation("Peddapuram", "Peddapuram", "Kakinada", "Andhra Pradesh", "533437", true);
        addLocation("Amalapuram", "Amalapuram", "Dr. B.R. Ambedkar Konaseema", "Andhra Pradesh", "533201", true);
        addLocation("Ravulapalem", "Ravulapalem", "Dr. B.R. Ambedkar Konaseema", "Andhra Pradesh", "533238", true);

        // Anantapur & Sri Sathya Sai
        addLocation("Anantapur", "Anantapur", "Anantapur", "Andhra Pradesh", "515001", true);
        addLocation("Guntakal", "Guntakal", "Anantapur", "Andhra Pradesh", "515801", true);
        addLocation("Tadipatri", "Tadipatri", "Anantapur", "Andhra Pradesh", "515411", true);
        addLocation("Hindupur", "Hindupur", "Sri Sathya Sai", "Andhra Pradesh", "515201", true);
        addLocation("Dharmavaram", "Dharmavaram", "Sri Sathya Sai", "Andhra Pradesh", "515671", true);
        addLocation("Kadiri", "Kadiri", "Sri Sathya Sai", "Andhra Pradesh", "515591", true);

        // YSR Kadapa, SPSR Nellore, Prakasam
        addLocation("Kadapa", "Kadapa", "YSR Kadapa", "Andhra Pradesh", "516001", true);
        addLocation("Proddatur", "Proddatur", "YSR Kadapa", "Andhra Pradesh", "516360", true);
        addLocation("Pulivendula", "Pulivendula", "YSR Kadapa", "Andhra Pradesh", "516390", true);
        addLocation("Nellore", "Nellore", "SPSR Nellore", "Andhra Pradesh", "524001", true);
        addLocation("Kavali", "Kavali", "SPSR Nellore", "Andhra Pradesh", "524201", true);
        addLocation("Ongole", "Ongole", "Prakasam", "Andhra Pradesh", "523001", true);
        addLocation("Markapur", "Markapur", "Prakasam", "Andhra Pradesh", "523316", true);
        addLocation("Chirala", "Chirala", "Prakasam", "Andhra Pradesh", "523155", true);

        // Visakhapatnam, Vizianagaram, Srikakulam
        addLocation("Visakhapatnam", "Visakhapatnam Urban", "Visakhapatnam", "Andhra Pradesh", "530001", true);
        addLocation("Anakapalli", "Anakapalli", "Anakapalli", "Andhra Pradesh", "531001", true);
        addLocation("Vizianagaram", "Vizianagaram", "Vizianagaram", "Andhra Pradesh", "535001", true);
        addLocation("Srikakulam", "Srikakulam", "Srikakulam", "Andhra Pradesh", "532001", true);

        // Telangana Districts
        addLocation("Hyderabad", "Hyderabad", "Hyderabad", "Telangana", "500001", true);
        addLocation("Warangal", "Warangal", "Warangal", "Telangana", "506001", true);
        addLocation("Khammam", "Khammam", "Khammam", "Telangana", "507001", true);
        addLocation("Nizamabad", "Nizamabad", "Nizamabad", "Telangana", "503001", true);
        addLocation("Karimnagar", "Karimnagar", "Karimnagar", "Telangana", "505001", true);
        addLocation("Nalgonda", "Nalgonda", "Nalgonda", "Telangana", "508001", true);
        addLocation("Mahabubnagar", "Mahabubnagar", "Mahabubnagar", "Telangana", "509001", true);
        addLocation("Adilabad", "Adilabad", "Adilabad", "Telangana", "504001", true);
        addLocation("Suryapet", "Suryapet", "Suryapet", "Telangana", "508213", true);
        addLocation("Siddipet", "Siddipet", "Siddipet", "Telangana", "502103", true);
    }

    private void addLocation(String village, String mandal, String district, String state, String pincode, boolean isApmc) {
        locationRepository.save(Location.builder()
                .village(village)
                .mandal(mandal)
                .district(district)
                .state(state)
                .pincode(pincode)
                .isApmcHub(isApmc)
                .build());
    }

    public List<Location> search(String query) {
        if (query == null || query.trim().isBlank()) {
            return locationRepository.findAll().stream().limit(50).toList();
        }
        return locationRepository.searchLocations(query.trim());
    }

    public List<String> getDistricts(String state) {
        String st = (state != null && !state.isBlank()) ? state : "Andhra Pradesh";
        return locationRepository.findDistinctDistrictsByState(st);
    }

    public List<String> getMandals(String district) {
        return locationRepository.findDistinctMandalsByDistrict(district);
    }

    public List<String> getVillages(String mandal) {
        return locationRepository.findDistinctVillagesByMandal(mandal);
    }
}
