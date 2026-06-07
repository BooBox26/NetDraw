// Mini-map: a tiny overview of the whole page with a draggable viewport
// rectangle. Lets users navigate large diagrams without losing context.

import { useCallback, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import type { BoundingBox } from '../types/diagram';

const W = 200;
const H = 130;
const PAD = 8;

export function MiniMap(): JSX.Element {
  const diagram = useStore((s) => s.diagram);
  const viewport = useStore((s) => s.ui.viewport);
  const setViewport = useStore((s) => s.setViewport);
  const size = { width: W, height: H };
  const [dragging, setDragging] = useState(false);

  // Compute the world bounding box of all shapes + the page.
  const world = useMemo<BoundingBox & { pageW: number; pageH: number }>(() => {
    const pageW = diagram.page.width;
    const pageH = diagram.page.height;
    let minX = 0;
    let minY = 0;
    let maxX = pageW;
    let maxY = pageH;
    for (const s of diagram.shapes) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    }
    // Pad
    const pad = 40;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, pageW, pageH };
  }, [diagram.shapes, diagram.page.width, diagram.page.height]);

  const aspect = world.width / world.height;
  const innerW = size.width - PAD * 2;
  const innerH = size.height - PAD * 2;
  const fitAspect = innerW / innerH;
  let mapW: number;
  let mapH: number;
  if (aspect > fitAspect) {
    mapW = innerW;
    mapH = innerW / aspect;
  } else {
    mapH = innerH;
    mapW = innerH * aspect;
  }
  const scaleX = mapW / world.width;
  const scaleY = mapH / world.height;
  const offsetX = PAD + (innerW - mapW) / 2;
  const offsetY = PAD + (innerH - mapH) / 2;

  // World ↔ map (in pixels) helpers
  const worldToMap = useCallback(
    (p: { x: number; y: number }) => ({
      x: offsetX + (p.x - world.x) * scaleX,
      y: offsetY + (p.y - world.y) * scaleY,
    }),
    [offsetX, offsetY, scaleX, scaleY, world.x, world.y]
  );

  const mapToWorld = useCallback(
    (p: { x: number; y: number }) => ({
      x: world.x + (p.x - offsetX) / scaleX,
      y: world.y + (p.y - offsetY) / scaleY,
    }),
    [offsetX, offsetY, scaleX, scaleY, world.x, world.y]
  );

  // Compute the visible viewport rectangle (in map coords).
  // viewport.x/y are screen-space offsets of the world origin; viewport.zoom
  // is the scale. The visible world area is the current canvas size in world coords.
  const canvasSize = useMemo(() => {
    const el = document.querySelector('[data-canvas-root]') as SVGSVGElement | null;
    const w = el?.clientWidth ?? 800;
    const h = el?.clientHeight ?? 600;
    return { w, h };
  }, [diagram.shapes.length, viewport.zoom, size.width]);
  const visibleWorld = useMemo(() => {
    const w = canvasSize.w / viewport.zoom;
    const h = canvasSize.h / viewport.zoom;
    const topLeft = { x: -viewport.x / viewport.zoom, y: -viewport.y / viewport.zoom };
    return { x: topLeft.x, y: topLeft.y, width: w, height: h };
  }, [canvasSize, viewport]);
  const viewportRect = useMemo(() => {
    const tl = worldToMap({ x: visibleWorld.x, y: visibleWorld.y });
    const br = worldToMap({
      x: visibleWorld.x + visibleWorld.width,
      y: visibleWorld.y + visibleWorld.height,
    });
    return {
      x: tl.x,
      y: tl.y,
      width: Math.max(4, br.x - tl.x),
      height: Math.max(4, br.y - tl.y),
    };
  }, [visibleWorld, worldToMap]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.stopPropagation();
      e.preventDefault();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setDragging(true);
      panTo(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worldToMap, canvasSize, viewport.zoom]
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragging) return;
      e.stopPropagation();
      e.preventDefault();
      panTo(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragging, worldToMap, canvasSize, viewport.zoom]
  );
  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
    setDragging(false);
  }, []);

  function panTo(e: React.PointerEvent<SVGSVGElement>): void {
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const mapPoint = {
      x: (screen.x / rect.width) * size.width,
      y: (screen.y / rect.height) * size.height,
    };
    const worldCenter = mapToWorld(mapPoint);
    // Center the viewport on the world point.
    const newX = canvasSize.w / 2 - worldCenter.x * viewport.zoom;
    const newY = canvasSize.h / 2 - worldCenter.y * viewport.zoom;
    setViewport({ x: newX, y: newY, zoom: viewport.zoom });
  }

  return (
    <div className="nd-no-print absolute right-3 bottom-3 z-30 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-lg backdrop-blur">
      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span>Overview</span>
        <span className="text-slate-400 normal-case font-normal">
          {Math.round(world.width)} × {Math.round(world.height)}
        </span>
      </div>
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="block"
        style={{ cursor: 'crosshair' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Background */}
        <rect x={0} y={0} width={size.width} height={size.height} fill="rgba(248,250,252,0.9)" />
        {/* Page outline */}
        <rect
          x={offsetX}
          y={offsetY}
          width={mapW}
          height={mapH}
          fill="rgba(255,255,255,1)"
          stroke="rgba(15,23,42,0.25)"
          strokeWidth={1}
        />
        {/* Shapes */}
        {diagram.shapes.map((s) => {
          const tl = worldToMap({ x: s.x, y: s.y });
          const br = worldToMap({ x: s.x + s.width, y: s.y + s.height });
          return (
            <rect
              key={s.id}
              x={tl.x}
              y={tl.y}
              width={Math.max(1, br.x - tl.x)}
              height={Math.max(1, br.y - tl.y)}
              fill={s.style.fill || '#cbd5e1'}
              stroke={s.style.stroke || '#475569'}
              strokeWidth={0.5}
              opacity={0.85}
            />
          );
        })}
        {/* Viewport indicator */}
        <rect
          x={viewportRect.x}
          y={viewportRect.y}
          width={viewportRect.width}
          height={viewportRect.height}
          fill="rgba(37,99,235,0.12)"
          stroke="#2563eb"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
