'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Send, Trash2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { toTitleCase } from '@/lib/format';
import { PROVIDER_STYLES } from '@/components/map/LocationPins';
import { getCampingBadgeInfo, getCampingBadgeLabel } from '@/lib/booking-utils';

export interface LocationChatLocation {
  id: string;
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LocationChatProps {
  location: LocationChatLocation;
  expanded: boolean;
  onToggle: () => void;
}

/** Small speech bubble button for the card header */
export function LocationChatTrigger({
  onClick,
  expanded,
  ariaLabel = 'Ask about this location',
}: {
  onClick: () => void;
  expanded: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-0.5 rounded hover:bg-zinc-100 shrink-0 ${expanded ? 'text-zinc-800 bg-zinc-100' : 'text-zinc-500'}`}
      aria-label={ariaLabel}
      title={expanded ? 'Hide chat' : 'Ask about this location'}
    >
      <MessageCircle size={14} aria-hidden />
    </button>
  );
}

function buildContextPreview(loc: LocationChatLocation): string[] {
  const providerLabel = PROVIDER_STYLES[loc.provider]?.label ?? loc.provider.replace(/_/g, ' ');
  const badge = getCampingBadgeInfo({
    provider: loc.provider,
    booking_url: loc.booking_url,
    metadata: loc.metadata,
  });
  const badgeLabel = getCampingBadgeLabel(badge);
  const lines = [
    `${toTitleCase(loc.name)} · ${providerLabel}`,
    `${toTitleCase(loc.type)} · ${badgeLabel}${badge.requiresBooking ? ' (reservation required)' : ''}`,
  ];
  if (loc.lon != null && loc.lat != null) {
    lines.push(`Coordinates: ${loc.lat.toFixed(4)}°N, ${loc.lon.toFixed(4)}°W`);
  }
  const park = loc.metadata?.park;
  if (park && typeof park === 'string') {
    lines.push(`Park / Area: ${park}`);
  }
  if (loc.capacity_total != null && loc.capacity_total > 0) {
    lines.push(`Capacity: ${loc.capacity_total}`);
  }
  if (loc.metadata && Object.keys(loc.metadata).length > 0) {
    const meta = Object.entries(loc.metadata)
      .filter(([k, v]) => v != null && k !== 'park')
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(', ');
    if (meta) lines.push(`Metadata: ${meta}`);
  }
  return lines;
}

export function LocationChat({ location, expanded, onToggle }: LocationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contextPreview = buildContextPreview(location);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    const userMessage: Message = { role: 'user', content: question };
    setMessages((m) => [...m, userMessage]);
    setLoading(true);

    try {
      const res = await fetch('/api/location-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          location: {
            id: location.id,
            name: location.name,
            provider: location.provider,
            type: location.type,
            capacity_total: location.capacity_total,
            booking_url: location.booking_url,
            metadata: location.metadata,
            lon: location.lon,
            lat: location.lat,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `Request failed: ${res.status}`);
      }

      const data = (await res.json()) as { content: string };
      setMessages((m) => [...m, { role: 'assistant', content: data.content }]);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Something went wrong';
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Sorry, I couldn’t get an answer. ${err}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return expanded ? (
        <div className="flex flex-col border-t border-zinc-200/60 bg-zinc-50/80">
          <div className="flex items-center justify-between gap-2 px-2 pt-1.5 pb-0">
            <button
              onClick={() => setShowContext((s) => !s)}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-700"
              aria-expanded={showContext}
              aria-label={showContext ? 'Hide context' : 'Show AI context'}
            >
              {showContext ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              <Info size={10} />
              Context
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-700"
                aria-label="Clear chat"
              >
                <Trash2 size={10} />
                Clear
              </button>
            )}
          </div>
          {showContext && (
            <div className="mx-2 mt-1 mb-2 rounded bg-zinc-100/80 px-2 py-1.5 text-[10px] text-zinc-600 border border-zinc-200/60">
              <p className="font-medium text-zinc-700 mb-0.5">The AI receives this location data and can also search the web:</p>
              <ul className="list-none space-y-0.5 text-zinc-600">
                {contextPreview.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="h-48 max-h-64 overflow-y-auto p-2 space-y-2">
            {messages.length === 0 && (
              <p className="text-[11px] text-zinc-500 px-1">
                Ask anything about this location—e.g. “Can you camp here?”, “Is it wilderness camping?”, “Do I need a permit?”
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-[11px] rounded px-2 py-1.5 ${
                  msg.role === 'user'
                    ? 'ml-4 mr-1 bg-zinc-200 text-zinc-900'
                    : 'mr-4 ml-1 bg-white text-zinc-800 border border-zinc-200/60'
                }`}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="location-chat-markdown">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <span className="block mb-1 last:mb-0">{children}</span>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        code: ({ children }) => <code className="bg-zinc-100 px-0.5 rounded text-[10px]">{children}</code>,
                        h1: ({ children }) => <p className="font-semibold mt-1 mb-0.5">{children}</p>,
                        h2: ({ children }) => <p className="font-semibold mt-1 mb-0.5">{children}</p>,
                        h3: ({ children }) => <p className="font-semibold mt-1 mb-0.5">{children}</p>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-[11px] text-zinc-500 px-2 py-1">Thinking…</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-1 p-2 border-t border-zinc-200/60"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 min-w-0 rounded border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded bg-zinc-800 p-1.5 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800"
              aria-label="Send"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
  ) : null;
}
