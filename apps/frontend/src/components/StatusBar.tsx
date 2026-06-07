// Status bar at the bottom: cursor world position, zoom, active layer, shape count.

import { useStore, selectViewport } from '../state/store';

export function StatusBar({
  cursorWorld,
}: {
  cursorWorld: { x: number; y: number } | null;
}): JSX.Element {
  const viewport = useStore(selectViewport);
  const shapes = useStore((s) => s.diagram.shapes);
  const connectors = useStore((s) => s.diagram.connectors);
  const layers = useStore((s) => s.diagram.layers);
  const activeLayerId = useStore((s) => s.ui.activeLayerId);
  const tool = useStore((s) => s.ui.tool);
  const selection = useStore((s) => s.ui.selection);

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const sel = selection.shapeIds.size + selection.connectorIds.size;
  const pageW = useStore((s) => s.diagram.page.width);
  const pageH = useStore((s) => s.diagram.page.height);

  return (
    <footer className="nd-no-print z-10 flex items-center gap-3 px-3 h-7 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 text-xs text-slate-600 dark:text-slate-400">
      <span>
        Tool: <strong className="text-slate-700 dark:text-slate-200">{tool}</strong>
      </span>
      <span>·</span>
      <span>
        Zoom{' '}
        <strong className="text-slate-700 dark:text-slate-200">
          {Math.round(viewport.zoom * 100)}%
        </strong>
      </span>
      <span>·</span>
      <span>
        Shapes: {shapes.length} · Connectors: {connectors.length}
      </span>
      <span>·</span>
      <span>Selected: {sel}</span>
      <span>·</span>
      <span>
        Layer:{' '}
        <strong className="text-slate-700 dark:text-slate-200">{activeLayer?.name ?? '—'}</strong>
      </span>
      <span className="flex-1" />
      {cursorWorld && (
        <span>
          Cursor:{' '}
          <strong className="text-slate-700 dark:text-slate-200">
            {Math.round(cursorWorld.x)}, {Math.round(cursorWorld.y)}
          </strong>
        </span>
      )}
      <span>·</span>
      <span>
        Page: {Math.round(pageW)} × {Math.round(pageH)}
      </span>
    </footer>
  );
}
