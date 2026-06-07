import type { Connector, Point, Shape } from '../types/diagram';

export interface RoutingContext {
  shapes: Shape[];
  connectors: Connector[];
  gridSize: number;
  excludeIds: Set<string>;
}

// Helper to check if a point is inside a shape bounding box (inflated by safety margin)
function isPointInObstacle(
  p: Point,
  shapes: Shape[],
  excludeIds: Set<string>,
  margin = 10
): boolean {
  for (const s of shapes) {
    if (excludeIds.has(s.id)) continue;
    if (
      p.x >= s.x - margin &&
      p.x <= s.x + s.width + margin &&
      p.y >= s.y - margin &&
      p.y <= s.y + s.height + margin
    ) {
      return true;
    }
  }
  return false;
}

// Compute simple midpoint Manhattan fallback routing (H-V-H / V-H-V)
function computeSimpleManhattan(start: Point, end: Point): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    return [start, end];
  }
  const midX = start.x + dx / 2;
  const midY = start.y + dy / 2;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
  } else {
    return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
  }
}

// A* pathfinder for orthogonal routing
function routeOrthogonalAStar(start: Point, end: Point, ctx: RoutingContext): Point[] {
  const step = 20; // 20px coarse grid step
  const margin = 10;

  // Quick heuristic
  const heuristic = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  // Round start/end to nearest grid or keep them exact at terminals
  const startGrid = { x: Math.round(start.x / step) * step, y: Math.round(start.y / step) * step };
  const endGrid = { x: Math.round(end.x / step) * step, y: Math.round(end.y / step) * step };

  interface Node {
    x: number;
    y: number;
    g: number;
    f: number;
    parent: Node | null;
  }

  const openList: Node[] = [];
  const closedSet = new Set<string>();

  const startNode: Node = {
    x: startGrid.x,
    y: startGrid.y,
    g: 0,
    f: heuristic(startGrid, endGrid),
    parent: null,
  };
  openList.push(startNode);

  let iterations = 0;
  const maxIterations = 1500;
  const startTime = Date.now();

  while (openList.length > 0) {
    iterations++;
    if (iterations > maxIterations || Date.now() - startTime > 40) {
      break; // Timeout or iteration limit hit -> fallback
    }

    // Sort by f value
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    // Reached destination zone
    if (Math.abs(current.x - endGrid.x) < step && Math.abs(current.y - endGrid.y) < step) {
      // Reconstruct path
      const path: Point[] = [end];
      let curr: Node | null = current;
      while (curr) {
        path.unshift({ x: curr.x, y: curr.y });
        curr = curr.parent;
      }
      path.unshift(start);
      return path;
    }

    const key = `${current.x},${current.y}`;
    closedSet.add(key);

    const neighbors = [
      { x: current.x + step, y: current.y },
      { x: current.x - step, y: current.y },
      { x: current.x, y: current.y + step },
      { x: current.x, y: current.y - step },
    ];

    for (const nb of neighbors) {
      const nbKey = `${nb.x},${nb.y}`;
      if (closedSet.has(nbKey)) continue;

      // Obstacle check
      if (isPointInObstacle(nb, ctx.shapes, ctx.excludeIds, margin)) {
        continue;
      }

      const gCost = current.g + step;
      const fCost = gCost + heuristic(nb, endGrid);

      const existing = openList.find((n) => n.x === nb.x && n.y === nb.y);
      if (existing) {
        if (gCost < existing.g) {
          existing.g = gCost;
          existing.f = fCost;
          existing.parent = current;
        }
      } else {
        openList.push({ x: nb.x, y: nb.y, g: gCost, f: fCost, parent: current });
      }
    }
  }

  // Fallback to simple midpoint routing
  return computeSimpleManhattan(start, end);
}

// Simplify collinear segments in a polyline path
function simplifyCollinear(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const result: Point[] = [points[0]!];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;

    // Check if points are collinear (same horizontal or vertical line)
    const isCollinear =
      (Math.abs(prev.x - curr.x) < 0.1 && Math.abs(curr.x - next.x) < 0.1) ||
      (Math.abs(prev.y - curr.y) < 0.1 && Math.abs(curr.y - next.y) < 0.1);

    if (!isCollinear) {
      result.push(curr);
    }
  }
  result.push(points[points.length - 1]!);
  return result;
}

// Converts a list of points into an SVG path with rounded corners (using arcs)
export function pointsToSvgPathWithBends(points: Point[], radius = 6): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  if (points.length === 2)
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;

  let d = `M ${points[0]!.x} ${points[0]!.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;

    // Vectors
    const d1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const d2 = { x: next.x - curr.x, y: next.y - curr.y };

    const len1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
    const len2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);

    const r = Math.min(radius, len1 / 2, len2 / 2);

    if (r < 0.1) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    // Anchor points before and after corner
    const p1 = {
      x: curr.x - (d1.x / len1) * r,
      y: curr.y - (d1.y / len1) * r,
    };
    const p2 = {
      x: curr.x + (d2.x / len2) * r,
      y: curr.y + (d2.y / len2) * r,
    };

    // Calculate arc sweep
    const sweep = d1.x * d2.y - d1.y * d2.x > 0 ? 1 : 0;

    d += ` L ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`;
  }

  const last = points[points.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

// Performs perpendicular offset of a polyline path by `offset` pixels
export function offsetPath(pathPoints: Point[], offset: number): Point[] {
  if (offset === 0 || pathPoints.length < 2) return pathPoints;

  const result: Point[] = [];

  for (let i = 0; i < pathPoints.length; i++) {
    const curr = pathPoints[i]!;
    let dx = 0;
    let dy = 0;

    if (i === 0) {
      // First point, use next point for direction
      const next = pathPoints[1]!;
      const len = Math.sqrt((next.x - curr.x) ** 2 + (next.y - curr.y) ** 2);
      if (len > 0) {
        dx = -(next.y - curr.y) / len;
        dy = (next.x - curr.x) / len;
      }
    } else if (i === pathPoints.length - 1) {
      // Last point, use prev point for direction
      const prev = pathPoints[i - 1]!;
      const len = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      if (len > 0) {
        dx = -(curr.y - prev.y) / len;
        dy = (curr.x - prev.x) / len;
      }
    } else {
      // Intermediate point, average direction vectors
      const prev = pathPoints[i - 1]!;
      const next = pathPoints[i + 1]!;

      const len1 = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      const len2 = Math.sqrt((next.x - curr.x) ** 2 + (next.y - curr.y) ** 2);

      let dx1 = 0,
        dy1 = 0,
        dx2 = 0,
        dy2 = 0;
      if (len1 > 0) {
        dx1 = -(curr.y - prev.y) / len1;
        dy1 = (curr.x - prev.x) / len1;
      }
      if (len2 > 0) {
        dx2 = -(next.y - curr.y) / len2;
        dy2 = (next.x - curr.x) / len2;
      }

      dx = (dx1 + dx2) / 2;
      dy = (dy1 + dy2) / 2;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }
    }

    result.push({
      x: curr.x + dx * offset,
      y: curr.y + dy * offset,
    });
  }

  return result;
}

export function pathLength(points: Point[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    length += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }
  return length;
}

export function getPointAlongPath(pathPoints: Point[], t: number): Point {
  if (pathPoints.length === 0) return { x: 0, y: 0 };
  if (pathPoints.length === 1) return pathPoints[0]!;

  const totalLen = pathLength(pathPoints);
  if (totalLen === 0) return pathPoints[0]!;

  const targetLen = totalLen * Math.max(0, Math.min(1, t));
  let currentLen = 0;

  for (let i = 0; i < pathPoints.length - 1; i++) {
    const p1 = pathPoints[i]!;
    const p2 = pathPoints[i + 1]!;
    const segmentLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

    if (currentLen + segmentLen >= targetLen) {
      const segmentT = (targetLen - currentLen) / segmentLen;
      return {
        x: p1.x + segmentT * (p2.x - p1.x),
        y: p1.y + segmentT * (p2.y - p1.y),
      };
    }

    currentLen += segmentLen;
  }

  return pathPoints[pathPoints.length - 1]!;
}

// Catmull-Rom spline implementation forbezier curve routing
function getCatmullRomPath(points: Point[]): string {
  if (points.length < 2) return '';
  if (points.length === 2)
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;

  let d = `M ${points[0]!.x} ${points[0]!.y}`;

  // For Catmull-Rom we duplicate endpoints to make it start/end nicely
  const p = [points[0]!, ...points, points[points.length - 1]!];

  for (let i = 1; i < p.length - 2; i++) {
    const p0 = p[i - 1]!;
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p3 = p[i + 2]!;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }

  return d;
}

export function routeConnector(
  connector: Connector,
  start: Point,
  end: Point,
  _source: Shape | null,
  _target: Shape | null,
  ctx: RoutingContext
): string {
  const waypoints = connector.waypoints || [];
  const type = connector.type;

  if (type === 'straight' || type === 'logical') {
    const points = [start, ...waypoints, end];
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  if (type === 'bezier') {
    if (waypoints.length > 0) {
      return getCatmullRomPath([start, ...waypoints, end]);
    }
    // Cubic bezier fallback
    const dx = end.x - start.x;
    const c1 = { x: start.x + dx * 0.5, y: start.y };
    const c2 = { x: end.x - dx * 0.5, y: end.y };
    return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
  }

  if (type === 'radio') {
    // Curved arc: quadratic bezier with control point offset perpendicularly
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

    // Perpendicular vector
    const px = -dy / dist;
    const py = dx / dist;

    // Midpoint
    const mx = start.x + dx / 2;
    const my = start.y + dy / 2;

    // Control point offset by 20% of distance
    const offset = dist * 0.15;
    const cx = mx + px * offset;
    const cy = my + py * offset;

    return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
  }

  if (type === 'bus') {
    // Horizontal or vertical bus bar path
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    if (dx >= dy) {
      return `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
    } else {
      return `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
    }
  }

  if (type === 'orthogonal' || type === 'bundle') {
    // Determine the set of points segment by segment through waypoints
    let pathPoints: Point[] = [];
    const allPts = [start, ...waypoints, end];

    for (let i = 0; i < allPts.length - 1; i++) {
      const p1 = allPts[i]!;
      const p2 = allPts[i + 1]!;
      const segment = routeOrthogonalAStar(p1, p2, ctx);

      if (i === 0) {
        pathPoints = segment;
      } else {
        pathPoints = [...pathPoints, ...segment.slice(1)];
      }
    }

    pathPoints = simplifyCollinear(pathPoints);

    if (type === 'bundle') {
      const memberCount = connector.bundle?.memberCount ?? 2;
      const spacing = 6;
      let d = '';
      for (let m = 0; m < memberCount; m++) {
        const offset = (m - (memberCount - 1) / 2) * spacing;
        const offsetPoints = offsetPath(pathPoints, offset);
        d += ' ' + pointsToSvgPathWithBends(offsetPoints, 4);
      }
      return d.trim();
    }

    // Regular orthogonal (A* or Manhattan) with rounded corners
    return pointsToSvgPathWithBends(pathPoints, 6);
  }

  // Fallback
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

export function getConnectorPoints(
  connector: Connector,
  start: Point,
  end: Point,
  _source: Shape | null,
  _target: Shape | null,
  ctx: RoutingContext
): Point[] {
  const waypoints = connector.waypoints || [];
  const type = connector.type;

  if (type === 'straight' || type === 'logical' || type === 'bezier' || type === 'radio') {
    return [start, ...waypoints, end];
  }

  if (type === 'bus') {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    if (dx >= dy) {
      return [start, { x: end.x, y: start.y }, end];
    } else {
      return [start, { x: start.x, y: end.y }, end];
    }
  }

  if (type === 'orthogonal' || type === 'bundle') {
    let pathPoints: Point[] = [];
    const allPts = [start, ...waypoints, end];

    for (let i = 0; i < allPts.length - 1; i++) {
      const p1 = allPts[i]!;
      const p2 = allPts[i + 1]!;
      const segment = routeOrthogonalAStar(p1, p2, ctx);

      if (i === 0) {
        pathPoints = segment;
      } else {
        pathPoints = [...pathPoints, ...segment.slice(1)];
      }
    }

    return simplifyCollinear(pathPoints);
  }

  return [start, end];
}
