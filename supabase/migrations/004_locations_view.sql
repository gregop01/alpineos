-- View for easy lat/lon access (PostGIS geography not directly JSON-serializable)
CREATE OR REPLACE VIEW locations_with_coords AS
SELECT
  id,
  name,
  provider,
  type,
  capacity_total,
  booking_url,
  metadata,
  ST_X(coordinates::geometry)::double precision AS lon,
  ST_Y(coordinates::geometry)::double precision AS lat
FROM locations;

GRANT SELECT ON locations_with_coords TO anon;
