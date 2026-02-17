export type Provider =
  | 'bcparks'
  | 'parks_canada'
  | 'acc'
  | 'ridb'
  | 'rstbc'
  | 'bcmc'
  | 'voc'
  | 'wa_state_parks'
  | 'bc_coastal'
  |   'spearhead_huts'
  | 'cvhs'
  | 'pwa'
  |   'tetrahedron'
  | 'sct'
  | 'commercial'
  | 'other';

export type LocationType = 'hut' | 'campsite' | 'rec_site' | 'day_use_pass' | 'lodge';

export type AvailabilityStatus =
  | 'available'
  | 'booked'
  | 'closed'
  | 'locked'
  | 'unknown'
  | 'opening_soon';

export interface Location {
  id: string;
  name: string;
  provider: Provider;
  coordinates: { x: number; y: number }; // lon, lat from PostGIS
  type: LocationType;
  capacity_total: number | null;
  booking_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  location_id: string;
  date: string;
  status: AvailabilityStatus;
  spots_remaining: number | null;
  last_updated: string;
}

export interface BookingRule {
  id: string;
  provider: string;
  rolling_window_days: number | null;
  opening_time_pt: string | null;
  opening_time_mt: string | null;
  seasonal_launch_date: string | null;
  rules_metadata: Record<string, unknown>;
  created_at: string;
}

export interface LocationWithCoordinates extends Omit<Location, 'coordinates'> {
  lon: number;
  lat: number;
}
