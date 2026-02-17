'use client';

import { useMemo } from 'react';
import { addDays, format, startOfWeek, isAfter, isSameDay } from 'date-fns';
import { ExternalLink, X } from 'lucide-react';
import type { AvailabilityStatus } from '@/types/database';

export interface SidePanelLocation {
  id: string;
  name: string;
  provider: string;
  type: string;
  capacity_total: number | null;
  booking_url: string | null;
  nextOpeningDays?: number;
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
    for (let i = 0; i < 42; i++) {
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

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-l border-zinc-200 dark:border-zinc-700 shadow-xl flex flex-col z-10">
      <header className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {location.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300">
              {location.provider.replace('_', ' ')}
            </span>
            <span className="text-xs text-zinc-500">{location.type}</span>
            {location.capacity_total != null && (
              <span className="text-xs text-zinc-500">
                · {location.capacity_total} spots
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </header>

      {nextOpening != null && nextOpening <= 14 && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm">
          Opens in {nextOpening} day{nextOpening !== 1 ? 's' : ''}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Availability
        </h3>
        <div className="grid grid-cols-7 gap-0.5 text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
            <div
              key={d}
              className="text-center text-zinc-500 font-medium py-1"
            >
              {d}
            </div>
          ))}
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const a = availMap.get(dateStr);
            const status = a?.status ?? 'unknown';
            const isFuture =
              isAfter(day, new Date()) || isSameDay(day, new Date());
            const showDay = isFuture;
            return (
              <div
                key={dateStr}
                className={`aspect-square flex items-center justify-center rounded ${
                  showDay ? STATUS_COLORS[status] : 'bg-zinc-100 dark:bg-zinc-800'
                } ${!showDay ? 'opacity-50' : ''}`}
                title={`${dateStr}: ${status}`}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>

      {location.booking_url && (
        <footer className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          <a
            href={location.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 font-medium text-sm"
          >
            <ExternalLink size={16} />
            Book on {location.provider.replace('_', ' ')}
          </a>
        </footer>
      )}
    </div>
  );
}
