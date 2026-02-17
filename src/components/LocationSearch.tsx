'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toTitleCase } from '@/lib/format';
import { PROVIDER_STYLES } from '@/components/map/LocationPins';

interface SearchResult {
  id: string;
  name: string;
  provider: string;
  type: string;
  lon: number;
  lat: number;
}

interface LocationSearchProps {
  onSelectLocation: (result: SearchResult) => void;
  placeholder?: string;
}

export function LocationSearch({ onSelectLocation, placeholder = 'Search locations…' }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchLocations = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const escaped = trimmed.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pattern = `%${escaped}%`;
    const { data, error } = await supabase
      .from('locations_with_coords')
      .select('id, name, provider, type, lon, lat')
      .ilike('name', pattern)
      .limit(12);

    if (error) {
      setResults([]);
    } else {
      const raw = data ?? [];
      // Deduplicate: same name + provider + ~same coordinates = one result
      const COORD_PRECISION = 4; // ~11m at these latitudes
      const key = (r: SearchResult) =>
        `${r.name.toLowerCase().trim()}|${r.provider}|${r.lat.toFixed(COORD_PRECISION)}|${r.lon.toFixed(COORD_PRECISION)}`;
      const seen = new Set<string>();
      const deduped = raw.filter((r) => {
        const k = key(r);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      setResults(deduped);
    }
    setLoading(false);
    setHighlightIndex(0);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      searchLocations(query);
    }, 200);
    return () => clearTimeout(id);
  }, [query, searchLocations]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelectLocation(result);
      setQuery('');
      setResults([]);
      setOpen(false);
    },
    [onSelectLocation]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || results.length === 0) {
        if (e.key === 'Escape') setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(results[highlightIndex]);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [open, results, highlightIndex, handleSelect]
  );

  const showDropdown = open && (query.length >= 2 || results.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Search
          size={18}
          className="absolute left-3 text-zinc-400 pointer-events-none"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-64 sm:w-72 pl-9 pr-3 py-2 rounded-lg bg-white/95 backdrop-blur shadow border border-zinc-200/80 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/50"
          aria-label="Search locations"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-activedescendant={showDropdown && results[highlightIndex] ? `search-result-${highlightIndex}` : undefined}
        />
      </div>

      {showDropdown && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 mt-1 w-full min-w-[16rem] max-h-64 overflow-auto rounded-lg bg-white shadow-lg border border-zinc-200 py-1 z-50"
        >
          {loading ? (
            <li className="px-3 py-3 text-sm text-zinc-500">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-zinc-500">
              {query.length < 2 ? 'Type at least 2 characters' : 'No locations found'}
            </li>
          ) : (
            results.map((r, i) => {
              const label = PROVIDER_STYLES[r.provider]?.label ?? r.provider.replace(/_/g, ' ');
              return (
                <li
                  key={r.id}
                  id={`search-result-${i}`}
                  role="option"
                  aria-selected={i === highlightIndex}
                  className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between gap-2 select-none ${
                    i === highlightIndex
                      ? 'bg-zinc-100'
                      : 'hover:bg-zinc-50'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(r);
                  }}
                  onMouseEnter={() => setHighlightIndex(i)}
                >
                  <span className="text-zinc-900 truncate">{toTitleCase(r.name)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 shrink-0">
                    {label}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
