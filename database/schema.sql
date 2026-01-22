-- TürkiyeAI Database Schema
-- Azure PostgreSQL
-- Author: OrkinosAI Ltd
-- Description: Schema for AI-powered Turkish travel SaaS platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- DESTINATIONS
-- ========================================

CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    region VARCHAR(255) NOT NULL,
    description TEXT,
    full_description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    destination_type VARCHAR(100), -- e.g., 'Beach', 'Culture', 'Nature', 'Adventure'
    best_time_to_visit VARCHAR(255),
    average_temperature_summer DECIMAL(5, 2),
    average_temperature_winter DECIMAL(5, 2),
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    currency VARCHAR(3) DEFAULT 'TRY',
    language VARCHAR(50) DEFAULT 'Turkish',
    image_url TEXT,
    video_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_destinations_region ON destinations(region);
CREATE INDEX idx_destinations_type ON destinations(destination_type);
CREATE INDEX idx_destinations_active ON destinations(is_active);

-- ========================================
-- HIGHLIGHTS (Destination features)
-- ========================================

CREATE TABLE destination_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
    highlight VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon name
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_highlights_destination ON destination_highlights(destination_id);

-- ========================================
-- HOTELS & RESORTS
-- ========================================

CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    email VARCHAR(255),
    website_url TEXT,
    booking_url TEXT, -- External booking link
    price_range VARCHAR(50), -- e.g., '$$$', '100-200 EUR'
    room_count INTEGER,
    check_in_time TIME DEFAULT '15:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hotels_destination ON hotels(destination_id);
CREATE INDEX idx_hotels_rating ON hotels(star_rating);
CREATE INDEX idx_hotels_active ON hotels(is_active);

-- ========================================
-- HOTEL AMENITIES
-- ========================================

CREATE TABLE hotel_amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    amenity_name VARCHAR(255) NOT NULL,
    amenity_category VARCHAR(100), -- e.g., 'Pool', 'Spa', 'Dining', 'Activities'
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_amenities_hotel ON hotel_amenities(hotel_id);
CREATE INDEX idx_amenities_category ON hotel_amenities(amenity_category);

-- ========================================
-- EXPERIENCES & ACTIVITIES
-- ========================================

CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    experience_type VARCHAR(100), -- e.g., 'Tour', 'Activity', 'Cultural', 'Adventure'
    duration VARCHAR(100), -- e.g., 'Half day', '2 hours', 'Full day'
    price_range VARCHAR(50),
    booking_url TEXT, -- External booking link
    difficulty_level VARCHAR(50), -- e.g., 'Easy', 'Moderate', 'Challenging'
    min_age INTEGER,
    max_group_size INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_experiences_destination ON experiences(destination_id);
CREATE INDEX idx_experiences_type ON experiences(experience_type);
CREATE INDEX idx_experiences_active ON experiences(is_active);

-- ========================================
-- TRANSPORTATION OPTIONS
-- ========================================

CREATE TABLE transportation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
    to_destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
    transport_type VARCHAR(100) NOT NULL, -- e.g., 'Flight', 'Bus', 'Ferry', 'Car'
    provider_name VARCHAR(255),
    duration_minutes INTEGER,
    distance_km DECIMAL(10, 2),
    price_range VARCHAR(50),
    booking_url TEXT,
    frequency VARCHAR(255), -- e.g., 'Daily', '3 times per week'
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transport_from ON transportation(from_destination_id);
CREATE INDEX idx_transport_to ON transportation(to_destination_id);
CREATE INDEX idx_transport_type ON transportation(transport_type);

-- ========================================
-- TRAVEL ITINERARIES (User-generated or AI-suggested)
-- ========================================

CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    created_by VARCHAR(100) DEFAULT 'AI', -- 'AI' or user identifier
    is_template BOOLEAN DEFAULT FALSE,
    total_estimated_cost DECIMAL(10, 2),
    season VARCHAR(50), -- e.g., 'Summer', 'Winter', 'All Year'
    difficulty_level VARCHAR(50),
    tags TEXT[], -- Array of tags
    is_public BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_itineraries_duration ON itineraries(duration_days);
CREATE INDEX idx_itineraries_public ON itineraries(is_public);

-- ========================================
-- ITINERARY DAYS
-- ========================================

CREATE TABLE itinerary_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    title VARCHAR(255),
    description TEXT,
    accommodation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_itinerary_days_itinerary ON itinerary_days(itinerary_id);
CREATE INDEX idx_itinerary_days_number ON itinerary_days(day_number);

-- ========================================
-- ITINERARY ACTIVITIES (per day)
-- ========================================

CREATE TABLE itinerary_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_day_id UUID REFERENCES itinerary_days(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,
    activity_order INTEGER DEFAULT 0,
    time_slot VARCHAR(50), -- e.g., 'Morning', 'Afternoon', 'Evening'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_itinerary_activities_day ON itinerary_activities(itinerary_day_id);

-- ========================================
-- SEARCH LOGS (for analytics and AI training)
-- ========================================

CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_query TEXT NOT NULL,
    search_type VARCHAR(50), -- e.g., 'semantic', 'keyword', 'ai_chat'
    results_count INTEGER,
    user_session_id VARCHAR(255),
    clicked_result_id UUID,
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_logs_timestamp ON search_logs(search_timestamp);
CREATE INDEX idx_search_logs_session ON search_logs(user_session_id);

-- ========================================
-- AI CHAT CONVERSATIONS (for improvement)
-- ========================================

CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_session_id VARCHAR(255),
    conversation_data JSONB, -- Store full conversation as JSON
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5)
);

CREATE INDEX idx_chat_conversations_session ON chat_conversations(user_session_id);
CREATE INDEX idx_chat_conversations_start ON chat_conversations(start_time);

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample destinations
INSERT INTO destinations (name, slug, region, description, destination_type, best_time_to_visit, latitude, longitude) VALUES
('Bodrum', 'bodrum', 'Aegean Coast', 'A stunning coastal town known for its beaches, nightlife, and ancient history.', 'Beach & Culture', 'May to October', 37.0344, 27.4305),
('Cappadocia', 'cappadocia', 'Central Anatolia', 'Famous for its unique rock formations, hot air balloon rides, and underground cities.', 'Nature & Culture', 'April to June, September to November', 38.6431, 34.8287),
('Antalya', 'antalya', 'Mediterranean Coast', 'Turkey''s tourism capital with beautiful beaches and ancient ruins.', 'Beach & History', 'April to October', 36.8841, 30.7056),
('Marmaris', 'marmaris', 'Aegean Coast', 'Popular resort town with a beautiful marina and vibrant atmosphere.', 'Beach & Resort', 'May to October', 36.8556, 28.2739),
('Fethiye', 'fethiye', 'Mediterranean Coast', 'Gateway to the Turquoise Coast with stunning beaches and ancient Lycian sites.', 'Beach & Nature', 'May to October', 36.6217, 29.1164);

-- Insert sample highlights
INSERT INTO destination_highlights (destination_id, highlight, icon, display_order)
SELECT id, 'Bodrum Castle', '🏰', 1 FROM destinations WHERE slug = 'bodrum'
UNION ALL
SELECT id, 'Beach Clubs', '🏖️', 2 FROM destinations WHERE slug = 'bodrum'
UNION ALL
SELECT id, 'Ancient Theater', '🎭', 3 FROM destinations WHERE slug = 'bodrum'
UNION ALL
SELECT id, 'Hot Air Balloons', '🎈', 1 FROM destinations WHERE slug = 'cappadocia'
UNION ALL
SELECT id, 'Göreme Open Air Museum', '🏛️', 2 FROM destinations WHERE slug = 'cappadocia'
UNION ALL
SELECT id, 'Underground Cities', '🏰', 3 FROM destinations WHERE slug = 'cappadocia';
