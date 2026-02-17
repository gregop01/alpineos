-- Add RSTBC rec sites for existing deployments
-- Run this if you already ran run_all_migrations.sql before rec sites were added

INSERT INTO booking_rules (provider, rolling_window_days, opening_time_pt, seasonal_launch_date, rules_metadata) VALUES
  ('rstbc', NULL, NULL, NULL, '{"fcfs": true, "note": "First-come first-served, no reservations"}')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO locations (name, provider, coordinates, type, capacity_total, booking_url, metadata) VALUES
  ('Silver Lake Rec Site', 'rstbc', ST_SetSRID(ST_MakePoint(-120.73, 50.13), 4326)::geography, 'rec_site', 20, 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/camping-hiking/sites-trails', '{"fcfs": true}'),
  ('Nahatlach FSR Rec Sites', 'rstbc', ST_SetSRID(ST_MakePoint(-121.50, 50.22), 4326)::geography, 'rec_site', 15, 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/camping-hiking/sites-trails', '{"fcfs": true}'),
  ('Coquihalla Summit Rec Site', 'rstbc', ST_SetSRID(ST_MakePoint(-121.0891, 49.5995), 4326)::geography, 'rec_site', 12, 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/camping-hiking/sites-trails', '{"fcfs": true}');
