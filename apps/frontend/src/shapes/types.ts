// Shape plugin system.
// Every shape type exposes: render(props), getBoundingBox() (built-in),
// getAnchorPoints(), and resize semantics.

import type { Point, Shape, ShapePort, ShapeStyle } from '../types/diagram';

export interface ShapeRenderProps {
  shape: Shape;
  selected: boolean;
  hovered: boolean;
  isConnecting: boolean;
  onPointerDown?: (e: React.PointerEvent<SVGElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<SVGElement>) => void;
}

export interface AnchorPoint {
  /** id (e.g. 'n', 's', 'e', 'w', 'center', or a port id like 'gi0-1') */
  id: string;
  /** world position relative to the shape (untransformed) */
  x: number;
  y: number;
  /** When true, this anchor represents a named network port */
  isPort?: boolean;
  /** Port display label (only set for port-based anchors) */
  portLabel?: string;
}

/**
 * A single colorable vector inside a shape. Allows each sub-element (body,
 * accent, screen, LED) to be recolored independently. The plugin's `renderBody`
 * reads the slot's color via `s.style.theme?.[slot.id]` (with a default fallback).
 */
export interface ColorSlot {
  /** Identifier used in the shape's `style.theme` map. */
  id: string;
  /** Human-readable label shown in the properties panel. */
  label: string;
  /** Default color for the slot when no override is set. */
  default: string;
  /** Which SVG attribute this color applies to. */
  target: 'fill' | 'stroke';
  /** Group label for the properties panel UI. */
  group?: string;
}

export interface ShapePlugin {
  type: string;
  category: 'basic' | 'network' | 'topology' | 'custom' | 'monochrome';
  label: string;
  /** Default style preset for new shapes. */
  defaultStyle: Partial<ShapeStyle>;
  /** Default size when dropped from the library. */
  defaultSize: { width: number; height: number };
  /** Vector graphic used in the library preview. Should be 24x24 viewBox. */
  preview: (color?: string) => string; // returns <svg> body
  /** Render the shape's main geometry (without transform wrapper). */
  renderBody: (shape: Shape) => string; // returns SVG inner content
  /** Optional color slots for per-vector theming. */
  colorSlots?: ColorSlot[];
  /** Default color slot values for new shapes. */
  defaultTheme?: Record<string, string>;
  /** Compute the shape's anchor points (default: 4 cardinal + center). */
  getAnchors?: (shape: Shape) => AnchorPoint[];
  /** Optional: validate / migrate shape data on creation or paste. */
  normalize?: (shape: Shape) => Shape;
  /** Whether the body needs to receive a (transform) wrapper. Default true. */
  noTransform?: boolean;
  /** Default ports for network shapes (e.g. router ports, switch ports). */
  getDefaultPorts?: (shape: Shape) => ShapePort[];
  /** Search keywords or tags to improve library search. */
  tags?: string[];
}

/** The 5 cardinal anchors available on every shape. */
export const DEFAULT_ANCHORS = (s: Shape): AnchorPoint[] => [
  { id: 'n', x: s.width / 2, y: 0 },
  { id: 'e', x: s.width, y: s.height / 2 },
  { id: 's', x: s.width / 2, y: s.height },
  { id: 'w', x: 0, y: s.height / 2 },
  { id: 'center', x: s.width / 2, y: s.height / 2 },
];

/**
 * Convert a shape's ports to anchor points in local coordinates.
 * Port positions are normalized (0-1), so we scale to shape dimensions.
 */
export function portsToAnchors(s: Shape): AnchorPoint[] {
  if (!s.ports || s.ports.length === 0) return [];
  return s.ports.map((p) => ({
    id: `port:${p.id}`,
    x: p.x * s.width,
    y: p.y * s.height,
    isPort: true,
    portLabel: p.label,
  }));
}

/**
 * Get all available anchor points for a shape: cardinal anchors + ports.
 * Uses the plugin's custom getAnchors if available.
 */
export function getAllAnchors(shape: Shape, plugin?: ShapePlugin | null): AnchorPoint[] {
  const base = plugin?.getAnchors?.(shape) ?? DEFAULT_ANCHORS(shape);
  const portAnchors = portsToAnchors(shape);
  return [...base, ...portAnchors];
}

/** Approximate the closest anchor of a given shape to a world point. */
export function nearestAnchor(
  shape: Shape,
  p: Point,
  plugin?: ShapePlugin | null
): AnchorPoint | null {
  const anchors = getAllAnchors(shape, plugin);
  let best: AnchorPoint | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const a of anchors) {
    const dx = a.x - p.x + shape.x;
    const dy = a.y - p.y + shape.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}
