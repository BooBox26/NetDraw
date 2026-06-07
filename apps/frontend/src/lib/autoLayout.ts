// Auto-arrange using a deterministic hierarchical layout algorithm.
// Pure TypeScript so we don't add a heavy dependency. Treats connectors as
// directed edges and lays the graph top-down by BFS level.

import { useStore } from '../state/store';
import type { Shape, Connector, Point } from '../types/diagram';

const COL_GAP = 40;
const ROW_GAP = 60;
const NODE_DEFAULT_W = 140;
const NODE_DEFAULT_H = 60;

/** Compute the longest-path rank (Kahn's algorithm with depth) for each node. */
function computeRanks(shapes: Shape[], connectors: Connector[]): Map<string, number> {
  const ids = new Set(shapes.map((s) => s.id));
  const indeg = new Map<string, number>(shapes.map((s) => [s.id, 0]));
  const adj = new Map<string, string[]>(shapes.map((s) => [s.id, []]));
  for (const c of connectors) {
    if (!c.sourceId || !c.targetId) continue;
    if (!ids.has(c.sourceId) || !ids.has(c.targetId)) continue;
    adj.get(c.sourceId)!.push(c.targetId);
    indeg.set(c.targetId, (indeg.get(c.targetId) ?? 0) + 1);
  }
  const rank = new Map<string, number>(shapes.map((s) => [s.id, 0]));
  const queue: string[] = shapes.filter((s) => (indeg.get(s.id) ?? 0) === 0).map((s) => s.id);
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++]!;
    for (const v of adj.get(u) ?? []) {
      const newRank = Math.max(rank.get(v) ?? 0, (rank.get(u) ?? 0) + 1);
      rank.set(v, newRank);
      indeg.set(v, (indeg.get(v) ?? 0) - 1);
      if ((indeg.get(v) ?? 0) === 0) queue.push(v);
    }
  }
  return rank;
}

/** Group nodes by rank, then sort each row to minimize crossings (barycenter). */
function sweep(shapes: Shape[], connectors: Connector[]): Map<string, Point> {
  const ranks = computeRanks(shapes, connectors);
  const byId = new Map(shapes.map((s) => [s.id, s] as const));
  const rows: Record<number, string[]> = {};
  for (const [id, r] of ranks) {
    if (!rows[r]) rows[r] = [];
    rows[r].push(id);
  }
  // Build incoming neighbor map
  const incoming = new Map<string, string[]>();
  for (const c of connectors) {
    if (!c.sourceId || !c.targetId) continue;
    if (!incoming.has(c.targetId)) incoming.set(c.targetId, []);
    incoming.get(c.targetId)!.push(c.sourceId);
  }
  // Barycenter sort iterations
  for (let iter = 0; iter < 8; iter++) {
    const maxRank = Math.max(0, ...Object.keys(rows).map(Number));
    for (let r = 1; r <= maxRank; r++) {
      const prev = rows[r - 1] ?? [];
      const order = new Map(prev.map((id, i) => [id, i] as const));
      const row = rows[r] ?? [];
      row.sort((a, b) => {
        const ba = barycenter(a, incoming, order);
        const bb = barycenter(b, incoming, order);
        return ba - bb;
      });
    }
  }
  // Compute positions
  const out = new Map<string, Point>();
  const sortedRanks = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b);
  for (const r of sortedRanks) {
    const row = rows[r] ?? [];
    const totalH =
      row.reduce((acc, id) => acc + (byId.get(id)?.height ?? NODE_DEFAULT_H), 0) +
      (row.length - 1) * ROW_GAP;
    let y = 0;
    for (const id of row) {
      const sh = byId.get(id);
      const h = sh?.height ?? NODE_DEFAULT_H;
      out.set(id, { x: 0, y: y - totalH / 2 });
      y += h + ROW_GAP;
    }
  }
  // Center each row horizontally
  for (const r of sortedRanks) {
    const row = rows[r] ?? [];
    const totalW =
      row.reduce((acc, id) => acc + (byId.get(id)?.width ?? NODE_DEFAULT_W), 0) +
      (row.length - 1) * COL_GAP;
    let x = 0;
    for (const id of row) {
      const sh = byId.get(id);
      const w = sh?.width ?? NODE_DEFAULT_W;
      const p = out.get(id)!;
      out.set(id, { x: x - totalW / 2, y: p.y });
      x += w + COL_GAP;
    }
  }
  // Add per-rank horizontal offset
  for (const r of sortedRanks) {
    const row = rows[r] ?? [];
    const maxW = Math.max(...row.map((id) => byId.get(id)?.width ?? NODE_DEFAULT_W));
    for (const id of row) {
      const p = out.get(id)!;
      out.set(id, { x: p.x + r * (maxW + COL_GAP * 2), y: p.y + r * 80 });
    }
  }
  return out;
}

function barycenter(
  id: string,
  incoming: Map<string, string[]>,
  order: Map<string, number>
): number {
  const inList = incoming.get(id) ?? [];
  if (inList.length === 0) return order.size / 2;
  let sum = 0;
  for (const n of inList) sum += order.get(n) ?? 0;
  return sum / inList.length;
}

/** Run auto-arrange and apply the resulting positions to the diagram. */
export function autoArrange(): void {
  const state = useStore.getState();
  const shapes = state.diagram.shapes;
  const connectors = state.diagram.connectors;
  if (shapes.length < 2) return;
  const positions = sweep(shapes, connectors);
  const bboxBefore = bboxOf(shapes);
  state.setDiagram(
    {
      ...state.diagram,
      shapes: shapes.map((s) => {
        const p = positions.get(s.id);
        return p ? { ...s, x: p.x + bboxBefore.x, y: p.y + bboxBefore.y } : s;
      }),
    },
    { record: true }
  );
  state.pushToast({ kind: 'success', message: 'Layout applied' });
  state.fitToContent();
}

function bboxOf(shapes: Shape[]): { x: number; y: number; width: number; height: number } {
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
