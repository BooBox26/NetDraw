// SVG canvas with custom pan/zoom, grid, rulers, and recursive rendering.
// All transformations are done via a single SVG `transform="translate(x y) scale(z)"`
// on the inner <g id="viewport"> so DOM events remain in world space.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore, selectViewport, selectUI, selectDiagram } from '../state/store';
import { screenToWorld, worldToScreen, pointInRect } from '../lib/geometry';
import { Grid } from './Grid';
import { Rulers } from './Rulers';
import { ShapeRenderer } from './ShapeRenderer';
import { ConnectorRenderer } from './ConnectorRenderer';
import { ConnectorMarkerDefs } from './ConnectorMarkers';
import { SelectionOverlay } from './SelectionOverlay';
import { Marquee } from './Marquee';
import { InlineEditor } from './InlineEditor';
import { ContextMenu } from './ContextMenu';
import { MiniMap } from './MiniMap';
import { SmartGuides } from './SmartGuides';
import { CommentPins } from './CommentPins';
import { ToolToast } from '../components/Toasts';
import { createShapeFromType } from '../shapes/factory';
import { smoothFreehand, bezierFromSamples, type Pt } from '../lib/drawing';
import { DEFAULT_STYLE, type Shape } from '../types/diagram';
import { shapeFromSvg } from '../lib/iconLibraries';
import { DEFAULT_ANCHORS } from '../shapes/types';

const basicTypes = new Set([
  'rectangle',
  'ellipse',
  'diamond',
  'parallelogram',
  'text',
  'line',
  'path',
  'image',
  'group',
  'rounded-rect',
  'hexagon',
  'octagon',
  'cylinder',
  'document',
  'callout',
  'sticky-note',
  'star',
  'triangle',
  'trapezoid',
  'chevron',
  'banner',
  'decision',
]);

export function Canvas({
  onCursorChange,
  projectId = null,
}: {
  onCursorChange?: (p: { x: number; y: number } | null) => void;
  projectId?: string | null;
} = {}): JSX.Element {
  const viewport = useStore(selectViewport);
  const ui = useStore(selectUI);
  const diagram = useStore(selectDiagram);
  const setViewport = useStore((s) => s.setViewport);
  const zoomBy = useStore((s) => s.zoomBy);
  const setTool = useStore((s) => s.setTool);
  const setHovered = useStore((s) => s.setHovered);
  const clearSelection = useStore((s) => s.clearSelection);
  const setMarquee = useStore((s) => s.setMarquee);
  const endDrag = useStore((s) => s.endDrag);
  const addShape = useStore((s) => s.addShape);
  const setEditing = useStore((s) => s.setEditing);
  const setContextMenu = useStore((s) => s.setContextMenu);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const spacePressedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragKindRef = useRef<'pan' | 'marquee' | 'draw' | null>(null);
  const isPointerDownRef = useRef(false);
  // Free-drawing state
  const drawSamplesRef = useRef<Pt[]>([]);
  const drawOriginRef = useRef<Pt | null>(null);
  const [drawPreview, setDrawPreview] = useState<{
    d: string;
    origin: Pt;
    tool: 'pen' | 'pencil' | 'highlighter';
  } | null>(null);

  // Track container size for ruler rendering and grid bounds
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track space bar for pan tool
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !isEditableTarget(e.target)) {
        spacePressedRef.current = true;
      }
    };
    const up = (e: KeyboardEvent): void => {
      if (e.code === 'Space') spacePressedRef.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const getScreen = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button === 1 || (e.button === 0 && (spacePressedRef.current || ui.tool === 'pan'))) {
        isPanningRef.current = true;
        pointerStartRef.current = getScreen(e);
        dragKindRef.current = 'pan';
        (e.target as Element).setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;
      // Alt+click anywhere drops an anchored comment at the world point.
      if (e.altKey && projectId !== null) {
        const world = screenToWorld(getScreen(e), viewport);
        const target = diagram.shapes.find((s) =>
          pointInRect(
            { x: world.x, y: world.y },
            { x: s.x, y: s.y, width: s.width, height: s.height }
          )
        );
        const text = window.prompt('Comment');
        if (text && text.trim()) {
          void import('../lib/comments').then(({ addComment }) => {
            addComment(projectId, {
              author: 'You',
              text: text.trim(),
              x: world.x,
              y: world.y,
              shapeId: target?.id ?? null,
            });
          });
        }
        return;
      }
      isPointerDownRef.current = true;
      const screen = getScreen(e);
      const world = screenToWorld(screen, viewport);
      pointerStartRef.current = screen;

      // Free-drawing tools: pen, pencil, highlighter
      if (ui.tool === 'pen' || ui.tool === 'pencil' || ui.tool === 'highlighter') {
        dragKindRef.current = 'draw';
        drawSamplesRef.current = [world];
        drawOriginRef.current = world;
        (e.target as Element).setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Marquee start
      setMarquee({ x: world.x, y: world.y, width: 0, height: 0 });
      dragKindRef.current = 'marquee';
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [getScreen, setMarquee, viewport, ui.tool, projectId, diagram.shapes]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const screen = getScreen(e);
      const worldCursor = screenToWorld(screen, viewport);
      onCursorChange?.(worldCursor);
      if (isPanningRef.current && pointerStartRef.current) {
        const dx = screen.x - pointerStartRef.current.x;
        const dy = screen.y - pointerStartRef.current.y;
        setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
        pointerStartRef.current = screen;
        return;
      }
      if (isPointerDownRef.current && dragKindRef.current === 'draw') {
        // Append sample, throttled by minimum distance
        const last = drawSamplesRef.current[drawSamplesRef.current.length - 1];
        const minDist = 2 / viewport.zoom;
        if (!last || Math.hypot(worldCursor.x - last.x, worldCursor.y - last.y) > minDist) {
          drawSamplesRef.current.push(worldCursor);
          const samples = [...drawSamplesRef.current];
          const origin = drawOriginRef.current ?? samples[0];
          const d = ui.tool === 'pen' ? bezierFromSamples(samples) : smoothFreehand(samples);
          setDrawPreview({ d, origin, tool: ui.tool as 'pen' | 'pencil' | 'highlighter' });
        }
        return;
      }
      if (isPointerDownRef.current && dragKindRef.current === 'marquee') {
        const start = pointerStartRef.current;
        if (!start) return;
        const startWorld = screenToWorld(start, viewport);
        const currentWorld = screenToWorld(screen, viewport);
        setMarquee({
          x: Math.min(startWorld.x, currentWorld.x),
          y: Math.min(startWorld.y, currentWorld.y),
          width: Math.abs(currentWorld.x - startWorld.x),
          height: Math.abs(currentWorld.y - startWorld.y),
        });
        return;
      }
      if (isPointerDownRef.current && (dragKindRef.current as string) === 'connect') {
        // Snap to a potential target shape
        const world = screenToWorld(screen, viewport);
        const target = diagram.shapes.find((s) =>
          pointInRect(
            { x: world.x, y: world.y },
            { x: s.x, y: s.y, width: s.width, height: s.height }
          )
        );
        setHovered(target ? target.id : null);
        return;
      }
    },
    [getScreen, setViewport, setMarquee, viewport, diagram.shapes, setHovered, ui.tool]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // noop — capture may not be active
      }
      if (isPanningRef.current) {
        isPanningRef.current = false;
        pointerStartRef.current = null;
        return;
      }
      onCursorChange?.(null);

      // Finalize a free-drawing stroke
      if (isPointerDownRef.current && dragKindRef.current === 'draw') {
        const samples = drawSamplesRef.current;
        if (samples.length >= 2) {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          for (const p of samples) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          }
          // Translate path to local coords (origin = top-left of bbox)
          const localSamples = samples.map((p) => ({ x: p.x - minX, y: p.y - minY }));
          const localD =
            ui.tool === 'pen' ? bezierFromSamples(localSamples) : smoothFreehand(localSamples);
          const isHL = ui.tool === 'highlighter';
          const stroke = isHL ? '#fde047' : ui.tool === 'pen' ? '#1e293b' : '#0f172a';
          const sw = isHL ? 16 : ui.tool === 'pen' ? 2 : 2.5;
          const shape: Shape = {
            id: `path-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'path',
            x: minX - 8,
            y: minY - 8,
            width: maxX - minX + 16,
            height: maxY - minY + 16,
            rotation: 0,
            style: {
              ...DEFAULT_STYLE,
              stroke,
              strokeWidth: sw,
              opacity: isHL ? 0.35 : 1,
              pathData: localD,
              isHighlighter: isHL,
            },
          };
          addShape(shape);
          // Switch back to select after each stroke
          setTool('select');
        }
        drawSamplesRef.current = [];
        drawOriginRef.current = null;
        setDrawPreview(null);
        isPointerDownRef.current = false;
        dragKindRef.current = null;
        return;
      }

      if (isPointerDownRef.current && dragKindRef.current === 'marquee' && ui.marquee) {
        const m = ui.marquee;
        if (m.width > 2 && m.height > 2) {
          // Find shapes inside the marquee (only from unlocked, visible layers).
          const selected = new Set<string>();
          for (const s of diagram.shapes) {
            const layer = diagram.layers.find((l) => l.id === s.layerId);
            if (!layer || layer.locked || !layer.visible) continue;
            if (
              s.x >= m.x &&
              s.y >= m.y &&
              s.x + s.width <= m.x + m.width &&
              s.y + s.height <= m.y + m.height
            ) {
              selected.add(s.id);
            }
          }
          if (selected.size > 0) {
            useStore.setState({
              ui: { ...ui, selection: { shapeIds: selected, connectorIds: new Set() } },
            });
          } else {
            clearSelection();
          }
        } else {
          // Click on empty area
          if (!e.shiftKey) clearSelection();
        }
      }
      isPointerDownRef.current = false;
      dragKindRef.current = null;
      setMarquee(null);
      setHovered(null);
      endDrag();
    },
    [
      ui,
      diagram.shapes,
      diagram.layers,
      clearSelection,
      setMarquee,
      setHovered,
      endDrag,
      addShape,
      setTool,
    ]
  );

  // Wheel — pan with ctrl/cmd+wheel, zoom otherwise (centered on cursor).
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomBy(factor, getScreen(e));
      } else {
        // pan
        setViewport((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };

    svgEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', handleWheel);
    };
  }, [zoomBy, getScreen, setViewport]);

  // Drop a library item on the canvas (dataTransfer MIME)
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (
      e.dataTransfer.types.includes('application/x-netdraw-shape') ||
      e.dataTransfer.types.includes('application/x-netdraw-svg') ||
      e.dataTransfer.types.includes('Files')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const screen = getScreen(e.nativeEvent);
      const world = screenToWorld(screen, viewport);
      // 1) Inline SVG dragged from the icon library
      const inlineSvg = e.dataTransfer.getData('application/x-netdraw-svg');
      if (inlineSvg) {
        e.preventDefault();
        const shape = shapeFromSvg(inlineSvg, world);
        addShape(shape);
        useStore.setState({
          ui: {
            ...useStore.getState().ui,
            selection: { shapeIds: new Set([shape.id]), connectorIds: new Set() },
          },
        });
        setTool('select');
        return;
      }
      // 2) File drop (image/svg+xml or any text file)
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        e.preventDefault();
        const file = files[0]!;
        const reader = new FileReader();
        reader.onload = () => {
          const text = String(reader.result ?? '');
          if (file.type.includes('svg') || text.trimStart().startsWith('<svg')) {
            const shape = shapeFromSvg(text, world);
            addShape(shape);
            useStore.setState({
              ui: {
                ...useStore.getState().ui,
                selection: { shapeIds: new Set([shape.id]), connectorIds: new Set() },
              },
            });
            setTool('select');
          }
        };
        reader.readAsText(file);
        return;
      }
      // 3) Regular shape type
      const type = e.dataTransfer.getData('application/x-netdraw-shape');
      if (!type) return;
      e.preventDefault();
      const shape = createShapeFromType(type, world);
      if (shape) {
        addShape(shape);
        useStore.setState({
          ui: {
            ...useStore.getState().ui,
            selection: { shapeIds: new Set([shape.id]), connectorIds: new Set() },
          },
        });
        setTool('select');
      }
    },
    [addShape, getScreen, setTool, viewport]
  );

  // Double-click empty canvas = create text
  const onDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const target = e.target as Element;
      if (target.closest('[data-shape-id]') || target.closest('[data-connector-id]')) return;
      const screen = getScreen(e);
      const world = screenToWorld(screen, viewport);
      const shape = createShapeFromType('text', world);
      if (shape) {
        addShape(shape);
        setEditing({ kind: 'shape', id: shape.id, field: 'text' });
        useStore.setState({
          ui: {
            ...useStore.getState().ui,
            selection: { shapeIds: new Set([shape.id]), connectorIds: new Set() },
          },
        });
      }
    },
    [addShape, getScreen, setEditing, viewport]
  );

  // Context menu (right click)
  const onContextMenu = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    [setContextMenu]
  );

  const cursor = useMemo(() => {
    if (isPanningRef.current) return 'grabbing';
    if (ui.tool === 'pan' || spacePressedRef.current) return 'grab';
    if (ui.tool === 'pen' || ui.tool === 'pencil' || ui.tool === 'highlighter') return 'crosshair';
    return 'default';
  }, [ui.tool]);

  return (
    <div
      ref={containerRef}
      className="nd-canvas-wrapper relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-900"
      style={{ cursor }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onPointerLeave={() => onCursorChange?.(null)}
    >
      <svg
        ref={svgRef}
        data-canvas-root
        className="nd-canvas-svg block w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        <defs>
          <pattern id="nd-grid-dot" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="rgba(100,116,139,0.35)" />
          </pattern>
          <pattern id="nd-grid-line" width="100" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M100 0 L0 0 0 100"
              fill="none"
              stroke="rgba(100,116,139,0.18)"
              stroke-width="0.5"
            />
          </pattern>
          <ConnectorMarkerDefs />
        </defs>

        <g
          id="viewport"
          transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`}
        >
          {/* Page background */}
          {diagram.page.pageMode === 'printable' ? (
            <rect
              x="0"
              y="0"
              width={diagram.page.width}
              height={diagram.page.height}
              fill={diagram.page.background}
              stroke="rgba(15,23,42,0.15)"
              strokeWidth={1.5 / viewport.zoom}
              style={{ filter: 'drop-shadow(0px 4px 8px rgba(15,23,42,0.08))' }}
            />
          ) : (
            <rect
              x="-50000"
              y="-50000"
              width="100000"
              height="100000"
              fill={diagram.page.background}
            />
          )}
          {ui.showGrid &&
            (diagram.page.pageMode === 'printable' ? (
              <Grid
                x={0}
                y={0}
                width={diagram.page.width}
                height={diagram.page.height}
                gridSize={diagram.page.gridSize}
                zoom={viewport.zoom}
              />
            ) : (
              <Grid
                x={-50000}
                y={-50000}
                width={100000}
                height={100000}
                gridSize={diagram.page.gridSize}
                zoom={viewport.zoom}
              />
            ))}
          {/* Render shapes per layer (z-order) — with viewport virtualization */}
          {[...diagram.layers]
            .filter((l) => l.visible)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((layer) => {
              // Viewport culling: in world coords, only render shapes that
              // intersect the visible window. Helps performance on large
              // diagrams. Selected/hovered shapes are always rendered.
              const wx = -viewport.x / viewport.zoom;
              const wy = -viewport.y / viewport.zoom;
              const ww = size.width / viewport.zoom;
              const wh = size.height / viewport.zoom;
              const pad = 100; // extra padding to avoid pop-in
              const isFocused = ui.focusMode;
              const activeLayerId = ui.activeLayerId;
              const opacity = isFocused ? (layer.id === activeLayerId ? 1 : 0.1) : layer.opacity;
              return (
                <g key={layer.id} data-layer-id={layer.id} opacity={opacity}>
                  {[...diagram.shapes]
                    .filter((s) => (s.layerId ?? 'layer-default') === layer.id)
                    .filter((s) => {
                      if (ui.hideLabels && s.type === 'text') return false;
                      if (ui.hideEquipment && !basicTypes.has(s.type)) return false;
                      return true;
                    })
                    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                    .filter((s) => {
                      // Always render selected, hovered, or in active drag
                      if (ui.selection.shapeIds.has(s.id)) return true;
                      if (ui.hoveredId === s.id) return true;
                      if (ui.dragState?.translateIds?.some((t) => t.id === s.id)) return true;
                      if (s.type === 'path' || s.type === 'image') return true; // free-draw may have large bbox
                      return (
                        s.x + s.width >= wx - pad &&
                        s.x <= wx + ww + pad &&
                        s.y + s.height >= wy - pad &&
                        s.y <= wy + wh + pad
                      );
                    })
                    .map((shape) => (
                      <ShapeRenderer
                        key={shape.id}
                        shape={shape}
                        selected={ui.selection.shapeIds.has(shape.id)}
                        hovered={ui.hoveredId === shape.id}
                        isConnecting={ui.connectingFromShapeId === shape.id}
                      />
                    ))}
                  {!ui.hideLinks &&
                    [...diagram.connectors]
                      .filter((c) => {
                        // Always render if selected or part of the drag set
                        if (ui.selection.connectorIds.has(c.id)) return true;
                        // Otherwise: render only if at least one endpoint is in the viewport
                        const s = c.sourceId
                          ? diagram.shapes.find((sh) => sh.id === c.sourceId)
                          : null;
                        const t = c.targetId
                          ? diagram.shapes.find((sh) => sh.id === c.targetId)
                          : null;
                        const inView = (sh: typeof s) =>
                          sh &&
                          sh.x + sh.width >= wx - pad &&
                          sh.x <= wx + ww + pad &&
                          sh.y + sh.height >= wy - pad &&
                          sh.y <= wy + wh + pad;
                        if (inView(s) || inView(t)) return true;
                        if (c.sourcePoint && c.targetPoint) {
                          return (
                            Math.max(c.sourcePoint.x, c.targetPoint.x) >= wx - pad &&
                            Math.min(c.sourcePoint.x, c.targetPoint.x) <= wx + ww + pad &&
                            Math.max(c.sourcePoint.y, c.targetPoint.y) >= wy - pad &&
                            Math.min(c.sourcePoint.y, c.targetPoint.y) <= wy + wh + pad
                          );
                        }
                        return true; // free-point connectors are always small enough
                      })
                      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                      .map((conn) => (
                        <ConnectorRenderer
                          key={conn.id}
                          connector={conn}
                          selected={ui.selection.connectorIds.has(conn.id)}
                        />
                      ))}
                </g>
              );
            })}

          {ui.marquee && <Marquee box={ui.marquee} zoom={viewport.zoom} />}
          {drawPreview && (
            <path
              d={drawPreview.d}
              fill="none"
              stroke={
                drawPreview.tool === 'highlighter'
                  ? '#fde047'
                  : drawPreview.tool === 'pen'
                    ? '#1e293b'
                    : '#0f172a'
              }
              strokeWidth={
                drawPreview.tool === 'highlighter'
                  ? 16 / viewport.zoom
                  : drawPreview.tool === 'pen'
                    ? 2 / viewport.zoom
                    : 2.5 / viewport.zoom
              }
              opacity={drawPreview.tool === 'highlighter' ? 0.35 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {ui.dragState &&
            ui.dragState.kind === 'connector' &&
            ui.connectingFromShapeId &&
            (() => {
              const sourceShape = diagram.shapes.find((s) => s.id === ui.connectingFromShapeId);
              if (!sourceShape) return null;
              const sourceAnchors = DEFAULT_ANCHORS(sourceShape);
              const startAnchor = sourceAnchors.find((a) => a.id === ui.connectingFromAnchor) ?? {
                x: 0,
                y: 0,
              };
              const startPoint = {
                x: sourceShape.x + startAnchor.x,
                y: sourceShape.y + startAnchor.y,
              };
              const endPoint = ui.dragState.lastWorld;
              return (
                <line
                  x1={startPoint.x}
                  y1={startPoint.y}
                  x2={endPoint.x}
                  y2={endPoint.y}
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  pointerEvents="none"
                />
              );
            })()}
          <SelectionOverlay />
          <SmartGuides />
          <CommentPins projectId={projectId} />
        </g>

        <InlineEditor />
        {ui.showRulers && <Rulers width={size.width} height={size.height} viewport={viewport} />}
      </svg>

      <ContextMenu />
      <MiniMap />
      <ToolToast />
    </div>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

// Suppress unused-import warnings for items re-exported elsewhere.
export { worldToScreen };
