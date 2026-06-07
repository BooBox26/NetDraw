// Presentation mode — full-screen focus on the current diagram, with
// keyboard navigation between shapes (Tab/Shift+Tab/Arrow keys), a slide
// indicator, and Esc to exit. Activated when the active tool is 'present'.

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';

export function PresentationMode(): JSX.Element | null {
  const tool = useStore((s) => s.ui.tool);
  const shapes = useStore((s) => s.diagram.shapes);
  const setTool = useStore((s) => s.setTool);
  const [idx, setIdx] = useState(0);

  // Only render when the presentation tool is active
  const visible = tool === 'present';
  useEffect(() => {
    if (visible) setIdx(0);
  }, [visible]);

  const visibleShapes = useMemo(
    () =>
      shapes.filter((s) => {
        const layer = useStore.getState().diagram.layers.find((l) => l.id === s.layerId);
        return layer?.visible !== false;
      }),
    [shapes]
  );

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setTool('select');
        return;
      }
      if (visibleShapes.length === 0) return;
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowRight' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        e.preventDefault();
        setIdx((i) => (i + 1) % visibleShapes.length);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setIdx((i) => (i - 1 + visibleShapes.length) % visibleShapes.length);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setIdx(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setIdx(visibleShapes.length - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, visibleShapes.length, setTool]);

  if (!visible) return null;
  if (visibleShapes.length === 0) {
    return (
      <div className="fixed inset-0 z-[80] bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl font-medium">No shapes to present</p>
          <p className="text-sm text-slate-400">Press Esc to exit.</p>
        </div>
      </div>
    );
  }
  const shape = visibleShapes[idx];
  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 h-12 border-b border-slate-800 text-sm text-slate-400">
        <span>Presentation mode</span>
        <span>
          {idx + 1} / {visibleShapes.length}
        </span>
        <button
          type="button"
          onClick={() => setTool('select')}
          className="px-2 py-1 rounded hover:bg-slate-800"
        >
          Esc
        </button>
      </header>
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-4 max-w-3xl">
          <div className="text-xs uppercase tracking-widest text-slate-500">{shape?.type}</div>
          <div className="text-5xl font-medium leading-tight">
            {shape?.text || shape?.name || '(no text)'}
          </div>
          {shape?.metadata ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-300 mt-6">
              {Object.entries(shape.metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-mono">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
      <footer className="flex items-center justify-between px-6 h-10 border-t border-slate-800 text-xs text-slate-500">
        <span>← → navigate · Home/End jump · Esc exit</span>
        <button
          type="button"
          onClick={() => setIdx((i) => (i - 1 + visibleShapes.length) % visibleShapes.length)}
          className="px-2 py-1 rounded hover:bg-slate-800"
        >
          ‹ Prev
        </button>
        <button
          type="button"
          onClick={() => setIdx((i) => (i + 1) % visibleShapes.length)}
          className="px-2 py-1 rounded hover:bg-slate-800"
        >
          Next ›
        </button>
      </footer>
    </div>
  );
}
