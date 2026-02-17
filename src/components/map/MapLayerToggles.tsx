'use client';

import { PROVIDER_STYLES } from './LocationPins';

const MAP_PROVIDER_IDS = [
  'rstbc',
  'bcparks',
  'bc_coastal',
  'parks_canada',
  'acc',
  'wa_state_parks',
  'ridb',
  'bcmc',
  'voc',
  'spearhead_huts',
  'cvhs',
  'pwa',
  'tetrahedron',
  'sct',
  'commercial',
  'other',
] as const;

export interface MapLayerTogglesProps {
  visibleProviders: Set<string>;
  onToggle: (provider: string, visible: boolean) => void;
  onToggleAll?: (visible: boolean) => void;
}

export function MapLayerToggles({ visibleProviders, onToggle, onToggleAll }: MapLayerTogglesProps) {
  const allVisible = MAP_PROVIDER_IDS.every((p) => visibleProviders.has(p));

  return (
    <div className="flex flex-col gap-1">
      {onToggleAll && (
        <button
          type="button"
          onClick={() => onToggleAll(!allVisible)}
          className="mb-1.5 w-full rounded px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
        >
          {allVisible ? 'Hide all' : 'Show all'}
        </button>
      )}
      {MAP_PROVIDER_IDS.map((provider) => {
        const style = PROVIDER_STYLES[provider];
        const label = style?.label ?? provider.replace('_', ' ');
        const color = style?.color ?? '#64748b';
        const visible = visibleProviders.has(provider);
        return (
          <label
            key={provider}
            className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600 hover:text-zinc-900"
          >
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => onToggle(provider, e.target.checked)}
              className="h-2.5 w-2.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}
