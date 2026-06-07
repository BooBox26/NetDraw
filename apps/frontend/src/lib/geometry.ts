import type { BoundingBox, Point, Shape, Viewport } from '../types/diagram';

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function bbox(shapes: Shape[]): BoundingBox {
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

export function pointInRect(p: Point, r: BoundingBox): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

export function rectsIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Convert client (screen) coordinates to world coordinates using viewport. */
export function screenToWorld(p: Point, viewport: Viewport): Point {
  return {
    x: (p.x - viewport.x) / viewport.zoom,
    y: (p.y - viewport.y) / viewport.zoom,
  };
}

/** Convert world coordinates to client (screen) coordinates. */
export function worldToScreen(p: Point, viewport: Viewport): Point {
  return {
    x: p.x * viewport.zoom + viewport.x,
    y: p.y * viewport.zoom + viewport.y,
  };
}

export function rotatePoint(p: Point, center: Point, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function centerOf(b: BoundingBox): Point {
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

export function withOffset<T extends BoundingBox>(b: T, dx: number, dy: number): T {
  return { ...b, x: b.x + dx, y: b.y + dy };
}

export function unionBBox(a: BoundingBox, b: BoundingBox): BoundingBox {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const width = Math.max(a.x + a.width, b.x + b.width) - x;
  const height = Math.max(a.y + a.height, b.y + b.height) - y;
  return { x, y, width, height };
}
