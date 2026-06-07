// Renders remote collaborator cursors as a fixed overlay above the canvas.
// Receives a CollabHandle, subscribes to peer presence, and positions a
// small SVG cursor + name label using the current viewport transform.

import { useEffect, useState } from 'react';
import { useStore, selectViewport } from '../state/store';
import { worldToScreen } from '../lib/geometry';
import { useCollabPeers, type CollabHandle } from '../lib/collab';

export function RemoteCursors({ collab }: { collab: CollabHandle | null }): JSX.Element | null {
  const viewport = useStore(selectViewport);
  const peers = useCollabPeers(collab);
  const [containerRect, setContainerRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const update = (): void => {
      const el = document.querySelector('.nd-canvas-wrapper');
      if (!el) return setContainerRect(null);
      const r = el.getBoundingClientRect();
      setContainerRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };
    update();
    window.addEventListener('resize', update);
    const id = window.setInterval(update, 500);
    return () => {
      window.removeEventListener('resize', update);
      window.clearInterval(id);
    };
  }, []);

  if (!collab || peers.length === 0 || !containerRect) return null;
  return (
    <div
      className="nd-no-print pointer-events-none fixed z-40"
      style={{
        left: containerRect.left,
        top: containerRect.top,
        width: containerRect.width,
        height: containerRect.height,
        overflow: 'hidden',
      }}
      aria-hidden
    >
      {peers
        .filter((p) => p.cursor)
        .map((p) => {
          const screen = worldToScreen(p.cursor!, viewport);
          if (screen.x < 0 || screen.x > containerRect.width) return null;
          if (screen.y < 0 || screen.y > containerRect.height) return null;
          return (
            <div
              key={p.id}
              className="absolute transition-transform duration-75 ease-linear"
              style={{ transform: `translate(${screen.x}px, ${screen.y}px)` }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}
              >
                <path d="M5 3l7 17 2-7 7-2L5 3z" fill={p.color} stroke="white" strokeWidth="1" />
              </svg>
              <span
                className="absolute top-5 left-4 text-[10px] font-semibold text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap"
                style={{ background: p.color }}
              >
                {p.name}
              </span>
            </div>
          );
        })}
    </div>
  );
}
