package com.massgs;

import com.massgs.controller.MarketDataController;
import com.massgs.entity.Crop;
import com.massgs.repository.*;
import com.massgs.service.ingestion.AgmarknetIngestionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CropSearchIntegrationTest {

    @Mock
    private MarketPriceRepository marketPriceRepository;

    @Mock
    private CropRepository cropRepository;

    @Mock
    private AgmarknetIngestionService ingestionService;

    @Mock
    private MarketRepository marketRepository;

    @Mock
    private DataSourceRepository dataSourceRepository;

    @Mock
    private DataIngestionRunRepository dataIngestionRunRepository;

    private MarketDataController marketDataController;

    @BeforeEach
    void setUp() {
        marketDataController = new MarketDataController(
                marketPriceRepository,
                cropRepository,
                ingestionService,
                marketRepository,
                dataSourceRepository,
                dataIngestionRunRepository
        );
    }

    @Test
    void testSearchCrops_WhenEnglishQueryMatches_ReturnsCrop() {
        Crop tomato = Crop.builder().id(1L).name("Tomato").category("PERISHABLE").build();
        Crop onion = Crop.builder().id(2L).name("Onion").category("SEMI_PERISHABLE").build();
        when(cropRepository.findAll()).thenReturn(Arrays.asList(tomato, onion));

        ResponseEntity<List<Crop>> response = marketDataController.searchCrops("tom");
        assertThat(response.getBody()).containsExactly(tomato);
    }

    @Test
    void testSearchCrops_WhenTeluguQueryMatches_ReturnsMappedCrop() {
        Crop tomato = Crop.builder().id(1L).name("Tomato").category("PERISHABLE").build();
        Crop chilli = Crop.builder().id(3L).name("Chilli").category("SEMI_PERISHABLE").build();
        when(cropRepository.findAll()).thenReturn(Arrays.asList(tomato, chilli));

        // Test Telugu "టమోటా" mapped to "tomato"
        ResponseEntity<List<Crop>> tomatoResponse = marketDataController.searchCrops("టమోటా");
        assertThat(tomatoResponse.getBody()).containsExactly(tomato);

        // Test Telugu "మిర్చి" mapped to "chilli"
        ResponseEntity<List<Crop>> chilliResponse = marketDataController.searchCrops("మిర్చి");
        assertThat(chilliResponse.getBody()).containsExactly(chilli);
    }

    @Test
    void testSearchCrops_WhenNoMatchExists_ReturnsEmptyList() {
        Crop tomato = Crop.builder().id(1L).name("Tomato").category("PERISHABLE").build();
        when(cropRepository.findAll()).thenReturn(Arrays.asList(tomato));

        ResponseEntity<List<Crop>> response = marketDataController.searchCrops("Apple");
        assertThat(response.getBody()).isEmpty();
    }
}
