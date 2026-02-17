'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { addDays, format, startOfWeek, isAfter, isSameDay } from 'date-fns';
import { ExternalLink, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, XCircle, Loader2 } from 'lucide-react';
import { LocationChat, LocationChatTrigger } from '@/components/LocationChat';
import { LocationInfoSection } from '@/components/LocationInfoSection';
import { toTitleCase } from '@/lib/format';
import { getBcParksParkUrl } from '@/lib/bcparks-url';
import { getParksCanadaLocationUrl } from '@/lib/parks-canada-url';
import { PROVIDER_STYLES } from '@/components/map/LocationPins';
import type { AvailabilityStatus } from '@/types/database';

export interface CompactBookableCardLocation {
  id: string;
  name: string;
  provider: string;
  type: string;
  capacity_total: number | null;
  booking_url: string | null;
  metadata?: Record<string, unknown>;
  lon?: number;
  lat?: number;
}

export interface AvailabilityDay {
  date: string;
  status: AvailabilityStatus;
  spotsRemaining?: number;
}

interface CompactBookableCardProps {
  location: CompactBookableCardLocation;
  availability: AvailabilityDay[];
  onClose: () => void;
  getNextOpening: (locationId: string) => number | undefined;
  /** DB location id for verify (required for approve/reject to persist) */
  verifyLocationId?: string | null;
  /** Called when user rejects (so parent can hide pin / close panel) */
  onRejected?: (locationId: string) => void;
}

function getOperatingSeason(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;
  if (metadata.year_round === true) return 'Year-round';
  const season = metadata.season;
  if (typeof season === 'string' && season.trim()) return season.trim();
  return null;
}

const STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available: 'bg-emerald-500',
  booked: 'bg-red-500',
  closed: 'bg-zinc-300',
  locked: 'bg-zinc-400',
  unknown: 'bg-zinc-200',
  opening_soon: 'bg-blue-400',
};

const WEEK_STARTS_ON = 1; // Monday

export function CompactBookableCard({
  location,
  availability,
  onClose,
  getNextOpening,
  verifyLocationId,
  onRejected,
}: CompactBookableCardProps) {
  const [chatExpanded, setChatExpanded] = useState(false);
  const [calendarExpanded, setCalendarExpanded] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'needs_review' | 'approved' | 'rejected'>('idle');
  const [verifyConcern, setVerifyConcern] = useState<string | null>(null);

  useEffect(() => {
    if (!verifyLocationId) return;
    let cancelled = false;
    setVerifyState('loading');
    setVerifyConcern(null);
    fetch('/api/verify-campsite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: verifyLocationId,
        name: location.name,
        provider: location.provider,
        type: location.type,
        lat: location.lat,
        lon: location.lon,
        metadata: location.metadata,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.status === 'approved') {
          setVerifyState('approved');
        } else if (data.status === 'rejected') {
          setVerifyState('rejected');
        } else if (data.needsReview) {
          setVerifyState('needs_review');
          setVerifyConcern(data.concern ?? data.summary ?? 'Manual review needed.');
        } else {
          setVerifyState('approved');
        }
      })
      .catch(() => {
        if (!cancelled) setVerifyState('idle');
      });
    return () => { cancelled = true; };
  }, [verifyLocationId, location.id, location.name, location.provider, location.type, location.lat, location.lon, location.metadata]);

  const handleVerifyAction = useCallback(async (action: 'approve' | 'reject') => {
    if (!verifyLocationId) return;
    setVerifyState('loading');
    try {
      const res = await fetch('/api/verify-campsite-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: verifyLocationId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        setVerifyState(action === 'approve' ? 'approved' : 'rejected');
        setVerifyConcern(null);
        if (action === 'reject') onRejected?.(verifyLocationId);
      } else {
        setVerifyState('needs_review');
      }
    } catch {
      setVerifyState('needs_review');
    }
  }, [verifyLocationId, onRejected]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
    const weekStart = addDays(start, weekOffset * 7);
    const days: Date[] = [];
    for (let i = 0; i < 21; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekOffset]);

  const displayMonth = useMemo(() => {
    if (calendarDays.length === 0) return '';
    const midDate = calendarDays[10];
    return format(midDate, 'MMMM yyyy');
  }, [calendarDays]);

  const goPrevWeek = useCallback(() => setWeekOffset((o) => o - 1), []);
  const goNextWeek = useCallback(() => setWeekOffset((o) => o + 1), []);

  const availMap = useMemo(() => {
    const m = new Map<string, AvailabilityDay>();
    availability.forEach((a) => m.set(a.date, a));
    return m;
  }, [availability]);

  const hasAvailabilityData = availability.some((a) => a.status !== 'unknown');

  const nextOpening = getNextOpening(location.id);
  const providerLabel = PROVIDER_STYLES[location.provider]?.label ?? location.provider.replace(/_/g, ' ');
  const requiresPermit =
    location.metadata?.requires_permit === true ||
    (location.type === 'day_use_pass' && location.provider === 'parks_canada');
  const url =
    location.provider === 'bcparks'
      ? getBcParksParkUrl(location.name)
      : location.provider === 'parks_canada'
        ? getParksCanadaLocationUrl(location.name)
        : location.booking_url ?? undefined;

  return (
    <div className="absolute top-4 right-4 z-20 w-80 max-h-[calc(100vh-2rem)] rounded-lg bg-white/95 backdrop-blur shadow-lg border border-zinc-200/50 overflow-hidden">
        <div className="p-3 max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-zinc-900 truncate pr-1">
                {toTitleCase(location.name)}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {toTitleCase(location.type)} · {providerLabel}
                {requiresPermit && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                    Permit required
                  </span>
                )}
              </p>
              {getOperatingSeason(location.metadata) && (
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Operating season: {getOperatingSeason(location.metadata)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <LocationChatTrigger
                onClick={() => setChatExpanded((e) => !e)}
                expanded={chatExpanded}
              />
              <button
                onClick={onClose}
                className="p-0.5 rounded hover:bg-zinc-100 text-zinc-500"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {nextOpening != null && nextOpening <= 14 && (
            <div className="mt-2 px-2 py-1 rounded text-[10px] bg-blue-50 text-blue-800">
              Opens in {nextOpening} day{nextOpening !== 1 ? 's' : ''}
            </div>
          )}

          {verifyLocationId && (
            <div className="mt-2">
              {verifyState === 'loading' && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <Loader2 size={12} className="animate-spin" />
                  Verifying…
                </div>
              )}
              {verifyState === 'needs_review' && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-[10px]">
                  {verifyConcern && <p className="text-amber-800 mb-1.5">{verifyConcern}</p>}
                  <p className="text-amber-700 mb-1.5">Is this a campsite?</p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleVerifyAction('approve')}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check size={12} />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyAction('reject')}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      <XCircle size={12} />
                      Reject
                    </button>
                  </div>
                </div>
              )}
              {verifyState === 'approved' && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                  <Check size={12} />
                  Verified campsite
                </div>
              )}
              {verifyState === 'rejected' && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-600">
                  <XCircle size={12} />
                  Not a campsite
                </div>
              )}
            </div>
          )}

          <LocationInfoSection
            hideOperatingSeason
            location={{
              id: location.id,
              name: location.name,
              provider: location.provider,
              type: location.type,
              capacity_total: location.capacity_total,
              booking_url: location.booking_url,
              metadata: location.metadata,
              lon: location.lon,
              lat: location.lat,
            }}
          />

          {hasAvailabilityData && (
            <div className="mt-2 w-full">
              <button
                type="button"
                onClick={() => setCalendarExpanded((e) => !e)}
                className="flex items-center justify-between gap-1 w-full py-0.5 -mx-0.5 rounded hover:bg-zinc-50"
                aria-expanded={calendarExpanded}
              >
                <h4 className="text-[10px] font-medium text-zinc-600">Availability</h4>
                {calendarExpanded ? (
                  <ChevronUp size={12} className="text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown size={12} className="text-zinc-500 shrink-0" />
                )}
              </button>
              {calendarExpanded && (
                <>
                  <div className="flex items-center justify-between gap-1 mt-1 mb-0.5">
                    <div className="flex items-center gap-0.5 flex-1 justify-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goPrevWeek(); }}
                        className="p-0.5 rounded hover:bg-zinc-100 text-zinc-600"
                        aria-label="Previous week"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <span className="text-[10px] font-medium text-zinc-700 min-w-[90px] text-center">
                        {displayMonth}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); goNextWeek(); }}
                        className="p-0.5 rounded hover:bg-zinc-100 text-zinc-600"
                        aria-label="Next week"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-[1px] text-[8px]">
                    {['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'].map((d) => (
                      <div
                        key={d}
                        className="text-center text-[8px] text-zinc-500 font-medium pb-0.5"
                      >
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
                          className={`min-w-0 min-h-0 aspect-square flex flex-col items-center justify-center gap-0 rounded-[2px] text-[8px] ${
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
                </>
              )}
            </div>
          )}

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded text-[11px] font-medium bg-zinc-900 text-white hover:opacity-90"
            >
              <ExternalLink size={12} />
              Book on {providerLabel}
            </a>
          )}
          <LocationChat
            location={{
              id: location.id,
              name: location.name,
              provider: location.provider,
              type: location.type,
              capacity_total: location.capacity_total,
              booking_url: location.booking_url,
              metadata: location.metadata,
            }}
            expanded={chatExpanded}
          onToggle={() => setChatExpanded((e) => !e)}
        />
      </div>
    </div>
  );
}
