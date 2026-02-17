-- Enable public read for Phase 1 (no auth)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_public_read" ON locations FOR SELECT USING (true);
CREATE POLICY "availability_public_read" ON availability FOR SELECT USING (true);
CREATE POLICY "booking_rules_public_read" ON booking_rules FOR SELECT USING (true);
