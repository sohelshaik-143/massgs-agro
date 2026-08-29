package com.massgs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.massgs.service.ingestion.AgmarknetDatasetDataProvider;
import com.massgs.service.ingestion.MarketDataProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class MarketDataProviderTest {

    private AgmarknetDatasetDataProvider datasetDataProvider;

    @BeforeEach
    void setUp() {
        datasetDataProvider = new AgmarknetDatasetDataProvider(
                new DefaultResourceLoader(),
                new ObjectMapper()
        );
    }

    @Test
    void testFetchVerifiedRecords_LoadsValidData() {
        List<MarketDataProvider.RawMarketRecord> records = datasetDataProvider.fetchMarketRecords("Tomato", "Andhra Pradesh");

        assertThat(records).isNotEmpty();
        MarketDataProvider.RawMarketRecord first = records.get(0);
        assertThat(first.getCommodity()).isEqualTo("Tomato");
        assertThat(first.getState()).isEqualTo("Andhra Pradesh");
        assertThat(first.getModalPricePerUnit()).isGreaterThan(BigDecimal.ZERO);
        assertThat(first.getReportedUnit()).isEqualTo("Quintal");
    }

    @Test
    void testFetchVerifiedRecords_FiltersCorrectly() {
        List<MarketDataProvider.RawMarketRecord> chilliRecords = datasetDataProvider.fetchMarketRecords("Chilli", null);
        assertThat(chilliRecords).allMatch(r -> "Chilli".equalsIgnoreCase(r.getCommodity()));

        List<MarketDataProvider.RawMarketRecord> unknownRecords = datasetDataProvider.fetchMarketRecords("Dragonfruit", null);
        assertThat(unknownRecords).isEmpty();
    }
}
