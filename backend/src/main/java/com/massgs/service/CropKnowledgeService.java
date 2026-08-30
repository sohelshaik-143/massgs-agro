package com.massgs.service;

import com.massgs.entity.Crop;
import com.massgs.entity.CropAlias;
import com.massgs.repository.CropAliasRepository;
import com.massgs.repository.CropRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CropKnowledgeService {

    private final CropRepository cropRepository;
    private final CropAliasRepository cropAliasRepository;

    @PostConstruct
    public void initCropKnowledge() {
        try {
            seedCanonicalCrops();
        } catch (Exception e) {
            log.error("Failed to seed canonical crops knowledge", e);
        }
    }

    @Transactional
    public void seedCanonicalCrops() {
        registerCropWithAliases("Paddy", "వరి", "STAPLE", 180, "kg",
                "Primary staple cereal crop of Andhra Pradesh and Telangana.",
                List.of("Rice", "Dhan", "Paddy (Dhan)", "వడ్లు", "బియ్యం", "Sannalu", "BPT 5204", "HMT", "Samba Masuri", "Swarna", "వరి పంట"));

        registerCropWithAliases("Red Chilli", "ఎర్ర మిరప", "SEMI_PERISHABLE", 60, "kg",
                "World-famous Guntur commercial red chilli.",
                List.of("Chilli", "Chili", "Mirchi", "మిరప", "మిర్చి", "మిరపకాయ", "Teja", "Guntur Chilli", "Byadgi", "LCA 334", "మిరప పంట"));

        registerCropWithAliases("Tomato", "టమోటా", "PERISHABLE", 7, "kg",
                "Major vegetable crop grown extensively in Chittoor (Madanapalle), Anantapur, and Kurnool.",
                List.of("Tomato Hybrid", "Tamata", "టమాటో", "టమో", "Tamatar", "టమోటా పండు"));

        registerCropWithAliases("Onion", "ఉల్లిపాయ", "SEMI_PERISHABLE", 30, "kg",
                "Key kitchen staple from Kurnool, Kadapa, and Mahabubnagar mandis.",
                List.of("Kanda", "Pyaz", "ఉల్లి", "ఎర్ర ఉల్లి", "Piyaz", "Onions"));

        registerCropWithAliases("Cotton", "పత్తి", "COMMERCIAL", 180, "kg",
                "White gold cash crop in Guntur, Warangal, Adilabad, and Kurnool.",
                List.of("Kapas", "దూది", "Cotton Hybrid", "Bt Cotton", "పత్తి దూది", "పత్తి పంట"));

        registerCropWithAliases("Maize", "మొక్కజొన్న", "STAPLE", 90, "kg",
                "Major coarse cereal feed crop in Nizamabad, Karimnagar, Guntur.",
                List.of("Corn", "Makka", "మొక్కజొన్న కంకి", "Bhutta", "Makki"));

        registerCropWithAliases("Turmeric", "పసుపు", "SPICE", 180, "kg",
                "Renowned spice crop of Duggirala (AP) and Nizamabad (Telangana).",
                List.of("Haldi", "Pasupu", "పసుపు కొమ్ములు", "Duggirala Turmeric", "Nizamabad Turmeric", "Curcuma"));

        registerCropWithAliases("Groundnut", "వేరుశనగ", "SEMI_PERISHABLE", 90, "kg",
                "Major oilseed of Rayalaseema (Anantapur, Chittoor, Kurnool).",
                List.of("Peanut", "Pallilu", "వేరుశనక్కాయలు", "పల్లీలు", "Groundnut Pods", "Mungphali"));

        registerCropWithAliases("Bengal Gram", "శనగలు", "STAPLE", 120, "kg",
                "Major pulse crop of Kurnool and Prakasham districts.",
                List.of("Chana", "Gram", "Harbara", "శనగ", "శనగ పప్పు", "Chickpea"));

        registerCropWithAliases("Red Gram", "కందులు", "STAPLE", 120, "kg",
                "Essential protein pulse (Toor dal) grown across AP & Telangana.",
                List.of("Toor", "Tur", "Arhar", "కంది", "కందిపప్పు", "Pigeon Pea"));

        registerCropWithAliases("Mango", "మామిడి", "FRUIT", 10, "kg",
                "King of fruits with famous Banganapalli from Nuzvid & Chittoor.",
                List.of("Banganapalli", "Totapuri", "Benishan", "మామిడికాయలు", "మామిడి పండు", "Aam"));

        registerCropWithAliases("Sweet Orange", "బత్తాయి", "FRUIT", 20, "kg",
                "Major citrus fruit of Nalgonda and Anantapur.",
                List.of("Mosambi", "Battayi", "Cheeni", "బత్తాయి కాయలు", "Sweet Lime"));

        registerCropWithAliases("Sugarcane", "చెరకు", "COMMERCIAL", 15, "kg",
                "Commercial crop supporting coastal AP sugar mills.",
                List.of("Ganna", "Cheraku", "చెరకు గడలు", "Sugar Cane"));

        registerCropWithAliases("Tobacco", "పొగాకు", "COMMERCIAL", 180, "kg",
                "FCV Virginia tobacco grown in Guntur, Prakasam, and Godavari.",
                List.of("FCV Tobacco", "Pogaku", "వర్జీనియా పొగాకు", "Tobacco Leaf"));

        registerCropWithAliases("Banana", "అరటి", "FRUIT", 12, "kg",
                "Key fruit crop in Kadapa (Pulivendula), Godavari, and Guntur.",
                List.of("Kela", "Arati", "Grand Naine", "Yelakki", "అరటికాయలు", "అరటి పండ్లు"));

        registerCropWithAliases("Soybean", "సోయాబీన్", "COMMERCIAL", 90, "kg",
                "Major oilseed and protein crop in Adilabad and Nizamabad.",
                List.of("Soya", "Soyabean", "సోయా గింజలు", "Soy"));
    }

    private void registerCropWithAliases(String name, String teluguName, String category, int perishabilityDays,
                                         String standardUnit, String desc, List<String> aliases) {
        Crop crop = cropRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> cropRepository.save(Crop.builder()
                        .name(name)
                        .teluguName(teluguName)
                        .category(category)
                        .perishabilityDays(perishabilityDays)
                        .standardUnit(standardUnit)
                        .description(desc)
                        .build()));

        crop.setTeluguName(teluguName);
        crop.setDescription(desc);
        cropRepository.save(crop);

        for (String alias : aliases) {
            if (cropAliasRepository.findByAliasNameIgnoreCase(alias).isEmpty()) {
                cropAliasRepository.save(CropAlias.builder()
                        .crop(crop)
                        .aliasName(alias)
                        .languageCode(isTeluguScript(alias) ? "te" : "en")
                        .aliasType("REGIONAL_SYNONYM")
                        .build());
            }
        }
    }

    /**
     * Resolve a user-typed query to a canonical Crop, or return suggestions if fuzzy.
     */
    public CropSearchResult resolveCropQuery(String query) {
        if (query == null || query.trim().isBlank()) {
            return CropSearchResult.builder().status("EMPTY").build();
        }

        String clean = query.trim();

        // 1. Direct name match
        Optional<Crop> direct = cropRepository.findByNameIgnoreCase(clean);
        if (direct.isPresent()) {
            return CropSearchResult.builder()
                    .status("EXACT_MATCH")
                    .canonicalCrop(direct.get())
                    .build();
        }

        // 2. Direct Telugu name match
        List<Crop> allCrops = cropRepository.findAll();
        for (Crop c : allCrops) {
            if (c.getTeluguName() != null && c.getTeluguName().equalsIgnoreCase(clean)) {
                return CropSearchResult.builder()
                        .status("EXACT_MATCH")
                        .canonicalCrop(c)
                        .build();
            }
        }

        // 3. Exact Alias match
        Optional<CropAlias> aliasOpt = cropAliasRepository.findByAliasNameIgnoreCase(clean);
        if (aliasOpt.isPresent()) {
            return CropSearchResult.builder()
                    .status("EXACT_MATCH")
                    .canonicalCrop(aliasOpt.get().getCrop())
                    .matchedAlias(aliasOpt.get().getAliasName())
                    .build();
        }

        // 4. Substring / Fuzzy match for Suggestions ("Did you mean Paddy / వరి?")
        List<CropAlias> aliasMatches = cropAliasRepository.searchByAliasContaining(clean);
        Set<Crop> suggestedCrops = new LinkedHashSet<>();

        for (CropAlias ca : aliasMatches) {
            suggestedCrops.add(ca.getCrop());
        }

        for (Crop c : allCrops) {
            if (c.getName().toLowerCase().contains(clean.toLowerCase()) ||
                (c.getTeluguName() != null && c.getTeluguName().contains(clean))) {
                suggestedCrops.add(c);
            }
        }

        if (suggestedCrops.isEmpty()) {
            return CropSearchResult.builder()
                    .status("NO_MATCH")
                    .message("No verified crop found for '" + query + "'.")
                    .build();
        }

        Crop topSuggestion = suggestedCrops.iterator().next();
        String prompt = "Did you mean " + topSuggestion.getName() + " / " + 
                (topSuggestion.getTeluguName() != null ? topSuggestion.getTeluguName() : "") + "?";

        return CropSearchResult.builder()
                .status("UNCERTAIN_SUGGESTION")
                .canonicalCrop(topSuggestion)
                .suggestionPrompt(prompt)
                .allSuggestions(new ArrayList<>(suggestedCrops))
                .build();
    }

    public List<Crop> getAllCanonicalCrops() {
        return cropRepository.findAll();
    }

    private boolean isTeluguScript(String str) {
        if (str == null) return false;
        return str.codePoints().anyMatch(cp -> cp >= 0x0C00 && cp <= 0x0C7F);
    }

    @Getter
    @Builder
    public static class CropSearchResult {
        private String status; // EXACT_MATCH, UNCERTAIN_SUGGESTION, NO_MATCH, EMPTY
        private Crop canonicalCrop;
        private String matchedAlias;
        private String suggestionPrompt; // e.g. "Did you mean Paddy / వరి?"
        private List<Crop> allSuggestions;
        private String message;
    }
}
