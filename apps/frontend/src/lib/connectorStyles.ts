import type { Point, LinkTechnology, LinkState } from '../types/diagram';

export interface TechnologyStyle {
  stroke: string;
  strokeDasharray?: string;
  strokeWidth: number;
}

export const TECHNOLOGY_PRESETS: Record<LinkTechnology, TechnologyStyle> = {
  ethernet: { stroke: '#334155', strokeWidth: 2 },
  fiber: { stroke: '#f59e0b', strokeWidth: 2.5 },
  copper: { stroke: '#78716c', strokeWidth: 2 },
  coaxial: { stroke: '#92400e', strokeWidth: 2.5 },
  radio: { stroke: '#8b5cf6', strokeDasharray: '2 6', strokeWidth: 1.5 },
  wifi: { stroke: '#8b5cf6', strokeDasharray: '2 4', strokeWidth: 1.5 },
  vpn: { stroke: '#059669', strokeDasharray: '8 4', strokeWidth: 2 },
  mpls: { stroke: '#2563eb', strokeWidth: 3 },
  'sd-wan': { stroke: '#06b6d4', strokeDasharray: '6 3 2 3', strokeWidth: 2 },
  ipsec: { stroke: '#dc2626', strokeDasharray: '4 2 1 2', strokeWidth: 2 },
  gre: { stroke: '#dc2626', strokeDasharray: '4 2 1 2', strokeWidth: 2 },
  vxlan: { stroke: '#7c3aed', strokeDasharray: '2 4', strokeWidth: 2 },
  evpn: { stroke: '#7c3aed', strokeDasharray: '2 4', strokeWidth: 2 },
  internet: { stroke: '#64748b', strokeDasharray: '10 5', strokeWidth: 2.5 },
  generic: { stroke: '#1f2937', strokeWidth: 1.5 },
};

export interface StateStyle {
  stroke?: string;
  strokeDasharray?: string;
  opacity?: number;
  markerType?: string;
}

export const STATE_STYLES: Record<LinkState, StateStyle> = {
  active: {},
  backup: { opacity: 0.6, strokeDasharray: '4 4' },
  down: { stroke: '#ef4444', markerType: 'cross' },
  planned: { stroke: '#9ca3af', strokeDasharray: '12 6' },
  deprecated: { opacity: 0.4 },
  unknown: { stroke: '#f59e0b', markerType: 'question' },
};

export function resolveTechnologyStyle(technology?: LinkTechnology, state?: LinkState) {
  const tech = technology || 'generic';
  const techStyle = TECHNOLOGY_PRESETS[tech] || TECHNOLOGY_PRESETS.generic;
  const stateStyle = state ? STATE_STYLES[state] : null;

  return {
    stroke: stateStyle?.stroke || techStyle.stroke,
    strokeWidth: techStyle.strokeWidth,
    strokeDasharray: stateStyle?.strokeDasharray || techStyle.strokeDasharray,
    opacity: stateStyle?.opacity !== undefined ? stateStyle.opacity : 1.0,
    markerType: stateStyle?.markerType,
  };
}

export function computeParallelOffset(index: number, total: number, spacing = 12): number {
  if (total <= 1) return 0;
  const center = (total - 1) / 2;
  return (index - center) * spacing;
}

/**
 * Finds intersection points between two line segments (p1-p2 and p3-p4)
 */
function lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (denominator === 0) return null; // parallel

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

  // Is intersection on both segments?
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }

  return null;
}

export function findCrossings(pathPoints: Point[], otherPaths: Point[][]): Point[] {
  const crossings: Point[] = [];
  if (pathPoints.length < 2) return crossings;

  for (let i = 0; i < pathPoints.length - 1; i++) {
    const p1 = pathPoints[i]!;
    const p2 = pathPoints[i + 1]!;

    for (const otherPath of otherPaths) {
      if (otherPath.length < 2) continue;

      for (let j = 0; j < otherPath.length - 1; j++) {
        const p3 = otherPath[j]!;
        const p4 = otherPath[j + 1]!;

        // Avoid self-crossing or adjacent segment false matches
        if (
          (Math.abs(p1.x - p3.x) < 0.1 && Math.abs(p1.y - p3.y) < 0.1) ||
          (Math.abs(p1.x - p4.x) < 0.1 && Math.abs(p1.y - p4.y) < 0.1) ||
          (Math.abs(p2.x - p3.x) < 0.1 && Math.abs(p2.y - p3.y) < 0.1) ||
          (Math.abs(p2.x - p4.x) < 0.1 && Math.abs(p2.y - p4.y) < 0.1)
        ) {
          continue;
        }

        const intersect = lineIntersection(p1, p2, p3, p4);
        if (intersect) {
          // Avoid duplicate crossings
          if (
            !crossings.some(
              (c) => Math.abs(c.x - intersect.x) < 0.1 && Math.abs(c.y - intersect.y) < 0.1
            )
          ) {
            crossings.push(intersect);
          }
        }
      }
    }
  }

  return crossings;
}
