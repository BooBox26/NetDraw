// Free-drawing helpers — convert a stream of pointer samples into a smooth
// SVG path. Two strategies are exposed:
//   * `smoothFreehand(points)` — Catmull-Rom centripetal spline, used by the
//     pencil and highlighter tools.
//   * `bezierFromSamples(points)` — coarse, mid-stroke control points for the
//     pen tool, producing quadratic Bézier segments.

export interface Pt {
  x: number;
  y: number;
}

const PRESSURE_GAIN = 1.4;

/** Catmull-Rom centripetal smoothing — produces a cubic Bézier path. */
export function smoothFreehand(points: Pt[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)} L ${(p.x + 0.1).toFixed(2)} ${(p.y + 0.1).toFixed(2)}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }
  const tension = 6;
  const get = (i: number): Pt => points[Math.max(0, Math.min(points.length - 1, i))]!;
  const d: string[] = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const cp1x = p1.x + (p2.x - p0.x) / tension;
    const cp1y = p1.y + (p2.y - p0.y) / tension;
    const cp2x = p2.x - (p3.x - p1.x) / tension;
    const cp2y = p2.y - (p3.y - p1.y) / tension;
    d.push(
      `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    );
  }
  return d.join(' ');
}

/** Build a simple quadratic-Bézier path through the samples. */
export function bezierFromSamples(points: Pt[]): string {
  if (points.length === 0) return '';
  const d: string[] = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
  for (let i = 1; i < points.length; i += 2) {
    const a = points[i];
    const b = points[Math.min(points.length - 1, i + 1)];
    if (!a) continue;
    if (!b || i + 1 >= points.length) {
      d.push(`L ${a.x.toFixed(2)} ${a.y.toFixed(2)}`);
    } else {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      d.push(`Q ${a.x.toFixed(2)} ${a.y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`);
    }
  }
  return d.join(' ');
}

/** Best-effort recognition of a small freehand doodle into a primitive shape. */
export function recognizeShape(points: Pt[]): { type: 'ellipse' | 'rectangle' | 'line' | null } {
  if (points.length < 8) return { type: null };
  const bbox = pointsBbox(points);
  const w = bbox.width;
  const h = bbox.height;
  const aspect = w / Math.max(1, h);
  // Closed shape heuristic: distance first→last small relative to bbox
  const closing = Math.hypot(
    points[0].x - points[points.length - 1].x,
    points[0].y - points[points.length - 1].y
  );
  if (closing < Math.min(w, h) * 0.3) {
    // Look for squareness vs roundness
    if (aspect > 0.7 && aspect < 1.4) {
      // square-ish: rectangle
      return { type: 'rectangle' };
    }
    return { type: 'ellipse' };
  }
  return { type: 'line' };
}

function pointsBbox(points: Pt[]): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export { PRESSURE_GAIN };
