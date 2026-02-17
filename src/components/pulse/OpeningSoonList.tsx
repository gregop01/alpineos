'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { NextOpening } from '@/lib/booking-rules';

export interface OpeningSoonItem {
  id: string;
  name: string;
  provider: string;
  nextOpening: NextOpening | null;
}

interface OpeningSoonListProps {
  items: OpeningSoonItem[];
}

function formatProvider(provider: string): string {
  return provider
    .replace('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OpeningSoonList({ items }: OpeningSoonListProps) {
  const sorted = [...items].sort((a, b) => {
    if (!a.nextOpening) return 1;
    if (!b.nextOpening) return -1;
    return a.nextOpening.daysUntil - b.nextOpening.daysUntil;
  });

  return (
    <ul className="divide-y divide-zinc-200">
      {sorted.map((item) => (
        <li key={item.id} className="py-4 first:pt-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-zinc-900">
                {item.name}
              </h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                {formatProvider(item.provider)}
              </p>
            </div>
            <div className="text-right shrink-0">
              {item.nextOpening ? (
                <>
                  <p className="text-sm font-medium text-zinc-900">
                    {item.nextOpening.daysUntil === 0
                      ? 'Today'
                      : `In ${item.nextOpening.daysUntil} days`}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {item.nextOpening.date} @ {item.nextOpening.time}{' '}
                    {item.nextOpening.timeZone}
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-400">—</p>
              )}
              <Link
                href={`/?location=${item.id}`}
                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline"
              >
                <MapPin size={12} />
                View on map
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
