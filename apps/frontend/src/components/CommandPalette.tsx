// Command palette — VSCode/Linear-style modal that opens with Cmd/Ctrl+P.
// Renders a fuzzy-filtered list of all registered commands grouped by
// category. Arrow keys move the highlight, Enter runs, Esc closes.

import { useEffect, useMemo, useRef, useState } from 'react';
import { filterCommands, CATEGORY_ORDER, type Command } from '../lib/commands';

export function CommandPalette({
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

  const filtered = useMemo<Command[]>(() => {
    if (!open) return [];
    return filterCommands(query);
  }, [open, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [activeIdx, filtered.length]);

  useEffect(() => {
    // Auto-scroll the active row into view.
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  const grouped = new Map<string, Command[]>();
  for (const c of filtered) {
    const key = c.category;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }
  const orderedGroups = CATEGORY_ORDER.filter((c) => grouped.has(c)).map(
    (c) => [c, grouped.get(c)!] as const
  );

  const runCommand = (c: Command): void => {
    onClose();
    queueMicrotask(() => c.run());
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[activeIdx];
      if (cmd) runCommand(cmd);
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
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={onKey}
          placeholder="Type a command or search…"
          className="w-full h-12 px-4 text-base bg-transparent border-b border-slate-200 dark:border-slate-700 outline-none"
        />
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1 text-sm">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">No matching command.</div>
          ) : (
            orderedGroups.map(([cat, cmds]) => (
              <div key={cat}>
                <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-slate-400">
                  {cat}
                </div>
                {cmds.map((c) => {
                  const idx = filtered.indexOf(c);
                  const label = typeof c.label === 'function' ? c.label() : c.label;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      data-idx={idx}
                      onClick={() => runCommand(c)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full text-left px-3 py-1.5 flex items-center gap-3 ${
                        idx === activeIdx
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex-1 truncate">{label}</span>
                      {c.hint ? <span className="text-[10px] text-slate-400">{c.hint}</span> : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span>{filtered.length} commands</span>
          <span>↑↓ navigate · Enter run · Esc close</span>
        </div>
      </div>
    </div>
  );
}
