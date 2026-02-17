-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Locations (campsites, huts, rec sites)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('bcparks','parks_canada','acc','ridb','rstbc','bcmc','voc','commercial','other')),
  coordinates extensions.geography(POINT) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hut','campsite','rec_site','day_use_pass','lodge')),
  capacity_total INT,
  booking_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);
CREATE INDEX idx_locations_provider ON locations(provider);
CREATE INDEX idx_locations_type ON locations(type);

-- Availability (per location, per date)
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available','booked','locked','unknown','opening_soon')),
  spots_remaining INT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_id, date)
);

CREATE INDEX idx_availability_location_date ON availability(location_id, date);
CREATE INDEX idx_availability_date ON availability(date);

-- Booking rules (provider-level config for "opening soon" logic)
CREATE TABLE booking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  rolling_window_days INT,
  opening_time_pt TIME,
  opening_time_mt TIME,
  seasonal_launch_date DATE,
  rules_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
