// Smart guides: when dragging a shape, find nearby edges of OTHER shapes
// that the dragged shape's edges could align with, and return snap deltas
// + the list of guide lines to display.

import type { Point, Shape } from '../types/diagram';

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Guide {
  /** 'v' = vertical line at this X; 'h' = horizontal line at this Y. */
  orientation: 'v' | 'h';
  position: number;
  /** Range of the guide (so we can render a line that spans the visible area). */
  start: number;
  end: number;
}

export interface SnapResult {
  /** Adjustments to apply to the dragged shape. */
  dx: number;
  dy: number;
  /** Guides to display. */
  guides: Guide[];
}

interface AlignedEdges {
  /** X positions of the dragged shape's vertical edges/center. */
  draggedX: number[];
  /** Y positions of the dragged shape's horizontal edges/center. */
  draggedY: number[];
  draggedLeft: number;
  draggedRight: number;
  draggedCx: number;
  draggedTop: number;
  draggedBottom: number;
  draggedCy: number;
}

function draggedEdges(box: BBox): AlignedEdges {
  return {
    draggedX: [box.x, box.x + box.width / 2, box.x + box.width],
    draggedY: [box.y, box.y + box.height / 2, box.y + box.height],
    draggedLeft: box.x,
    draggedRight: box.x + box.width,
    draggedCx: box.x + box.width / 2,
    draggedTop: box.y,
    draggedBottom: box.y + box.height,
    draggedCy: box.y + box.height / 2,
  };
}

const SNAP_THRESHOLD = 6; // pixels in world space

/**
 * Find snap deltas and guides for a dragged shape (in world coordinates).
 * @param dragged The current bounding box of the dragged shape(s).
 * @param others Other shapes to snap to.
 * @param excludeIds Shape ids to ignore (the ones being dragged).
 */
export function computeSmartGuides(
  dragged: BBox,
  others: Shape[],
  excludeIds: Set<string>
): SnapResult {
  const e = draggedEdges(dragged);
  let bestDx = 0;
  let bestDxDist = SNAP_THRESHOLD;
  let bestDy = 0;
  let bestDyDist = SNAP_THRESHOLD;
  const guides: Guide[] = [];

  for (const other of others) {
    if (excludeIds.has(other.id)) continue;
    const ob: BBox = { x: other.x, y: other.y, width: other.width, height: other.height };
    const otherLeft = ob.x;
    const otherRight = ob.x + ob.width;
    const otherCx = ob.x + ob.width / 2;
    const otherTop = ob.y;
    const otherBottom = ob.y + ob.height;
    const otherCy = ob.y + ob.height / 2;
    const otherX = [otherLeft, otherCx, otherRight];
    const otherY = [otherTop, otherCy, otherBottom];

    // X snap: align dragged edges/center with other edges/center.
    for (let i = 0; i < e.draggedX.length; i++) {
      for (let j = 0; j < otherX.length; j++) {
        const delta = otherX[j] - e.draggedX[i];
        const dist = Math.abs(delta);
        if (dist < bestDxDist) {
          bestDxDist = dist;
          bestDx = delta;
        }
      }
    }
    // Y snap.
    for (let i = 0; i < e.draggedY.length; i++) {
      for (let j = 0; j < otherY.length; j++) {
        const delta = otherY[j] - e.draggedY[i];
        const dist = Math.abs(delta);
        if (dist < bestDyDist) {
          bestDyDist = dist;
          bestDy = delta;
        }
      }
    }
  }

  // --- Soft Snapping for Racks and Cable Trays ---
  for (const other of others) {
    if (excludeIds.has(other.id)) continue;

    if (other.type === 'rack') {
      const rackCx = other.x + other.width / 2;
      const draggedCx = dragged.x + dragged.width / 2;
      let hasRackSnapX = false;
      let rackSnapX = 0;

      // Snapping horizontally to rack center
      if (Math.abs(draggedCx - rackCx) < 40) {
        rackSnapX = rackCx - dragged.width / 2 - dragged.x;
        hasRackSnapX = true;
      }

      // Snapping vertically to rack slot (6 slots, drawn from y=12 with height=18, spacing=22)
      // slot centers in world coords: other.y + 12 + i * 22 + 9
      const slotCentersY = Array.from({ length: 6 }).map((_, i) => other.y + 12 + i * 22 + 9);
      const draggedCy = dragged.y + dragged.height / 2;
      let closestSlotY = slotCentersY[0]!;
      let minDistY = Infinity;
      for (const scY of slotCentersY) {
        const dist = Math.abs(draggedCy - scY);
        if (dist < minDistY) {
          minDistY = dist;
          closestSlotY = scY;
        }
      }

      let hasRackSnapY = false;
      let rackSnapY = 0;
      if (minDistY < 30) {
        rackSnapY = closestSlotY - dragged.height / 2 - dragged.y;
        hasRackSnapY = true;
      }

      if (hasRackSnapX || hasRackSnapY) {
        const rx = other.x;
        const ry = other.y;
        const rw = other.width;
        const rh = other.height;
        if (hasRackSnapX) {
          guides.push({
            orientation: 'v',
            position: rackCx,
            start: Math.min(dragged.y, ry),
            end: Math.max(dragged.y + dragged.height, ry + rh),
          });
        }
        if (hasRackSnapY) {
          guides.push({
            orientation: 'h',
            position: closestSlotY,
            start: Math.min(dragged.x, rx),
            end: Math.max(dragged.x + dragged.width, rx + rw),
          });
        }
        return {
          dx: hasRackSnapX ? rackSnapX : bestDx,
          dy: hasRackSnapY ? rackSnapY : bestDy,
          guides,
        };
      }
    }

    if (other.type === 'cable-tray') {
      const isHorizontal = other.width >= other.height;
      if (isHorizontal) {
        // Snap dragged shape Y center to tray Y center
        const trayCy = other.y + other.height / 2;
        const draggedCy = dragged.y + dragged.height / 2;
        if (Math.abs(draggedCy - trayCy) < 25) {
          const traySnapY = trayCy - dragged.height / 2 - dragged.y;
          guides.push({
            orientation: 'h',
            position: trayCy,
            start: Math.min(dragged.x, other.x),
            end: Math.max(dragged.x + dragged.width, other.x + other.width),
          });
          return {
            dx: bestDx,
            dy: traySnapY,
            guides,
          };
        }
      } else {
        // Snap dragged shape X center to tray X center
        const trayCx = other.x + other.width / 2;
        const draggedCx = dragged.x + dragged.width / 2;
        if (Math.abs(draggedCx - trayCx) < 25) {
          const traySnapX = trayCx - dragged.width / 2 - dragged.x;
          guides.push({
            orientation: 'v',
            position: trayCx,
            start: Math.min(dragged.y, other.y),
            end: Math.max(dragged.y + dragged.height, other.y + other.height),
          });
          return {
            dx: traySnapX,
            dy: bestDy,
            guides,
          };
        }
      }
    }
  }

  if (bestDx !== 0 || bestDy !== 0) {
    // Compute the snapped position and look up matching guides.
    const snapped: BBox = {
      x: dragged.x + bestDx,
      y: dragged.y + bestDy,
      width: dragged.width,
      height: dragged.height,
    };
    const se = draggedEdges(snapped);
    for (const other of others) {
      if (excludeIds.has(other.id)) continue;
      const ob: BBox = { x: other.x, y: other.y, width: other.width, height: other.height };
      const otherX = [ob.x, ob.x + ob.width / 2, ob.x + ob.width];
      const otherY = [ob.y, ob.y + ob.height / 2, ob.y + ob.height];
      // X guide if any vertical edges/centers coincide after snap.
      if (bestDx !== 0) {
        for (const dx of se.draggedX) {
          for (const ox of otherX) {
            if (Math.abs(dx - ox) < 0.5) {
              const y0 = Math.min(se.draggedTop, ob.y);
              const y1 = Math.max(se.draggedBottom, ob.y + ob.height);
              if (!guides.some((g) => g.orientation === 'v' && Math.abs(g.position - ox) < 0.5)) {
                guides.push({ orientation: 'v', position: ox, start: y0, end: y1 });
              }
            }
          }
        }
      }
      if (bestDy !== 0) {
        for (const dy of se.draggedY) {
          for (const oy of otherY) {
            if (Math.abs(dy - oy) < 0.5) {
              const x0 = Math.min(se.draggedLeft, ob.x);
              const x1 = Math.max(se.draggedRight, ob.x + ob.width);
              if (!guides.some((g) => g.orientation === 'h' && Math.abs(g.position - oy) < 0.5)) {
                guides.push({ orientation: 'h', position: oy, start: x0, end: x1 });
              }
            }
          }
        }
      }
    }
  }
  return { dx: bestDx, dy: bestDy, guides };
}

/**
 * Align the selected shapes according to `kind`:
 *  - 'left' | 'center-x' | 'right' : horizontal alignment to the bounding box
 *  - 'top' | 'center-y' | 'bottom' : vertical alignment
 *  - 'distribute-h' | 'distribute-v' : evenly space shapes
 */
export function alignShapes(
  shapes: Shape[],
  kind:
    | 'left'
    | 'center-x'
    | 'right'
    | 'top'
    | 'center-y'
    | 'bottom'
    | 'distribute-h'
    | 'distribute-v'
): Record<string, { x: number; y: number }> {
  if (shapes.length < 2) return {};
  const updates: Record<string, { x: number; y: number }> = {};
  const minX = Math.min(...shapes.map((s) => s.x));
  const maxX = Math.max(...shapes.map((s) => s.x + s.width));
  const minY = Math.min(...shapes.map((s) => s.y));
  const maxY = Math.max(...shapes.map((s) => s.y + s.height));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  if (kind === 'left') {
    for (const s of shapes) updates[s.id] = { x: minX, y: s.y };
  } else if (kind === 'right') {
    for (const s of shapes) updates[s.id] = { x: maxX - s.width, y: s.y };
  } else if (kind === 'center-x') {
    for (const s of shapes) updates[s.id] = { x: cx - s.width / 2, y: s.y };
  } else if (kind === 'top') {
    for (const s of shapes) updates[s.id] = { x: s.x, y: minY };
  } else if (kind === 'bottom') {
    for (const s of shapes) updates[s.id] = { x: s.x, y: maxY - s.height };
  } else if (kind === 'center-y') {
    for (const s of shapes) updates[s.id] = { x: s.x, y: cy - s.height / 2 };
  } else if (kind === 'distribute-h') {
    const sorted = [...shapes].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = last.x - (first.x + first.width);
    const totalShapesWidth = sorted.reduce((acc, s) => acc + s.width, 0);
    const gap = (totalSpan - totalShapesWidth + first.width + last.width) / (sorted.length - 1);
    let cursor = first.x;
    for (const s of sorted) {
      updates[s.id] = { x: cursor, y: s.y };
      cursor += s.width + gap;
    }
  } else if (kind === 'distribute-v') {
    const sorted = [...shapes].sort((a, b) => a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = last.y - (first.y + first.height);
    const totalShapesHeight = sorted.reduce((acc, s) => acc + s.height, 0);
    const gap = (totalSpan - totalShapesHeight + first.height + last.height) / (sorted.length - 1);
    let cursor = first.y;
    for (const s of sorted) {
      updates[s.id] = { x: s.x, y: cursor };
      cursor += s.height + gap;
    }
  }
  return updates;
}

export function bboxOfShapes(shapes: Shape[]): BBox {
  if (shapes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of shapes) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + s.width);
    maxY = Math.max(maxY, s.y + s.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function _unusedPoint(p: Point): void {
  // Anchor to keep Point type used.
  void p;
}
