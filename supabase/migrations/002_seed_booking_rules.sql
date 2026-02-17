-- Seed 2026 booking rules (DB is source of truth; update as rules change)
INSERT INTO booking_rules (provider, rolling_window_days, opening_time_pt, seasonal_launch_date, rules_metadata) VALUES
  ('bcparks', 90, '07:00'::TIME, NULL, '{}'),
  ('parks_canada', NULL, '08:00'::TIME, NULL, '{"note": "varies per park; WCT Jan 19, Gulf Islands Jan 16"}'),
  ('acc', 90, NULL, NULL, '{"member_days": 180, "non_member_days": 90, "opening_time_mt": "00:00"}'),
  ('bcmc', 60, NULL, NULL, '{"watersprite_days": 60, "mountain_lake_days": 180}'),
  ('recreation_gov', 270, NULL, '2026-02-17'::DATE, '{"phase": "Phase 2"}'),
  ('olympic_np', 180, NULL, NULL, '{"note": "6mo blocks staggered"}');
