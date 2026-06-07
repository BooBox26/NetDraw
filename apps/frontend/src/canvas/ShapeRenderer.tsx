// Renders a single shape with its selection chrome and anchor points.
// Pointer events bubble up to the canvas for marquee / pan detection.
// Resize and rotation are computed in the shape's LOCAL coordinate frame
// so they remain correct even when the shape is rotated.

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { Point, Shape } from '../types/diagram';
import { useStore } from '../state/store';
import { getPlugin } from '../shapes/library';
import { nearestAnchor, getAllAnchors } from '../shapes/types';
import { snapToGrid } from '../lib/snap';
import { createConnector } from '../shapes/factory';
import { screenToWorld } from '../lib/geometry';
import { computeSmartGuides, bboxOfShapes } from '../lib/alignment';
import type { ResizeHandle } from '../state/store';
import { getHashColor, checkIpInSubnet, cleanIp } from '../lib/linkValidation';
import DOMPurify from 'dompurify';

interface ShapeRendererProps {
  shape: Shape;
  selected: boolean;
  hovered: boolean;
  isConnecting: boolean;
}

/** Convert a world point into the shape's local (un-rotated) frame. */
function worldToLocal(world: Point, shape: Shape): Point {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const rad = -(shape.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = world.x - cx;
  const dy = world.y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

/** Center of a shape in world coordinates (rotation-invariant). */
function shapeCenter(s: Shape): Point {
  return { x: s.x + s.width / 2, y: s.y + s.height / 2 };
}

function ShapeRendererImpl({
  shape,
  selected,
  hovered,
  isConnecting,
}: ShapeRendererProps): JSX.Element {
  const selectShape = useStore((s) => s.selectShape);
  const setHovered = useStore((s) => s.setHovered);
  const editing = useStore((s) => s.ui.editing);
  const setEditing = useStore((s) => s.setEditing);
  const startDrag = useStore((s) => s.startDrag);
  const updateDrag = useStore((s) => s.updateDrag);
  const addConnector = useStore((s) => s.addConnector);
  const tool = useStore((s) => s.ui.tool);
  const zoom = useStore((s) => s.ui.viewport.zoom);
  const setConnecting = useStore((s) => s.setConnecting);
  const connectingFromAnchor = useStore((s) => s.ui.connectingFromAnchor);
  const setMarquee = useStore((s) => s.setMarquee);
  const dragState = useStore((s) => s.ui.dragState);
  const hideLabels = useStore((s) => s.ui.hideLabels);
  const groupRef = useRef<SVGGElement | null>(null);
  const connectors = useStore((s) => s.diagram.connectors);
  const subnets = useStore((s) => s.diagram.subnets);
  const [hoveredAnchorId, setHoveredAnchorId] = useState<string | null>(null);

  const plugin = getPlugin(shape.type);

  const isEditingText =
    editing?.kind === 'shape' && editing.id === shape.id && editing.field === 'text';

  const isLayerLocked = useStore((s) => {
    const layer = s.diagram.layers.find((l) => l.id === shape.layerId);
    return layer ? !layer.visible || layer.locked : false;
  });

  // Pointer-down on a shape
  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (isLayerLocked) return;
      e.stopPropagation();
      // multi-select with shift
      if (e.shiftKey) {
        selectShape(shape.id, 'toggle');
        return;
      }
      // connector tool
      if (tool === 'connector') {
        setConnecting(shape.id, 'center');
        return;
      }
      // if shape not yet selected, select it (replace)
      const sel = useStore.getState().ui.selection;
      if (!sel.shapeIds.has(shape.id)) {
        selectShape(shape.id, 'replace');
      }
      if (shape.locked) return;
      // Begin drag
      const target = e.currentTarget as SVGGElement;
      target.setPointerCapture(e.pointerId);
      const svg = target.ownerSVGElement;
      const rect = svg?.getBoundingClientRect();
      if (!svg || !rect) return;
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const viewport = useStore.getState().ui.viewport;
      const world = screenToWorld(screen, viewport);
      const page = useStore.getState().diagram.page;
      const finalWorld = useStore.getState().ui.snap
        ? { x: snapToGrid(world.x, page.gridSize), y: snapToGrid(world.y, page.gridSize) }
        : world;
      // Build the initial translate set: all selected shapes + any shapes in the
      // same group as a selected shape (so groups move as one).
      const initialIds = new Set<string>(
        sel.shapeIds.has(shape.id) ? Array.from(sel.shapeIds) : [shape.id]
      );
      const allShapes = useStore.getState().diagram.shapes;
      for (const s of allShapes) {
        if (s.parentId && initialIds.has(s.parentId)) {
          initialIds.add(s.id);
        }
      }
      const translateIds = Array.from(initialIds)
        .map((id) => useStore.getState().getShape(id))
        .filter((s): s is Shape => Boolean(s))
        .map((s) => ({ id: s.id, type: 'shape' as const, startX: s.x, startY: s.y }));
      startDrag({
        kind: 'translate',
        startWorld: finalWorld,
        lastWorld: finalWorld,
        translateIds,
      });
    },
    [isLayerLocked, selectShape, shape.id, tool, setConnecting, startDrag]
  );

  // Pointer move while dragging
  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!dragState || dragState.kind !== 'translate') return;
      const target = e.currentTarget as SVGGElement;
      const svg = target.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const state = useStore.getState();
      const viewport = state.ui.viewport;
      const world = screenToWorld(screen, viewport);
      const page = state.diagram.page;
      const snap = state.ui.snap;
      const smartGuides = state.ui.smartGuides;
      let finalWorld = snap
        ? { x: snapToGrid(world.x, page.gridSize), y: snapToGrid(world.y, page.gridSize) }
        : world;
      const dx = finalWorld.x - dragState.startWorld.x;
      const dy = finalWorld.y - dragState.startWorld.y;
      // Build the dragged bounding box (for smart guides) and apply translate.
      const draggedIds = new Set((dragState.translateIds ?? []).map((t) => t.id));
      const moved = (dragState.translateIds ?? []).map((t) => {
        const startX = t.startX ?? 0;
        const startY = t.startY ?? 0;
        const sh = state.diagram.shapes.find((s) => s.id === t.id);
        return {
          id: t.id,
          x: startX + dx,
          y: startY + dy,
          width: sh?.width ?? 0,
          height: sh?.height ?? 0,
        };
      });
      // Apply move
      useStore.setState((s) => ({
        diagram: {
          ...s.diagram,
          shapes: s.diagram.shapes.map((sh) => {
            const next = moved.find((t) => t.id === sh.id);
            return next ? { ...sh, x: next.x, y: next.y } : sh;
          }),
        },
      }));
      // Smart guides
      if (smartGuides && moved.length > 0) {
        const draggedBbox = bboxOfShapes(
          moved.map((m) => ({
            x: m.x,
            y: m.y,
            width: m.width,
            height: m.height,
            id: m.id,
            type: '',
            style: { fill: '', stroke: '', strokeWidth: 0, opacity: 1 },
            rotation: 0,
          }))
        );
        const result = computeSmartGuides(draggedBbox, state.diagram.shapes, draggedIds);
        finalWorld = { x: finalWorld.x + result.dx, y: finalWorld.y + result.dy };
        if (result.dx !== 0 || result.dy !== 0) {
          // Re-apply with the snap delta added.
          const moved2 = moved.map((m) => ({ ...m, x: m.x + result.dx, y: m.y + result.dy }));
          useStore.setState((s) => ({
            diagram: {
              ...s.diagram,
              shapes: s.diagram.shapes.map((sh) => {
                const next = moved2.find((t) => t.id === sh.id);
                return next ? { ...sh, x: next.x, y: next.y } : sh;
              }),
            },
          }));
        }
        useStore.getState().setDragGuides(result.guides);
      } else {
        useStore.getState().setDragGuides([]);
      }
      updateDrag({ lastWorld: finalWorld });
    },
    [dragState, updateDrag]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // noop
      }
      useStore.getState().setDragGuides([]);
      if (dragState && dragState.kind === 'translate' && dragState.translateIds) {
        const ids = dragState.translateIds.map((t) => t.id);
        const before = useStore.getState().diagram.shapes;
        const startPositions = new Map(
          dragState.translateIds.map((t) => [t.id, { x: t.startX ?? 0, y: t.startY ?? 0 }])
        );
        const label = `Move ${ids.length} shape${ids.length > 1 ? 's' : ''}`;
        useStore.getState().history.push({
          label,
          before: { ...useStore.getState().diagram, shapes: before },
          after: { ...useStore.getState().diagram, shapes: useStore.getState().diagram.shapes },
          run: () => {},
          invert: () => {
            useStore.setState((state) => ({
              diagram: {
                ...state.diagram,
                shapes: state.diagram.shapes.map((s) => {
                  const orig = startPositions.get(s.id);
                  return orig ? { ...s, x: orig.x, y: orig.y } : s;
                }),
              },
            }));
          },
        });
        useStore.setState((s) => ({ ui: { ...s.ui, isDirty: true } }));
      }
      useStore.getState().endDrag();
      setMarquee(null);
    },
    [dragState, setMarquee]
  );

  // Double-click — edit text inline
  const onDoubleClick = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      e.stopPropagation();
      if (shape.type === 'text' || shape.text !== undefined) {
        setEditing({ kind: 'shape', id: shape.id, field: 'text' });
      }
    },
    [shape, setEditing]
  );

  // Resize handle (operates in the shape's LOCAL frame so it works on rotated shapes)
  const onHandlePointerDown = useCallback(
    (handle: ResizeHandle, e: React.PointerEvent<SVGRectElement>) => {
      e.stopPropagation();
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const viewport = useStore.getState().ui.viewport;
      const world = screenToWorld(screen, viewport);
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      // Convert pointer to the shape's local (un-rotated) frame.
      const local = worldToLocal(world, shape);
      useStore.getState().startDrag({
        kind: 'resize',
        startWorld: world,
        lastWorld: world,
        startLocal: local,
        resizeHandle: handle,
        resizeInitial: [{ ...shape }],
      });
    },
    [shape]
  );

  const onHandlePointerMove = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    const ds = useStore.getState().ui.dragState;
    if (!ds || ds.kind !== 'resize') return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const viewport = useStore.getState().ui.viewport;
    const world = screenToWorld(screen, viewport);
    const page = useStore.getState().diagram.page;
    const snap = useStore.getState().ui.snap;
    const initial = ds.resizeInitial?.[0];
    if (!initial) return;
    const startLocal = ds.startLocal;
    if (!startLocal) return;
    // Convert current pointer to the shape's initial local frame.
    const currentLocal = worldToLocal(world, initial);
    let dx = currentLocal.x - startLocal.x;
    let dy = currentLocal.y - startLocal.y;
    // Free aspect ratio (no shift lock)
    const aspect = e.shiftKey && initial.width > 0 ? initial.height / initial.width : null;
    let nx = initial.x;
    let ny = initial.y;
    let nw = initial.width;
    let nh = initial.height;
    const h = ds.resizeHandle;
    if (h?.includes('e')) nw = Math.max(8, initial.width + dx);
    if (h?.includes('s')) nh = Math.max(8, initial.height + dy);
    if (h?.includes('w')) {
      nw = Math.max(8, initial.width - dx);
      nx = initial.x + (initial.width - nw);
    }
    if (h?.includes('n')) {
      nh = Math.max(8, initial.height - dy);
      ny = initial.y + (initial.height - nh);
    }
    if (aspect) {
      // Lock aspect ratio relative to whichever dimension is being dragged.
      if (h?.includes('e') || h?.includes('w')) {
        nh = nw * aspect;
        if (h?.includes('n')) ny = initial.y + (initial.height - nh);
      } else if (h?.includes('s') || h?.includes('n')) {
        nw = nh / aspect;
        if (h?.includes('w')) nx = initial.x + (initial.width - nw);
      }
    }
    if (snap) {
      nx = snapToGrid(nx, page.gridSize);
      ny = snapToGrid(ny, page.gridSize);
      nw = Math.max(8, snapToGrid(nw, page.gridSize));
      nh = Math.max(8, snapToGrid(nh, page.gridSize));
    }
    useStore.setState((s) => ({
      diagram: {
        ...s.diagram,
        shapes: s.diagram.shapes.map((sh) =>
          sh.id === initial.id ? { ...sh, x: nx, y: ny, width: nw, height: nh } : sh
        ),
      },
    }));
    useStore.getState().updateDrag({ lastWorld: world });
  }, []);

  const onHandlePointerUp = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
    const ds = useStore.getState().ui.dragState;
    if (ds && ds.kind === 'resize' && ds.resizeInitial?.[0]) {
      const before = ds.resizeInitial[0];
      const after = useStore.getState().getShape(before.id);
      if (after) {
        useStore.getState().history.push({
          label: 'Resize',
          before: { ...useStore.getState().diagram, shapes: [before] },
          after: { ...useStore.getState().diagram, shapes: [after] },
          run: () => {},
          invert: () => {
            useStore.setState((s) => ({
              diagram: {
                ...s.diagram,
                shapes: s.diagram.shapes.map((sh) => (sh.id === before.id ? before : sh)),
              },
            }));
          },
        });
        useStore.setState((s) => ({ ui: { ...s.ui, isDirty: true } }));
      }
    }
    useStore.getState().endDrag();
  }, []);

  // Rotation handle (uses RELATIVE rotation: rotation = initial + delta)
  const onRotatePointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      e.stopPropagation();
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const viewport = useStore.getState().ui.viewport;
      const world = screenToWorld(screen, viewport);
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      const center = shapeCenter(shape);
      // Compute the starting angle of the pointer relative to the center.
      const startAngle = (Math.atan2(world.y - center.y, world.x - center.x) * 180) / Math.PI;
      useStore.getState().startDrag({
        kind: 'rotate',
        startWorld: world,
        lastWorld: world,
        startAngle,
        rotateId: shape.id,
        rotateInitial: shape.rotation,
        rotateCenter: center,
      });
    },
    [shape]
  );

  const onRotatePointerMove = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    const ds = useStore.getState().ui.dragState;
    if (!ds || ds.kind !== 'rotate' || !ds.rotateCenter) return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const viewport = useStore.getState().ui.viewport;
    const world = screenToWorld(screen, viewport);
    const currentAngle =
      (Math.atan2(world.y - ds.rotateCenter.y, world.x - ds.rotateCenter.x) * 180) / Math.PI;
    let delta = currentAngle - (ds.startAngle ?? 0);
    // Normalize delta to (-180, 180] to avoid jumps when crossing 180/-180.
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    let deg = (ds.rotateInitial ?? 0) + delta;
    if (e.shiftKey) deg = Math.round(deg / 15) * 15;
    if (ds.rotateId) {
      useStore.setState((s) => ({
        diagram: {
          ...s.diagram,
          shapes: s.diagram.shapes.map((sh) =>
            sh.id === ds.rotateId ? { ...sh, rotation: deg } : sh
          ),
        },
      }));
    }
    useStore.getState().updateDrag({ lastWorld: world });
  }, []);

  const onRotatePointerUp = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
    const ds = useStore.getState().ui.dragState;
    if (ds && ds.kind === 'rotate' && ds.rotateId) {
      const id = ds.rotateId;
      const before = useStore.getState().getShape(id);
      const beforeRot = ds.rotateInitial ?? 0;
      if (before) {
        useStore.getState().history.push({
          label: 'Rotate',
          before: { ...useStore.getState().diagram, shapes: [{ ...before, rotation: beforeRot }] },
          after: { ...useStore.getState().diagram, shapes: [before] },
          run: () => {},
          invert: () => {
            useStore.setState((s) => ({
              diagram: {
                ...s.diagram,
                shapes: s.diagram.shapes.map((sh) =>
                  sh.id === id ? { ...sh, rotation: beforeRot } : sh
                ),
              },
            }));
          },
        });
        useStore.setState((s) => ({ ui: { ...s.ui, isDirty: true } }));
      }
    }
    useStore.getState().endDrag();
  }, []);

  const onAnchorPointerDown = useCallback(
    (anchor: string, e: React.PointerEvent<SVGElement>) => {
      e.stopPropagation();
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const viewport = useStore.getState().ui.viewport;
      const world = screenToWorld(screen, viewport);
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setConnecting(shape.id, anchor);
      useStore.getState().startDrag({
        kind: 'connector',
        startWorld: world,
        lastWorld: world,
      });
    },
    [shape.id, setConnecting]
  );

  const onAnchorPointerMove = useCallback(
    (_anchor: string, e: React.PointerEvent<SVGElement>) => {
      e.stopPropagation();
      const dragState = useStore.getState().ui.dragState;
      if (!dragState || dragState.kind !== 'connector') return;
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const viewport = useStore.getState().ui.viewport;
      const world = screenToWorld(screen, viewport);

      // Port snapping (other shapes' anchor points)
      let snapTarget: { shapeId: string; anchorId: string; point: Point } | null = null;
      let bestDist = 20; // snap threshold in world units
      const shapes = useStore.getState().diagram.shapes;
      for (const s of shapes) {
        if (s.id === shape.id) continue;
        const anchors = getAllAnchors(s);
        for (const a of anchors) {
          const ax = s.x + a.x;
          const ay = s.y + a.y;
          const dist = Math.hypot(world.x - ax, world.y - ay);
          if (dist < bestDist) {
            bestDist = dist;
            snapTarget = { shapeId: s.id, anchorId: a.id, point: { x: ax, y: ay } };
          }
        }
      }

      const lastWorld = snapTarget ? snapTarget.point : world;
      useStore.getState().updateDrag({ lastWorld });
      useStore.setState((s) => ({
        ui: {
          ...s.ui,
          hoveredId: snapTarget ? snapTarget.shapeId : null,
        },
      }));
    },
    [shape.id]
  );

  const onAnchorPointerUp = useCallback(
    (_anchor: string, e: React.PointerEvent<SVGElement>) => {
      e.stopPropagation();
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {}

      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const shapeG = elem?.closest('[data-shape-id]') as HTMLElement | null;
      const otherId = shapeG?.dataset.shapeId;

      let targetAnchor = 'center';
      if (shapeG && otherId && otherId !== shape.id) {
        const targetShape = useStore.getState().getShape(otherId);
        if (targetShape) {
          const viewport = useStore.getState().ui.viewport;
          const svg = e.currentTarget.ownerSVGElement;
          if (svg) {
            const rect = svg.getBoundingClientRect();
            const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const world = screenToWorld(screen, viewport);
            const bestAnchor = nearestAnchor(targetShape, world);
            if (bestAnchor) {
              targetAnchor = bestAnchor.id;
            }
          }
        }
        const hasSourcePorts = shape?.ports && shape.ports.length > 0;
        const hasTargetPorts = targetShape?.ports && targetShape.ports.length > 0;
        if (targetShape && (hasSourcePorts || hasTargetPorts)) {
          useStore.setState((s) => ({
            ui: {
              ...s.ui,
              pendingConnection: {
                sourceId: shape.id,
                targetId: otherId,
                sourceAnchor: connectingFromAnchor,
                targetAnchor,
              },
            },
          }));
        } else {
          addConnector(
            createConnector(shape.id, otherId, { sourceAnchor: connectingFromAnchor, targetAnchor })
          );
        }
      } else {
        // Fallback: connect to free point (snapped to grid if active)
        const svg = e.currentTarget.ownerSVGElement;
        if (svg) {
          const rect = svg.getBoundingClientRect();
          const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          const viewport = useStore.getState().ui.viewport;
          const world = screenToWorld(screen, viewport);
          const targetPoint = useStore.getState().ui.snap
            ? {
                x: snapToGrid(world.x, useStore.getState().diagram.page.gridSize),
                y: snapToGrid(world.y, useStore.getState().diagram.page.gridSize),
              }
            : world;
          addConnector(
            createConnector(shape.id, null, { sourceAnchor: connectingFromAnchor, targetPoint })
          );
        }
      }
      setConnecting(null);
      useStore.getState().endDrag();
      useStore.setState((s) => ({ ui: { ...s.ui, hoveredId: null } }));
    },
    [shape.id, connectingFromAnchor, addConnector, setConnecting]
  );

  const showAnchors = useMemo(
    () => selected || hovered || isConnecting,
    [selected, hovered, isConnecting]
  );

  const body = useMemo(() => {
    if (isEditingText && shape.type === 'text') {
      return '';
    }
    if (zoom < 0.15) {
      // LOD (Level of Detail) optimization for extremely zoomed-out viewports.
      // Renders a simple box representing the node's dimensions.
      return `<rect x="0" y="0" width="${shape.width}" height="${shape.height}" fill="${shape.style.fill}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}" opacity="0.65"/>`;
    }
    if (plugin) {
      return plugin.renderBody(shape);
    }
    // Free-drawing path: render the path data in local coordinates, padded
    // by 8px so anti-aliased strokes aren't clipped.
    if (shape.type === 'path' && shape.style.pathData) {
      const pd = shape.style.pathData;
      const stroke = shape.style.stroke;
      const sw = shape.style.strokeWidth;
      const op = shape.style.opacity;
      return `<path d="${pd}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    // Custom SVG image shapes (drop-in or icon library)
    if (shape.type === 'image' && shape.data?.svg) {
      try {
        const sanitized = DOMPurify.sanitize(shape.data.svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
        });
        let svgStr = sanitized.trim();
        svgStr = svgStr.replace(/^(<svg[^>]*?)\s+width=["'].*?["']/i, '$1');
        svgStr = svgStr.replace(/^(<svg[^>]*?)\s+height=["'].*?["']/i, '$1');
        svgStr = svgStr.replace(/^(<svg)/i, `$1 width="${shape.width}" height="${shape.height}"`);
        return svgStr;
      } catch {
        return '';
      }
    }
    return `<rect x="0" y="0" width="${shape.width}" height="${shape.height}" fill="${shape.style.fill}" stroke="${shape.style.stroke}" stroke-width="${shape.style.strokeWidth}"/>`;
  }, [plugin, shape, zoom, isEditingText]);

  if (isLayerLocked && !selected) return <g />;

  return (
    <g
      ref={groupRef}
      data-shape-id={shape.id}
      transform={`translate(${shape.x} ${shape.y}) rotate(${shape.rotation} ${shape.width / 2} ${shape.height / 2})`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHovered(shape.id)}
      onMouseLeave={() => setHovered(null)}
      style={{ cursor: tool === 'connector' ? 'crosshair' : 'move' }}
    >
      <rect
        x={-2}
        y={-2}
        width={shape.width + 4}
        height={shape.height + 4}
        fill="transparent"
        pointerEvents="all"
      />
      <g dangerouslySetInnerHTML={{ __html: body }} />

      {/* Persistent port labels visible on diagram */}
      {!hideLabels &&
        shape.ports &&
        shape.ports.map((port) => {
          if (!port.visibleOnDiagram) return null;

          const px = port.x * shape.width;
          const py = port.y * shape.height;

          let textAnchor: 'start' | 'middle' | 'end' | 'inherit' = 'middle';
          let dy = -6;
          let dx = 0;

          if (port.x < 0.1) {
            textAnchor = 'start';
            dx = 6;
            dy = 3;
          } else if (port.x > 0.9) {
            textAnchor = 'end';
            dx = -6;
            dy = 3;
          } else if (port.y < 0.1) {
            dy = 12;
          }

          // Subnet-based / VLAN-based color zoning
          let portColor: string | undefined = undefined;
          if (port.vlan) {
            portColor = getHashColor(`vlan-${port.vlan}`);
          } else if (port.ipAddress && subnets) {
            const cleaned = cleanIp(port.ipAddress);
            const containingSubnet = subnets.find((s) => checkIpInSubnet(cleaned, s.prefix));
            if (containingSubnet) {
              portColor = getHashColor(`subnet-${containingSubnet.prefix}`);
            }
          }

          return (
            <g key={`lbl-${port.id}`} pointerEvents="none">
              <rect
                x={px + dx - port.label.length * 3 - 2}
                y={py + dy - 9}
                width={port.label.length * 6 + 4}
                height={11}
                fill="#ffffff"
                fillOpacity={0.95}
                stroke={portColor || '#e2e8f0'}
                strokeWidth={portColor ? 1.2 : 0.5}
                rx={1.5}
              />
              <text
                x={px + dx}
                y={py + dy}
                textAnchor={textAnchor}
                fontSize={8}
                fontFamily="monospace"
                fontWeight="bold"
                fill={portColor || '#334155'}
              >
                {port.label}
              </text>
            </g>
          );
        })}
      {shape.text &&
        shape.type !== 'text' &&
        shape.type !== 'group' &&
        !hideLabels &&
        !isEditingText && (
          <text
            x={shape.width / 2}
            y={shape.height + 14}
            textAnchor="middle"
            fontSize={Math.max(10, (shape.style.fontSize ?? 12) - 2)}
            fontFamily={shape.style.fontFamily ?? 'system-ui, sans-serif'}
            fill="#475569"
          >
            {shape.text}
          </text>
        )}

      {selected && !isEditingText && (
        <g pointerEvents="none">
          <rect
            x={-1}
            y={-1}
            width={shape.width + 2}
            height={shape.height + 2}
            fill="none"
            stroke="#2563eb"
            strokeWidth={1}
          />
        </g>
      )}

      {showAnchors && !isEditingText && (
        <g>
          {getAllAnchors(shape, plugin).map((a) => {
            const isPort = a.isPort;
            const isConnected =
              isPort &&
              connectors.some(
                (c) =>
                  (c.sourceId === shape.id && c.sourceAnchor === a.id) ||
                  (c.targetId === shape.id && c.targetAnchor === a.id)
              );

            const r = isPort ? 5 : 4;
            const fill = isPort ? (isConnected ? '#10b981' : '#ffffff') : '#ffffff';
            const stroke = isPort ? '#10b981' : '#2563eb';
            const sw = isPort ? 2 : 1.5;

            return (
              <g key={a.id}>
                {isPort ? (
                  <rect
                    x={a.x - r}
                    y={a.y - r}
                    width={r * 2}
                    height={r * 2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                    style={{ cursor: 'crosshair' }}
                    onPointerDown={(e) => onAnchorPointerDown(a.id, e)}
                    onPointerMove={(e) => onAnchorPointerMove(a.id, e)}
                    onPointerUp={(e) => onAnchorPointerUp(a.id, e)}
                    onMouseEnter={() => setHoveredAnchorId(a.id)}
                    onMouseLeave={() => setHoveredAnchorId(null)}
                  />
                ) : (
                  <circle
                    cx={a.x}
                    cy={a.y}
                    r={r}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                    style={{ cursor: 'crosshair' }}
                    onPointerDown={(e) => onAnchorPointerDown(a.id, e)}
                    onPointerMove={(e) => onAnchorPointerMove(a.id, e)}
                    onPointerUp={(e) => onAnchorPointerUp(a.id, e)}
                  />
                )}
                {isPort && hoveredAnchorId === a.id && a.portLabel && (
                  <g pointerEvents="none">
                    <rect
                      x={a.x - a.portLabel.length * 3.5 - 3}
                      y={a.y - 22}
                      width={a.portLabel.length * 7 + 6}
                      height={14}
                      fill="#1e293b"
                      rx={2}
                    />
                    <text
                      x={a.x}
                      y={a.y - 12}
                      textAnchor="middle"
                      fontSize={9}
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      {a.portLabel}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      )}

      {selected && !shape.locked && !isEditingText && (
        <g>
          {RESIZE_HANDLES.map((h) => {
            const { x, y, cursor } = handleOffset(h.id, shape.width, shape.height);
            return (
              <rect
                key={h.id}
                x={x - HANDLE / 2}
                y={y - HANDLE / 2}
                width={HANDLE}
                height={HANDLE}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth={1.5}
                style={{ cursor }}
                onPointerDown={(e) => onHandlePointerDown(h.id, e)}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
              />
            );
          })}
          {/* Rotation handle — a more prominent visual */}
          <line
            x1={shape.width / 2}
            y1={-2}
            x2={shape.width / 2}
            y2={-22}
            stroke="#2563eb"
            strokeWidth={1}
            pointerEvents="none"
          />
          <circle
            cx={shape.width / 2}
            cy={-26}
            r={7}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={1.5}
            style={{ cursor: 'crosshair' }}
            onPointerDown={onRotatePointerDown}
            onPointerMove={onRotatePointerMove}
            onPointerUp={onRotatePointerUp}
          />
        </g>
      )}
    </g>
  );
}

const HANDLE = 8;
const RESIZE_HANDLES: { id: ResizeHandle }[] = [
  { id: 'nw' },
  { id: 'n' },
  { id: 'ne' },
  { id: 'e' },
  { id: 'se' },
  { id: 's' },
  { id: 'sw' },
  { id: 'w' },
];

function handleOffset(
  id: ResizeHandle,
  w: number,
  h: number
): { x: number; y: number; cursor: string } {
  switch (id) {
    case 'nw':
      return { x: 0, y: 0, cursor: 'nwse-resize' };
    case 'n':
      return { x: w / 2, y: 0, cursor: 'ns-resize' };
    case 'ne':
      return { x: w, y: 0, cursor: 'nesw-resize' };
    case 'e':
      return { x: w, y: h / 2, cursor: 'ew-resize' };
    case 'se':
      return { x: w, y: h, cursor: 'nwse-resize' };
    case 's':
      return { x: w / 2, y: h, cursor: 'ns-resize' };
    case 'sw':
      return { x: 0, y: h, cursor: 'nesw-resize' };
    case 'w':
      return { x: 0, y: h / 2, cursor: 'ew-resize' };
  }
}

export const ShapeRenderer = memo(ShapeRendererImpl);
