'use client';

import { useMemo } from 'react';
import { addDays, format, startOfWeek, isAfter, isSameDay } from 'date-fns';
import { ExternalLink, X } from 'lucide-react';
import { toTitleCase } from '@/lib/format';
import { getBcParksParkUrl } from '@/lib/bcparks-url';
import { getParksCanadaLocationUrl } from '@/lib/parks-canada-url';
import { PROVIDER_STYLES } from '@/components/map/LocationPins';
import type { AvailabilityStatus } from '@/types/database';

export interface SidePanelLocation {
  id: string;
  name: string;
  provider: string;
  type: string;
  capacity_total: number | null;
  booking_url: string | null;
  nextOpeningDays?: number;
  metadata?: Record<string, unknown>;
  /** Coordinates for disambiguating locations with the same name */
  lon?: number;
  lat?: number;
}

export interface AvailabilityDay {
  date: string;
  status: AvailabilityStatus;
  spotsRemaining?: number;
}

interface SidePanelProps {
  location: SidePanelLocation | null;
  availability: AvailabilityDay[];
  onClose: () => void;
  getNextOpening: (locationId: string) => number | undefined;
}

const STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available: 'bg-emerald-500',
  booked: 'bg-red-500',
  closed: 'bg-zinc-300',
  locked: 'bg-zinc-400',
  unknown: 'bg-zinc-200',
  opening_soon: 'bg-blue-400',
};

export function SidePanel({
  location,
  availability,
  onClose,
  getNextOpening,
}: SidePanelProps) {
  const calendarDays = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today);
    const days: Date[] = [];
    for (let i = 0; i < 35; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, []);

  const availMap = useMemo(() => {
    const m = new Map<string, AvailabilityDay>();
    availability.forEach((a) => m.set(a.date, a));
    return m;
  }, [availability]);

  if (!location) return null;

  const nextOpening = getNextOpening(location.id);
  const providerLabel = PROVIDER_STYLES[location.provider]?.label ?? location.provider.replace(/_/g, ' ');

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white/95 backdrop-blur border-l border-zinc-200 shadow-xl flex flex-col z-10">
      <header className="px-3 py-2.5 border-b border-zinc-200 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900">
            {toTitleCase(location.name)}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
              {toTitleCase(providerLabel)}
            </span>
            <span className="text-[10px] text-zinc-500">{toTitleCase(location.type)}</span>
            {(location.metadata?.requires_permit || (location.type === 'day_use_pass' && location.provider === 'parks_canada')) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800" title="Shuttle or reservation required">
                Permit required
              </span>
            )}
            {location.capacity_total != null && (
              <span className="text-[10px] text-zinc-500">· {location.capacity_total} spots</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-zinc-100 text-zinc-500 shrink-0"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </header>

      {nextOpening != null && nextOpening <= 14 && (
        <div className="mx-3 mt-1.5 px-2 py-1.5 rounded text-xs bg-blue-50 text-blue-800">
          Opens in {nextOpening} day{nextOpening !== 1 ? 's' : ''}
        </div>
      )}

      <div className="flex-1 overflow-auto px-3 py-2">
        <h3 className="text-[11px] font-medium text-zinc-600 mb-1">Availability</h3>
        <div className="grid grid-cols-7 gap-[2px]">
          {['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].map((d) => (
            <div key={d} className="text-center text-[9px] text-zinc-500 font-medium pb-0.5">
              {d}
            </div>
          ))}
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const a = availMap.get(dateStr);
            const status = a?.status ?? 'unknown';
            const spots = a?.spotsRemaining;
            const isFuture = isAfter(day, new Date()) || isSameDay(day, new Date());
            const showCount = status === 'available' && spots != null && spots > 0;
            return (
              <div
                key={dateStr}
                className={`aspect-square min-w-0 flex flex-col items-center justify-center gap-0 rounded-sm text-[10px] ${
                  isFuture ? STATUS_COLORS[status] : 'bg-zinc-100'
                } ${!isFuture ? 'opacity-50' : ''} ${showCount ? 'text-white' : ''}`}
                title={`${dateStr}: ${status}${showCount ? ` (${spots} spots)` : ''}`}
              >
                <span className="leading-none">{format(day, 'd')}</span>
                {showCount && <span className="text-sm font-bold leading-none">{spots}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {(() => {
        const url =
          location.provider === 'bcparks'
            ? getBcParksParkUrl(location.name)
            : location.provider === 'parks_canada'
              ? getParksCanadaLocationUrl(location.name)
              : location.booking_url;
        return url ? (
          <footer className="px-3 py-2 border-t border-zinc-200">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded text-xs font-medium bg-zinc-900 text-white hover:opacity-90"
            >
              <ExternalLink size={14} />
              Book on {providerLabel}
            </a>
          </footer>
        ) : null;
      })()}
    </div>
  );
}
