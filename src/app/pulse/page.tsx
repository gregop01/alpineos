'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Map, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getNextOpening } from '@/lib/booking-rules';
import { OpeningSoonList } from '@/components/pulse/OpeningSoonList';
import type { OpeningSoonItem } from '@/components/pulse/OpeningSoonList';

export default function PulsePage() {
  const [items, setItems] = useState<OpeningSoonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: locations } = await supabase
        .from('locations_with_coords')
        .select('id, name, provider');
      const { data: rules } = await supabase
        .from('booking_rules')
        .select('*');

      if (!locations || !rules) {
        setLoading(false);
        return;
      }

      const rulesByProvider: Record<string, (typeof rules)[number]> = {};
      rules.forEach((r) => {
        rulesByProvider[r.provider] = r;
      });

      const list: OpeningSoonItem[] = locations.map((loc) => {
        const rule = rulesByProvider[loc.provider];
        return {
          id: loc.id,
          name: loc.name,
          provider: loc.provider,
          nextOpening: getNextOpening(
            rule ? { ...rule, provider: loc.provider } : null,
            loc.id
          ),
        };
      });

      setItems(list);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Map</span>
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900">
            Booking Pulse
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-zinc-500 mb-6">
          What&apos;s opening soon, sorted by soonest first. Rules from Supabase.
        </p>

        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-zinc-500">
            No locations. Run Supabase migrations and seed data.
          </p>
        ) : (
          <OpeningSoonList items={items} />
        )}
      </main>
    </div>
  );
}
