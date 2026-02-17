'use client';

import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { toTitleCase } from '@/lib/format';
import { getBcParksParkUrl } from '@/lib/bcparks-url';
import { getParksCanadaLocationUrl } from '@/lib/parks-canada-url';
import { PROVIDER_URLS } from './map/LocationPins';
import { getCampingBadgeLabel, type CampingBadgeInfo } from '@/lib/booking-utils';
import { LocationChat, LocationChatTrigger, type LocationChatLocation } from './LocationChat';
import { LocationInfoSection } from './LocationInfoSection';

export interface CompactLocationCardProps {
  name: string;
  provider: string;
  type: string;
  onClose: () => void;
  requiresPermit?: boolean;
  /** Badge for camping type (Book, FCFS, Wilderness) */
  campingBadge?: CampingBadgeInfo;
  /** Per-site URL (e.g. RSTBC resource page). When set, used instead of provider homepage. */
  bookingUrl?: string | null;
  /** Full location for chat and info display (id, name, provider, type, capacity_total, metadata). When omitted, chat is hidden. */
  location?: LocationChatLocation | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  rstbc: 'Rec Sites (RSTBC)',
  bcparks: 'BC Parks',
  parks_canada: 'Parks Canada',
  bc_coastal: 'Coastal Campsites',
  wa_state_parks: 'WA State Parks',
  ridb: 'Recreation.gov',
  acc: 'ACC Huts',
  other: 'Other',
};

export function CompactLocationCard({ name, provider, type, onClose, requiresPermit, campingBadge, bookingUrl, location }: CompactLocationCardProps) {
  const [chatExpanded, setChatExpanded] = useState(false);
  const url =
    provider === 'bcparks'
      ? getBcParksParkUrl(name)
      : provider === 'parks_canada'
        ? getParksCanadaLocationUrl(name)
        : bookingUrl || PROVIDER_URLS[provider];
  const label = PROVIDER_LABELS[provider] ?? provider.replace(/_/g, ' ');

  const badgeLabel = campingBadge ? getCampingBadgeLabel(campingBadge) : null;
  const badgeClass = campingBadge?.requiresBooking
    ? 'bg-blue-100 text-blue-800'
    : campingBadge?.campingType === 'wilderness'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-zinc-100 text-zinc-700';

  return (
    <div className="absolute top-4 right-4 z-20 w-80 max-h-[calc(100vh-2rem)] rounded-lg bg-white/95 backdrop-blur shadow-lg border border-zinc-200/50 overflow-hidden">
      <div className="p-3 max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-zinc-900 truncate pr-1">
              {toTitleCase(name)}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {toTitleCase(type)} · {label}
              {requiresPermit && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">Permit required</span>
              )}
              {badgeLabel && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}>
                  {badgeLabel}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {location && (
              <LocationChatTrigger
                onClick={() => setChatExpanded((e) => !e)}
                expanded={chatExpanded}
              />
            )}
            <button
              onClick={onClose}
              className="p-0.5 rounded hover:bg-zinc-100 text-zinc-500"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded text-[11px] font-medium bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
          >
            <ExternalLink size={12} />
            View on {label}
          </a>
        )}
        {location && (
          <LocationInfoSection
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
        )}
        {location && (
          <LocationChat
            location={location}
            expanded={chatExpanded}
            onToggle={() => setChatExpanded((e) => !e)}
          />
        )}
      </div>
    </div>
  );
}
