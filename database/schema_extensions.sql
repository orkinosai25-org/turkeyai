-- TürkiyeAI Database Schema Extensions
-- Resort Deep Dive, Hotel Proximity AI Learning, and Service Verticals
-- Author: OrkinosAI Ltd
-- Description: Extends the core schema with travel service verticals and proximity learning

-- Enable PostGIS extension for geospatial support (optional – enhances proximity queries)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- RESORT PROXIMITY LEARNING
-- ========================================
-- Stores computed proximity distances between hotels and key attractions.
-- Updated periodically by the AI proximity learning job.

CREATE TABLE IF NOT EXISTS resort_proximity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    attraction_name VARCHAR(255) NOT NULL,
    attraction_type VARCHAR(100) NOT NULL,  -- e.g., 'Beach', 'Airport', 'Cultural', 'Marina'
    distance_km DECIMAL(8, 3) NOT NULL,
    proximity_score INTEGER CHECK (proximity_score >= 0 AND proximity_score <= 100),
    attraction_lat DECIMAL(10, 8),
    attraction_lng DECIMAL(11, 8),
    last_computed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proximity_hotel ON resort_proximity(hotel_id);
CREATE INDEX IF NOT EXISTS idx_proximity_type ON resort_proximity(attraction_type);
CREATE INDEX IF NOT EXISTS idx_proximity_score ON resort_proximity(proximity_score DESC);

-- ========================================
-- RESORT DEEP DIVE AI INSIGHTS
-- ========================================
-- Caches AI-generated insights for resorts to reduce compute costs.

CREATE TABLE IF NOT EXISTS resort_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE UNIQUE,
    insights JSONB NOT NULL DEFAULT '[]',         -- Array of insight strings
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    best_for VARCHAR(255)[],                       -- e.g., ARRAY['Couples', 'Families']
    vibe_tags VARCHAR(100)[],                      -- e.g., ARRAY['luxury', 'beach', 'wellness']
    ai_summary TEXT,                               -- Short AI-generated summary
    family_friendly BOOLEAN,
    adults_only BOOLEAN,
    beach_type VARCHAR(100),                       -- e.g., 'Sandy', 'Pebble', 'Private'
    nearest_airport_code VARCHAR(10),
    season_notes TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_hotel ON resort_ai_insights(hotel_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_score ON resort_ai_insights(overall_score DESC);

-- ========================================
-- EXCURSIONS & EXPERIENCES
-- ========================================
-- Managed catalog of day trips, tours, and experiences per destination.

CREATE TABLE IF NOT EXISTS excursion_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    excursion_type VARCHAR(100) NOT NULL,  -- e.g., 'Cultural', 'Adventure', 'Boat Tour', 'Culinary', 'Wellness'
    duration VARCHAR(100),                 -- e.g., 'Half Day', 'Full Day', '2 Hours'
    price_from DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'EUR',
    difficulty VARCHAR(50) DEFAULT 'Easy', -- 'Easy', 'Moderate', 'Challenging'
    min_age INTEGER DEFAULT 0,
    max_group_size INTEGER,
    highlights TEXT[],                     -- Key selling points
    booking_url TEXT,
    operator_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_excursion_destination ON excursion_catalog(destination_id);
CREATE INDEX IF NOT EXISTS idx_excursion_type ON excursion_catalog(excursion_type);
CREATE INDEX IF NOT EXISTS idx_excursion_active ON excursion_catalog(is_active);

-- ========================================
-- HOLIDAY PACKAGES
-- ========================================
-- Curated holiday packages with flexible board basis options.

CREATE TABLE IF NOT EXISTS holiday_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),                 -- e.g., 'Beach & Relaxation', 'Family', 'Cultural & Adventure'
    board_basis VARCHAR(100),              -- e.g., 'All Inclusive', 'Half Board', 'Bed & Breakfast'
    duration_nights INTEGER NOT NULL,
    price_from_pp DECIMAL(10, 2),          -- Price per person
    currency VARCHAR(3) DEFAULT 'GBP',
    star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
    highlights TEXT[],
    best_for VARCHAR(100)[],               -- e.g., ARRAY['Couples', 'Families', 'Solo Travellers']
    departure_airports VARCHAR(10)[],      -- IATA codes, e.g., ARRAY['LHR', 'LGW', 'MAN']
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packages_destination ON holiday_packages(destination_id);
CREATE INDEX IF NOT EXISTS idx_packages_category ON holiday_packages(category);
CREATE INDEX IF NOT EXISTS idx_packages_featured ON holiday_packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_packages_active ON holiday_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_duration ON holiday_packages(duration_nights);

-- ========================================
-- AIRPORT TRANSFERS
-- ========================================
-- Transfer routes and pricing from airports to destinations.

CREATE TABLE IF NOT EXISTS airport_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    airport_code VARCHAR(10) NOT NULL,          -- IATA airport code
    airport_name VARCHAR(255),
    destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
    distance_km DECIMAL(8, 2),
    base_price_eur DECIMAL(10, 2),              -- Private saloon (1 pax) indicative price
    transfer_types JSONB,                        -- JSON array of vehicle types and prices
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfers_airport ON airport_transfers(airport_code);
CREATE INDEX IF NOT EXISTS idx_transfers_destination ON airport_transfers(destination_id);

-- ========================================
-- SERVICE VERTICAL ANALYTICS
-- ========================================
-- Tracks which services are being queried, for AI learning & product improvement.

CREATE TABLE IF NOT EXISTS service_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_vertical VARCHAR(100) NOT NULL,  -- 'hotels', 'excursions', 'transfers', 'packages', 'flights'
    query_params JSONB,
    result_count INTEGER,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_analytics_vertical ON service_analytics(service_vertical);
CREATE INDEX IF NOT EXISTS idx_service_analytics_date ON service_analytics(created_at DESC);

-- ========================================
-- KNOWLEDGE ITEMS (Agent Learning & Context)
-- ========================================
-- Stores documents, URLs, and notes that the AI agent learns from.
-- Items are indexed into Azure AI Search for semantic retrieval.

CREATE TABLE IF NOT EXISTS knowledge_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('file', 'url', 'note')),
    source_url TEXT,                            -- Original URL (for url type)
    original_filename VARCHAR(500),             -- Original file name (for file type)
    location_tags VARCHAR(100)[],               -- e.g., ARRAY['Bodrum', 'Gumbet']
    content_category VARCHAR(100),              -- e.g., 'local_news', 'hotel_info', 'general'
    is_indexed BOOLEAN DEFAULT FALSE,           -- Whether the item has been indexed in Azure Search
    indexed_at TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_source_type ON knowledge_items(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_location_tags ON knowledge_items USING GIN(location_tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_active ON knowledge_items(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_indexed ON knowledge_items(is_indexed);
CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge_items(created_at DESC);
