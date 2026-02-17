'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { MapContainer } from '@/components/map/MapContainer';
import { CompactBookableCard } from '@/components/CompactBookableCard';
import { CompactLocationCard } from '@/components/CompactLocationCard';
import { LocationSearch } from '@/components/LocationSearch';
import { supabase } from '@/lib/supabase';
import { fetchAllBCSites } from '@/lib/bc-open-data';
import { getNextOpening } from '@/lib/booking-rules';
import { getCampingBadgeInfo } from '@/lib/booking-utils';
import { getParksCanadaLocationUrl } from '@/lib/parks-canada-url';
import type { MapLocation } from '@/components/map/MapContainer';
import type { SidePanelLocation } from '@/components/SidePanel';
import type { AvailabilityDay } from '@/components/SidePanel';

interface FullLocation {
  id: string;
  name: string;
  lon: number;
  lat: number;
  provider: string;
  type: string;
  capacity_total: number | null;
  booking_url: string | null;
}

function bcFeatureToId(lon: number, lat: number, source: string): string {
  return `bc-${source}-${lon.toFixed(5)}-${lat.toFixed(5)}`;
}

/** Find a DB location that matches a BC site name (for availability - BC Open Data pins lack DB rows) */
function findDbLocationForBcSite(
  bcName: string,
  provider: string,
  locations: FullLocation[]
): FullLocation | undefined {
  const core = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s*(provincial\s*)?park\s*$/i, '')
      .replace(/\s*marine\s+park\s*$/i, '')
      .trim();
  const a = core(bcName);
  for (const loc of locations) {
    if (loc.provider !== provider) continue;
    const b = core(loc.name);
    if (!a || !b) continue;
    if (a === b) return loc;
    const shorter = a.length <= b.length ? a : b;
    const longer = a.length > b.length ? a : b;
    if (shorter.length >= 4 && longer.includes(shorter)) return loc;
  }
  return undefined;
}

const COORD_EPSILON = 0.001; // ~100m at these latitudes

function HomePageContent() {
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<FullLocation[]>([]);
  const [bcSites, setBcSites] = useState<MapLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SidePanelLocation | null>(null);
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [bookingRules, setBookingRules] = useState<
    Map<string, { rolling_window_days: number | null; opening_time_pt: string | null; opening_time_mt: string | null; seasonal_launch_date: string | null; rules_metadata: Record<string, unknown> }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [flyToCoordsOverride, setFlyToCoordsOverride] = useState<{ lon: number; lat: number } | null>(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);
  const [availabilityRefreshTrigger, setAvailabilityRefreshTrigger] = useState(0);
  const [locationIdsWithAvailability, setLocationIdsWithAvailability] = useState<Set<string>>(new Set());
  const [onlyWithAvailability, setOnlyWithAvailability] = useState(false);
  const [rejectedLocationIds, setRejectedLocationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const [locRes, rulesRes, bcGeoJSON] = await Promise.all([
        supabase.from('locations_with_coords').select('id, name, lon, lat, provider, type, capacity_total, booking_url, metadata'),
        supabase.from('booking_rules').select('provider, rolling_window_days, opening_time_pt, opening_time_mt, seasonal_launch_date, rules_metadata'),
        fetchAllBCSites(),
      ]);

      if (locRes.data) {
        setLocations(
          locRes.data.map((l) => ({
            id: l.id,
            name: l.name,
            lon: l.lon,
            lat: l.lat,
            provider: l.provider,
            type: l.type,
            capacity_total: l.capacity_total,
            booking_url: l.booking_url,
            metadata: l.metadata ?? {},
          }))
        );
      }

      if (rulesRes.data) {
        setBookingRules(new Map(rulesRes.data.map((r) => [r.provider, r])));
      }

      if (bcGeoJSON?.features?.length) {
        const dbKeys = new Set(
          (locRes.data ?? []).map((l) => `${l.provider}-${l.lon.toFixed(4)}-${l.lat.toFixed(4)}`)
        );
        const bc: MapLocation[] = [];
        for (const f of bcGeoJSON.features) {
          if (f.geometry.type !== 'Point') continue;
          const [lon, lat] = f.geometry.coordinates;
          const source = (f.properties?.source as string) ?? 'other';
          const key = `${source}-${lon.toFixed(4)}-${lat.toFixed(4)}`;
          if (dbKeys.has(key)) continue;
          const hasNearbyDb = (locRes.data ?? []).some(
            (l) =>
              l.provider === source &&
              Math.abs(l.lon - lon) < COORD_EPSILON &&
              Math.abs(l.lat - lat) < COORD_EPSILON
          );
          if (hasNearbyDb) continue;
          const props = f.properties ?? {};
          const isDayUsePermit = props.requires_permit === true || (props.type === 'day_use_pass' && source === 'parks_canada');
          const metadata: Record<string, unknown> = {
            ...(props.requires_booking !== undefined && { requires_booking: props.requires_booking }),
            ...(props.camping_type !== undefined && { camping_type: props.camping_type }),
            ...(isDayUsePermit && { requires_permit: true }),
          };
          bc.push({
            id: bcFeatureToId(lon, lat, source),
            name: (props.name as string) ?? 'Site',
            lon,
            lat,
            type: (props.type as string) ?? 'campsite',
            provider: source,
            status: 'unknown',
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            ...(isDayUsePermit && source === 'parks_canada' && { booking_url: getParksCanadaLocationUrl((props.name as string) ?? 'Parks Canada Site') }),
            ...(props.booking_url ? { booking_url: props.booking_url as string } : {}),
          });
        }
        setBcSites(bc);
      }

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function fetchAvailabilityIds() {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('availability')
        .select('location_id')
        .gte('date', today);
      const ids = new Set((data ?? []).map((r) => r.location_id));
      setLocationIdsWithAvailability(ids);
    }
    fetchAvailabilityIds();
  }, [availabilityRefreshTrigger]);

  const locationIdFromUrl = searchParams.get('location');

  useEffect(() => {
    if (!locationIdFromUrl) return;
    const loc = locations.find((l) => l.id === locationIdFromUrl);
    if (loc) {
      setSelectedLocation({
        id: loc.id,
        name: loc.name,
        provider: loc.provider,
        type: loc.type,
        capacity_total: loc.capacity_total,
        booking_url: loc.booking_url,
        metadata: (loc as { metadata?: Record<string, unknown> }).metadata,
        lon: loc.lon,
        lat: loc.lat,
      });
    } else {
      const bcLoc = bcSites.find((l) => l.id === locationIdFromUrl) as { id: string; name: string; provider: string; type: string; booking_url?: string | null; metadata?: Record<string, unknown>; lon: number; lat: number };
      if (bcLoc) {
        setSelectedLocation({
          id: bcLoc.id,
          name: bcLoc.name,
          provider: bcLoc.provider,
          type: bcLoc.type,
          capacity_total: null,
          booking_url: bcLoc.booking_url ?? null,
          metadata: bcLoc.metadata,
          lon: bcLoc.lon,
          lat: bcLoc.lat,
        });
      }
    }
  }, [locationIdFromUrl, locations, bcSites]);

  useEffect(() => {
    if (!selectedLocation) {
      setAvailability([]);
      return;
    }

    // BC Open Data pins have synthetic ids (bc-...) and no availability rows – use matching DB location
    const availabilityId =
      selectedLocation.id.startsWith('bc-') && selectedLocation.provider
        ? findDbLocationForBcSite(selectedLocation.name, selectedLocation.provider, locations)?.id ?? selectedLocation.id
        : selectedLocation.id;

    async function loadAvailability() {
      const { data } = await supabase
        .from('availability')
        .select('date, status, spots_remaining')
        .eq('location_id', availabilityId)
        .gte('date', new Date().toISOString().slice(0, 10))
        .order('date');

      if (data && data.length > 0) {
        setAvailability(
          data.map((a) => ({
            date: a.date,
            status: a.status,
            spotsRemaining: a.spots_remaining ?? undefined,
          }))
        );
      } else {
        const today = new Date();
        const empty: AvailabilityDay[] = [];
        for (let i = 0; i < 90; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          empty.push({
            date: d.toISOString().slice(0, 10),
            status: 'unknown',
          });
        }
        setAvailability(empty);
      }
    }

    loadAvailability();
  }, [selectedLocation?.id, selectedLocation?.name, selectedLocation?.provider, availabilityRefreshTrigger, locations]);

  const handleRefreshAvailability = useCallback(async () => {
    setScrapeLoading(true);
    setScrapeMessage(null);
    try {
      // Run RIDB (Recreation.gov) and BC Parks (camply) in parallel
      const [ridbRes, gtcRes] = await Promise.all([
        fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 20 }),
        }),
        fetch('/api/scrape-gtc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recArea: 12, limit: 120 }), // BC Parks (~Alice Lake at #108)
        }),
      ]);
      const ridb = await ridbRes.json();
      const gtc = await gtcRes.json();
      const parts = [];
      if (ridb.ok) parts.push(`RIDB: ${ridb.ok} updated`);
      else if (ridb.error) parts.push(`RIDB: ${ridb.error}`);
      if (gtc.ok) parts.push(`BC Parks: ${gtc.ok} updated`);
      else if (gtc.error) parts.push(`BC Parks: ${gtc.error}`);
      setScrapeMessage(parts.length ? parts.join(' · ') : 'No updates');
      setAvailabilityRefreshTrigger((t) => t + 1);
      setTimeout(() => setScrapeMessage(null), 5000);
    } catch (err) {
      setScrapeMessage(err instanceof Error ? err.message : 'Failed to refresh');
      setTimeout(() => setScrapeMessage(null), 5000);
    } finally {
      setScrapeLoading(false);
    }
  }, []);

  const handleLocationClick = useCallback(
    (locationId: string) => {
      setFlyToCoordsOverride(null);
      const dbLoc = locations.find((l) => l.id === locationId);
      if (dbLoc) {
        setSelectedLocation({
          id: dbLoc.id,
          name: dbLoc.name,
          provider: dbLoc.provider,
          type: dbLoc.type,
          capacity_total: dbLoc.capacity_total,
          booking_url: dbLoc.booking_url,
          metadata: (dbLoc as { metadata?: Record<string, unknown> }).metadata,
          lon: dbLoc.lon,
          lat: dbLoc.lat,
        });
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/?location=${locationId}`);
        }
        return;
      }
      const bcLoc = bcSites.find((l) => l.id === locationId) as { id: string; name: string; provider: string; type: string; booking_url?: string | null; metadata?: Record<string, unknown>; lon: number; lat: number };
      if (bcLoc) {
        setSelectedLocation({
          id: bcLoc.id,
          name: bcLoc.name,
          provider: bcLoc.provider,
          type: bcLoc.type,
          capacity_total: null,
          booking_url: bcLoc.booking_url ?? null,
          metadata: bcLoc.metadata,
          lon: bcLoc.lon,
          lat: bcLoc.lat,
        });
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/?location=${locationId}`);
        }
      }
    },
    [locations, bcSites]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedLocation(null);
    setFlyToCoordsOverride(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  const getNextOpeningDays = useCallback(
    (locationId: string) => {
      const loc = locations.find((l) => l.id === locationId);
      if (!loc) return undefined;
      const rule = bookingRules.get(loc.provider);
      const next = getNextOpening(
        rule ? { ...rule, provider: loc.provider } : null
      );
      return next?.daysUntil;
    },
    [locations, bookingRules]
  );

  const mapLocations = useMemo<MapLocation[]>(() => {
    const db = locations
      .filter(
        (l) =>
          (l as { metadata?: Record<string, unknown> }).metadata?.camping_verified !== 'rejected' &&
          !rejectedLocationIds.has(l.id)
      )
      .map((l) => ({
        id: l.id,
        name: l.name,
        lon: l.lon,
        lat: l.lat,
        type: l.type,
        provider: l.provider,
        status: 'unknown' as const,
        booking_url: l.booking_url,
        metadata: (l as { metadata?: Record<string, unknown> }).metadata,
        capacity_total: l.capacity_total,
        hasAvailability: locationIdsWithAvailability.has(l.id),
      }));
    const bcWithAvail = bcSites
      .map((bc) => {
        const match = findDbLocationForBcSite(bc.name, bc.provider ?? '', locations);
        return {
          ...bc,
          match,
          hasAvailability: !!match && locationIdsWithAvailability.has(match.id),
        };
      })
      .filter(
        (bc) =>
          (bc.match
            ? (bc.match as { metadata?: Record<string, unknown> }).metadata?.camping_verified !== 'rejected' &&
              !rejectedLocationIds.has(bc.match.id)
            : true)
      )
      .map(({ match: _, ...bc }) => bc);
    let result: MapLocation[] = [...db, ...bcWithAvail];
    if (onlyWithAvailability) {
      result = result.filter((l) => l.hasAvailability);
    }
    return result;
  }, [locations, bcSites, locationIdsWithAvailability, onlyWithAvailability, rejectedLocationIds]);

  const flyToCoords = useMemo(() => {
    if (flyToCoordsOverride) return flyToCoordsOverride;
    if (!selectedLocation) return null;
    const loc = locations.find((l) => l.id === selectedLocation.id);
    if (loc) return { lon: loc.lon, lat: loc.lat };
    const bc = bcSites.find((l) => l.id === selectedLocation.id);
    return bc ? { lon: bc.lon, lat: bc.lat } : null;
  }, [flyToCoordsOverride, selectedLocation?.id, locations, bcSites]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
          <p className="text-zinc-500">Loading map…</p>
        </div>
      ) : (
        <>
          <MapContainer
            locations={mapLocations}
            onLocationClick={handleLocationClick}
            flyToCoords={flyToCoords}
            selectedLocationId={selectedLocation?.id}
            onlyWithAvailability={onlyWithAvailability}
            onOnlyWithAvailabilityChange={setOnlyWithAvailability}
          />

          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LocationSearch
              onSelectLocation={(result) => {
                setFlyToCoordsOverride({ lon: result.lon, lat: result.lat });
                const dbLoc = locations.find((l) => l.id === result.id);
                if (dbLoc) {
                  setSelectedLocation({
                    id: dbLoc.id,
                    name: dbLoc.name,
                    provider: dbLoc.provider,
                    type: dbLoc.type,
                    capacity_total: dbLoc.capacity_total,
                    booking_url: dbLoc.booking_url,
                    metadata: (dbLoc as { metadata?: Record<string, unknown> }).metadata,
                    lon: dbLoc.lon,
                    lat: dbLoc.lat,
                  });
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `/?location=${result.id}`);
                  }
                  return;
                }
                const bcLoc = bcSites.find((l) => l.id === result.id) as { id: string; name: string; provider: string; type: string; booking_url?: string | null; metadata?: Record<string, unknown>; lon: number; lat: number };
                if (bcLoc) {
                  setSelectedLocation({
                    id: bcLoc.id,
                    name: bcLoc.name,
                    provider: bcLoc.provider,
                    type: bcLoc.type,
                    capacity_total: null,
                    booking_url: bcLoc.booking_url ?? null,
                    metadata: bcLoc.metadata,
                    lon: bcLoc.lon,
                    lat: bcLoc.lat,
                  });
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `/?location=${result.id}`);
                  }
                  return;
                }
                setSelectedLocation({
                  id: result.id,
                  name: result.name,
                  provider: result.provider,
                  type: result.type,
                  capacity_total: null,
                  booking_url: null,
                  lon: result.lon,
                  lat: result.lat,
                });
                if (typeof window !== 'undefined') {
                  window.history.replaceState(null, '', `/?location=${result.id}`);
                }
              }}
            />
              <button
                type="button"
                onClick={handleRefreshAvailability}
                disabled={scrapeLoading}
                className="p-2 rounded-md bg-white/90 hover:bg-white border border-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Refresh availability"
              >
                <RefreshCw className={`w-4 h-4 text-zinc-600 ${scrapeLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {scrapeMessage && (
              <p className="text-xs text-zinc-600 bg-white/80 px-2 py-1 rounded">
                {scrapeMessage}
              </p>
            )}
          </div>

          {selectedLocation &&
          getCampingBadgeInfo({
            provider: selectedLocation.provider ?? '',
            booking_url: selectedLocation.booking_url,
            metadata: selectedLocation.metadata,
          }).requiresBooking ? (
              <CompactBookableCard
                location={selectedLocation}
                availability={availability}
                onClose={handleClosePanel}
                getNextOpening={getNextOpeningDays}
                verifyLocationId={
                  selectedLocation.id.startsWith('bc-') && selectedLocation.provider
                    ? findDbLocationForBcSite(selectedLocation.name, selectedLocation.provider, locations)?.id ?? null
                    : selectedLocation.id
                }
                onRejected={(id) => {
                  setRejectedLocationIds((prev) => new Set(prev).add(id));
                  handleClosePanel();
                }}
              />
            ) : selectedLocation ? (
              <CompactLocationCard
                name={selectedLocation.name}
                provider={selectedLocation.provider}
                type={selectedLocation.type}
                onClose={handleClosePanel}
                bookingUrl={selectedLocation.booking_url}
                requiresPermit={
                  selectedLocation.metadata?.requires_permit === true ||
                  (selectedLocation.type === 'day_use_pass' && selectedLocation.provider === 'parks_canada')
                }
                campingBadge={getCampingBadgeInfo({
                  provider: selectedLocation.provider ?? '',
                  booking_url: selectedLocation.booking_url,
                  metadata: selectedLocation.metadata,
                })}
                location={{
                  id: selectedLocation.id,
                  name: selectedLocation.name,
                  provider: selectedLocation.provider,
                  type: selectedLocation.type,
                  capacity_total: selectedLocation.capacity_total,
                  booking_url: selectedLocation.booking_url,
                  metadata: selectedLocation.metadata,
                }}
              />
            ) : null}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="relative w-full h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Loading map…</p>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
