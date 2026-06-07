import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
// JSDOM provides a Window-like object acceptable to DOMPurify's factory.
// Cast through unknown to satisfy the DOMPurify overload.
const factory = createDOMPurify as unknown as (w: typeof window) => typeof DOMPurifyStatic;
const DOMPurify = factory(window);

// Only safe SVG primitives. The list is intentionally restrictive.
const ALLOWED_TAGS = [
  'svg',
  'g',
  'defs',
  'symbol',
  'use',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'textPath',
  'title',
  'desc',
  'marker',
  'pattern',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'filter',
  'feGaussianBlur',
  'feMerge',
  'feMergeNode',
  'feOffset',
  'feColorMatrix',
  'feFlood',
  'feComposite',
];

const ALLOWED_ATTR = [
  'id',
  'class',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'width',
  'height',
  'viewBox',
  'preserveAspectRatio',
  'd',
  'points',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-miterlimit',
  'opacity',
  'transform',
  'style',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'dominant-baseline',
  'alignment-baseline',
  'letter-spacing',
  'word-spacing',
  'xmlns',
  'xmlns:xlink',
  'xlink:href',
  'href',
  'marker-start',
  'marker-mid',
  'marker-end',
  'markerUnits',
  'markerWidth',
  'markerHeight',
  'refX',
  'refY',
  'orient',
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'offset',
  'stop-color',
  'stop-opacity',
  'color',
  'clip-path',
  'mask',
  'filter',
];

// Forbid any URL-based references except inline `#fragment`.
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

export interface SanitizeOptions {
  /** When true, returns the cleaned DOM as a string. Default: true. */
  asString?: boolean;
  /** Maximum number of nodes allowed. Default: 5000. */
  maxNodes?: number;
}

declare const DOMPurifyStatic: {
  sanitize: (
    dirty: string,
    cfg: {
      USE_PROFILES: { svg: boolean; svgFilters: boolean };
      ADD_TAGS: string[];
      ADD_ATTR: string[];
      ALLOWED_URI_REGEXP: RegExp;
      FORBID_TAGS: string[];
      FORBID_ATTR: string[];
      KEEP_CONTENT: boolean;
      IN_PLACE: boolean;
      RETURN_DOM: boolean;
    }
  ) => string;
};

export function sanitizeSvg(input: string, options: SanitizeOptions = {}): string {
  const { maxNodes = 5000 } = options;

  if (typeof input !== 'string' || input.length === 0) {
    return '';
  }
  if (input.length > 2_000_000) {
    throw new Error('SVG payload too large');
  }

  // Strip DOCTYPE and XML processing instructions early.
  const cleaned = input.replace(/<!DOCTYPE[\s\S]*?>/gi, '').replace(/<\?xml[\s\S]*?\?>/g, '');

  const result = DOMPurify.sanitize(cleaned, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ALLOWED_TAGS,
    ADD_ATTR: ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: ALLOWED_URI_REGEXP,
    FORBID_TAGS: ['script', 'foreignObject'],
    FORBID_ATTR: ['onload', 'onclick', 'onmouseover', 'onerror', 'onfocus', 'onblur'],
    KEEP_CONTENT: true,
    IN_PLACE: false,
    RETURN_DOM: false,
  });

  // Best-effort node count cap to avoid pathological inputs.
  const nodeCount = (result.match(/</g) || []).length;
  if (nodeCount > maxNodes) {
    throw new Error('SVG payload exceeds node limit');
  }

  return String(result);
}
