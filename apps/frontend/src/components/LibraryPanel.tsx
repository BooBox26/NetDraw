// Left sidebar with the shape library.

import { useMemo, useState } from 'react';
import { libraryGroups } from '../shapes/library';
import { createShapeFromType } from '../shapes/factory';
import { useStore } from '../state/store';
import { screenToWorld } from '../lib/geometry';
import { searchIcons, shapeFromSvg, HEROICON_LINKS, TABLER_LINKS } from '../lib/iconLibraries';

export function LibraryPanel(): JSX.Element {
  const [query, setQuery] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(libraryGroups[0]?.name ?? null);
  const [showIcons, setShowIcons] = useState(false);
  const [iconQuery, setIconQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return libraryGroups;
    return libraryGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.plugin.label.toLowerCase().includes(q) ||
            it.plugin.type.toLowerCase().includes(q) ||
            (it.plugin.tags && it.plugin.tags.some((t) => t.toLowerCase().includes(q)))
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const filteredIcons = useMemo(() => searchIcons(iconQuery), [iconQuery]);

  return (
    <aside className="nd-no-print z-20 w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="Search shapes…"
          className="w-full h-8 px-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
          aria-label="Search shape library"
        />
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={() => setShowIcons((s) => !s)}
            className={`flex-1 h-7 text-xs rounded ${
              showIcons
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {showIcons ? '← Shapes' : 'Icons'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto nd-scroll">
        {showIcons ? (
          <div>
            <div className="px-3 py-2">
              <input
                type="search"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.currentTarget.value)}
                placeholder="Search Lucide icons…"
                className="w-full h-7 px-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>
            <div className="grid grid-cols-4 gap-1 p-2">
              {filteredIcons.map((icon) => (
                <button
                  type="button"
                  key={icon.id}
                  draggable
                  onDragStart={(e) => {
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${icon.svg}</svg>`;
                    e.dataTransfer.setData('application/x-netdraw-svg', svg);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDoubleClick={() => {
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${icon.svg}</svg>`;
                    const el = document.querySelector('[data-canvas-root]') as SVGSVGElement | null;
                    if (!el) return;
                    const rect = el.getBoundingClientRect();
                    const viewport = useStore.getState().ui.viewport;
                    const world = screenToWorld(
                      { x: rect.width / 2, y: rect.height / 2 },
                      viewport
                    );
                    useStore.getState().addShape(shapeFromSvg(svg, world));
                  }}
                  title={icon.label}
                  className="flex flex-col items-center justify-center p-1 rounded border border-transparent hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-grab active:cursor-grabbing aspect-square"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: icon.svg }}
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 truncate w-full text-center">
                    {icon.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="p-3 text-[11px] text-slate-500 space-y-1 border-t border-slate-100 dark:border-slate-800">
              {HEROICON_LINKS.map((l) => (
                <div key={l.url}>
                  <a
                    className="text-blue-500 hover:underline"
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.label}
                  </a>{' '}
                  · full catalog
                </div>
              ))}
              {TABLER_LINKS.map((l) => (
                <div key={l.url}>
                  <a
                    className="text-blue-500 hover:underline"
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.label}
                  </a>{' '}
                  · full catalog
                </div>
              ))}
            </div>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-slate-500 p-4">No shapes match “{query}”.</p>
        ) : (
          groups.map((group) => (
            <section key={group.name} className="border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOpenGroup(openGroup === group.name ? null : group.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {group.name}
                <span className="text-slate-400">{openGroup === group.name ? '−' : '+'}</span>
              </button>
              {openGroup === group.name && (
                <div className="grid grid-cols-3 gap-1 p-2">
                  {group.items.map((it) => (
                    <LibraryItem
                      key={it.plugin.type}
                      type={it.plugin.type}
                      label={it.plugin.label}
                      preview={it.plugin.preview('#0f172a')}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>
      <div className="p-2 text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
        Drag a shape onto the canvas, or drop a .svg file to import it as a custom shape.
      </div>
    </aside>
  );
}

function LibraryItem({
  type,
  label,
  preview,
}: {
  type: string;
  label: string;
  preview: string;
}): JSX.Element {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-netdraw-shape', type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onDoubleClick={() => {
        // Add at the center of the visible canvas
        const el = document.querySelector('[data-canvas-root]') as SVGSVGElement | null;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewport = useStore.getState().ui.viewport;
        const world = screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, viewport);
        const shape = createShapeFromType(type, world);
        if (shape) {
          useStore.getState().addShape(shape);
          useStore.setState({
            ui: {
              ...useStore.getState().ui,
              selection: { shapeIds: new Set([shape.id]), connectorIds: new Set() },
            },
          });
        }
      }}
      className="flex flex-col items-center justify-center p-1.5 rounded border border-transparent hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-grab active:cursor-grabbing"
      role="button"
      tabIndex={0}
      aria-label={`Add ${label}`}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        width="32"
        height="32"
        dangerouslySetInnerHTML={{ __html: preview }}
      />
      <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
