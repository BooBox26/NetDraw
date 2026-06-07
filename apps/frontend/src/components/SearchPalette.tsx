// Search palette — Cmd/Ctrl+F modal that searches shape labels, names,
// types, and metadata. Selecting a hit pans the canvas to it and selects
// the shape.

import { useEffect, useMemo, useRef, useState } from 'react';
import { search, focusOnShape, type SearchHit } from '../lib/search';

export function SearchPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): JSX.Element | null {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const hits = useMemo<SearchHit[]>(() => (open ? search(query) : []), [open, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[activeIdx];
      if (hit) {
        focusOnShape(hit.id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-24 bg-slate-900/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[640px] max-w-[92vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 h-12 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-400 text-sm">🔎</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setActiveIdx(0);
            }}
            onKeyDown={onKey}
            placeholder="Search shapes, labels, metadata…"
            className="flex-1 h-full bg-transparent text-base outline-none"
          />
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1 text-sm">
          {hits.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              {query ? 'No matches' : 'Type to search across the diagram'}
            </div>
          ) : (
            hits.map((h, i) => (
              <button
                type="button"
                key={h.id}
                data-idx={i}
                onClick={() => {
                  focusOnShape(h.id);
                  onClose();
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 ${
                  i === activeIdx
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{h.label}</span>
                  <span className="block text-[11px] text-slate-500">{h.snippet}</span>
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">{h.type}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span>{hits.length} hits</span>
          <span>↑↓ navigate · Enter focus · Esc close</span>
        </div>
      </div>
    </div>
  );
}
