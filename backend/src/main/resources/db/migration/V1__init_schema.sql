-- Database Schema for MASSGS Agricultural Decision & Supply Optimization Engine
-- MySQL Compatible

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS farmers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    preferred_language VARCHAR(50) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_farmers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_farmers_location (state, district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS buyers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    organization_name VARCHAR(255) NOT NULL,
    buyer_type VARCHAR(100) NOT NULL, -- e.g. INSTITUTIONAL, APMC_TRADER, PROCESSOR, EXPORTER
    verified_status VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED', -- VERIFIED_PLATFORM, EXTERNAL_VERIFIED, UNVERIFIED
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    provenance_indicator VARCHAR(255) DEFAULT 'Verified Platform Buyer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_buyers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_buyers_status (verified_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL, -- PERISHABLE, SEMI_PERISHABLE, STAPLE
    perishability_days INT NOT NULL DEFAULT 7,
    standard_unit VARCHAR(20) DEFAULT 'kg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_crops_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crop_varieties (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    crop_id BIGINT NOT NULL,
    variety_name VARCHAR(100) NOT NULL,
    description TEXT,
    CONSTRAINT fk_crop_varieties_crop FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    UNIQUE KEY uk_crop_variety (crop_id, variety_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS produce_listings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    farmer_id BIGINT NOT NULL,
    crop_id BIGINT NOT NULL,
    variety_name VARCHAR(100),
    quantity_kg DECIMAL(12, 2) NOT NULL,
    ready_date DATE NOT NULL,
    location_district VARCHAR(100) NOT NULL,
    location_state VARCHAR(100) NOT NULL,
    quality_grade VARCHAR(50) DEFAULT 'A', -- A, B, C
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, AGGREGATED, SOLD, EXPIRED
    user_provided_transport_cost_per_kg DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_produce_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    CONSTRAINT fk_produce_crop FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    INDEX idx_produce_crop_location (crop_id, location_state, location_district, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS markets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mandi_name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_market_name_location (mandi_name, district, state),
    INDEX idx_markets_location (state, district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS market_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    market_id BIGINT NOT NULL,
    crop_id BIGINT NOT NULL,
    variety_name VARCHAR(100),
    min_price_per_kg DECIMAL(10, 2) NOT NULL,
    max_price_per_kg DECIMAL(10, 2) NOT NULL,
    modal_price_per_kg DECIMAL(10, 2) NOT NULL,
    arrival_date DATE NOT NULL,
    data_source_name VARCHAR(100) NOT NULL DEFAULT 'AGMARKNET',
    source_identifier VARCHAR(255),
    data_quality_status VARCHAR(50) NOT NULL DEFAULT 'VERIFIED', -- VERIFIED, PARTIALLY_VERIFIED, STALE, INVALID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prices_market FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE,
    CONSTRAINT fk_prices_crop FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    INDEX idx_prices_query (crop_id, market_id, arrival_date),
    INDEX idx_prices_freshness (arrival_date, data_quality_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS data_sources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    provider_url VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONNECTED', -- CONNECTED, DEGRADED, DISCONNECTED
    last_successful_ingestion TIMESTAMP NULL,
    total_record_count INT DEFAULT 0,
    stale_record_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS data_ingestion_runs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    data_source_id BIGINT NOT NULL,
    execution_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- SUCCESS, FAILED, PARTIAL
    records_processed INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    log_details TEXT,
    CONSTRAINT fk_ingestion_source FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS buyer_requirements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    buyer_id BIGINT NOT NULL,
    crop_id BIGINT NOT NULL,
    min_quantity_kg DECIMAL(12, 2) NOT NULL,
    max_quantity_kg DECIMAL(12, 2) NOT NULL,
    target_price_per_kg DECIMAL(10, 2) NOT NULL,
    target_district VARCHAR(100),
    target_state VARCHAR(100),
    quality_specs VARCHAR(255),
    valid_until DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_requirements_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
    CONSTRAINT fk_requirements_crop FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    INDEX idx_req_crop_target (crop_id, target_state, target_district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transport_quotes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    origin_district VARCHAR(100) NOT NULL,
    destination_district VARCHAR(100) NOT NULL,
    cost_per_kg DECIMAL(10, 2) NOT NULL,
    distance_km DECIMAL(10, 2) NOT NULL,
    transit_time_hours INT NOT NULL DEFAULT 12,
    verified_provider_name VARCHAR(100) DEFAULT 'Verified Regional Logistics',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_route (origin_district, destination_district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    produce_listing_id BIGINT NOT NULL,
    recommended_option_type VARCHAR(50) NOT NULL, -- MANDI_SALE, DIRECT_BUYER, AGGREGATED_FPO
    recommended_market_id BIGINT,
    recommended_buyer_id BIGINT,
    gross_revenue DECIMAL(12, 2),
    estimated_transport_cost DECIMAL(12, 2),
    estimated_storage_cost DECIMAL(12, 2),
    estimated_handling_cost DECIMAL(12, 2),
    estimated_perishability_loss DECIMAL(12, 2),
    expected_net_realization DECIMAL(12, 2),
    recommendation_state VARCHAR(50) NOT NULL, -- RECOMMENDED, LIMITED_CONFIDENCE, NO_RELIABLE_RECOMMENDATION
    explanation_summary TEXT NOT NULL,
    confidence_score DECIMAL(5, 2) DEFAULT 0.0,
    algorithm_version VARCHAR(20) DEFAULT 'v1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_produce FOREIGN KEY (produce_listing_id) REFERENCES produce_listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_market FOREIGN KEY (recommended_market_id) REFERENCES markets(id) ON DELETE SET NULL,
    CONSTRAINT fk_rec_buyer FOREIGN KEY (recommended_buyer_id) REFERENCES buyers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendation_factors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id BIGINT NOT NULL,
    factor_key VARCHAR(100) NOT NULL,
    factor_value VARCHAR(255),
    factor_unit VARCHAR(50),
    missing_flag BOOLEAN DEFAULT FALSE,
    description TEXT,
    CONSTRAINT fk_factors_rec FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendation_sources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id BIGINT NOT NULL,
    data_source_id BIGINT,
    market_price_id BIGINT,
    provenance_url VARCHAR(255),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sources_rec FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE,
    CONSTRAINT fk_sources_price FOREIGN KEY (market_price_id) REFERENCES market_prices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scenario_runs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    produce_listing_id BIGINT NOT NULL,
    custom_transport_cost_per_kg DECIMAL(10, 2),
    custom_ready_date DATE,
    custom_storage_days INT DEFAULT 0,
    computed_net_realization DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scenario_produce FOREIGN KEY (produce_listing_id) REFERENCES produce_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aggregation_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    crop_id BIGINT NOT NULL,
    target_district VARCHAR(100) NOT NULL,
    total_quantity_kg DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'FORMING', -- FORMING, READY_FOR_BULK_SALE, COMPLETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_agg_crop FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aggregation_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    produce_listing_id BIGINT NOT NULL,
    contributed_quantity_kg DECIMAL(12, 2) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agg_members_group FOREIGN KEY (group_id) REFERENCES aggregation_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_agg_members_produce FOREIGN KEY (produce_listing_id) REFERENCES produce_listings(id) ON DELETE CASCADE,
    UNIQUE KEY uk_group_produce (group_id, produce_listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    produce_listing_id BIGINT NOT NULL,
    buyer_id BIGINT,
    market_id BIGINT,
    agreed_price_per_kg DECIMAL(10, 2) NOT NULL,
    quantity_kg DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    transport_cost_paid DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'INITIATED', -- INITIATED, COMPLETED, CANCELLED
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trans_produce FOREIGN KEY (produce_listing_id) REFERENCES produce_listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_trans_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE SET NULL,
    CONSTRAINT fk_trans_market FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_outcomes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL UNIQUE,
    actual_net_realization DECIMAL(12, 2) NOT NULL,
    actual_loss_kg DECIMAL(12, 2) DEFAULT 0.00,
    feedback_notes TEXT,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_outcomes_trans FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action_type VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    payload_json TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
