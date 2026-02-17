'use client';

import { useEffect, useState } from 'react';
import { toTitleCase } from '@/lib/format';

/** Metadata keys to skip (already shown via badge/permits or operating season) */
const SKIP_METADATA_KEYS = new Set([
  'requires_booking',
  'camping_type',
  'requires_permit',
  'fcfs',
  'year_round',
  'season',
]);

/** User-friendly labels for metadata keys */
const METADATA_LABELS: Record<string, string> = {
  location: 'Location',
  park: 'Park',
  trail_km: 'Trail km',
  aka: 'Also known as',
  donation_suggested: 'Donations',
  bc_parks_fee: 'Fee',
  emergency_shelter: 'Type',
  jumping_off: 'Access',
  elevation_approx_m: 'Elevation',
};

function getOperatingSeason(metadata: Record<string, unknown>): string | null {
  if (metadata.year_round === true) return 'Year-round';
  const season = metadata.season;
  if (typeof season === 'string' && season.trim()) return season.trim();
  return null;
}

function getMetadataLabel(key: string): string {
  return METADATA_LABELS[key] ?? toTitleCase(key.replace(/_/g, ' '));
}

function formatMetadataValue(key: string, value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') {
    if (key === 'donation_suggested') return 'Suggested ($5/person/night)';
    if (key === 'bc_parks_fee') return 'BC Parks fee applies';
    if (key === 'emergency_shelter') return 'Emergency shelter only';
    if (key === 'year_round') return 'Year-round';
    return value ? 'Yes' : 'No';
  }
  if (key === 'elevation_approx_m') return `~${value} m`;
  if (key === 'trail_km') return `km ${value}`;
  return String(value);
}

export interface LocationInfoSectionLocation {
  id?: string;
  name: string;
  provider: string;
  type: string;
  capacity_total?: number | null;
  booking_url?: string | null;
  metadata?: Record<string, unknown>;
  /** Coordinates for disambiguating locations with the same name */
  lon?: number;
  lat?: number;
}

interface LocationInfoSectionProps {
  location: LocationInfoSectionLocation;
  /** Hide capacity (e.g. when card already shows it prominently) */
  hideCapacity?: boolean;
}

export function LocationInfoSection({ location, hideCapacity }: LocationInfoSectionProps) {
  const [bookingSummary, setBookingSummary] = useState<string | null>(null);
  const [needToKnow, setNeedToKnow] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setBookingSummary(null);
    setNeedToKnow(null);
    setSummaryError(false);

    async function fetchSummary() {
      setSummaryLoading(true);
      try {
        const res = await fetch('/api/location-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: location.name,
            provider: location.provider,
            type: location.type,
            capacity_total: location.capacity_total,
            metadata: location.metadata,
            lon: location.lon,
            lat: location.lat,
          }),
        });
        if (cancelled) return;
        if (!res.ok) {
          setSummaryError(true);
          return;
        }
        const data = (await res.json()) as { bookingSummary?: string; needToKnow?: string };
        if (!cancelled) {
          if (data.bookingSummary) setBookingSummary(data.bookingSummary);
          if (data.needToKnow) setNeedToKnow(data.needToKnow);
        }
      } catch {
        if (!cancelled) setSummaryError(true);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    }

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [location.id ?? `${location.name}-${location.provider}`, location.name, location.provider, location.type, location.capacity_total, location.lon, location.lat]);

  const metadata = location.metadata ?? {};
  const displayEntries = Object.entries(metadata)
    .filter(([k, v]) => !SKIP_METADATA_KEYS.has(k) && v != null && v !== '')
    .map(([k]) => k);

  const operatingSeason = getOperatingSeason(metadata);
  const hasCapacity = !hideCapacity && location.capacity_total != null && location.capacity_total > 0;
  const capacityLabel = location.type === 'hut' ? 'beds' : 'spots';
  const hasAnyInfo = hasCapacity || operatingSeason || displayEntries.length > 0 || bookingSummary || needToKnow || summaryLoading;

  if (!hasAnyInfo && !summaryError) return null;

  return (
    <div className="mt-2 space-y-1.5 border-t border-zinc-200/60 pt-2 min-w-0">
      {hasCapacity && (
        <p className="text-[11px] text-zinc-600">
          {location.capacity_total} {capacityLabel}
        </p>
      )}
      {operatingSeason && (
        <p className="text-[11px] text-zinc-600">
          <span className="font-medium text-zinc-700">Operating season:</span>{' '}
          {operatingSeason}
        </p>
      )}
      {displayEntries.map((key) => {
        const value = metadata[key];
        const label = getMetadataLabel(key);
        const formatted = formatMetadataValue(key, value);
        if (key === 'emergency_shelter' && value === true) {
          return (
            <p key={key} className="text-[11px] text-amber-700">
              Emergency shelter only
            </p>
          );
        }
        return (
          <p key={key} className="text-[11px] text-zinc-600">
            <span className="font-medium text-zinc-700">{label}:</span>{' '}
            {formatted}
          </p>
        );
      })}
      {bookingSummary && (
        <p className="text-[11px] text-zinc-600 italic">
          {bookingSummary}
        </p>
      )}
      {needToKnow && (
        <div className="rounded bg-blue-50/80 p-2 border border-blue-100/60 min-w-0 overflow-visible">
          <p className="text-[10px] font-medium text-blue-800 mb-0.5">Need to know</p>
          <p className="text-[11px] text-blue-900 leading-snug break-words">
            {needToKnow}
          </p>
        </div>
      )}
      {summaryLoading && (
        <div className="rounded bg-zinc-100/80 p-2">
          <p className="text-[11px] text-zinc-500 italic">Loading tips…</p>
        </div>
      )}
      {summaryError && (
        <p className="text-[10px] text-zinc-400 italic">Tips temporarily unavailable</p>
      )}
    </div>
  );
}
