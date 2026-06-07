// Serialization utilities — SVG/PNG/NDJ export and SVG import.
// The DOM SVG is the source of truth for export, ensuring pixel-perfect
// parity with what's on screen (modulo selection chrome).

import { useStore } from '../state/store';
import type { Diagram, Shape } from '../types/diagram';
import { getPlugin } from '../shapes/library';
import { computeConnectorPath } from '../canvas/ConnectorRenderer';
import DOMPurify from 'dompurify';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface DiagramToSvgOptions {
  scope?: 'page' | 'selection';
  background?: string; // 'transparent' or a CSS color
  padding?: number;
  watermark?: string;
  classification?: string;
  showCartouche?: boolean;
}

/** Build a stand-alone SVG string from a diagram (no editor chrome). */
export function diagramToSvgString(diagram: Diagram, opts: DiagramToSvgOptions = {}): string {
  const scope = opts.scope ?? 'page';
  const background = opts.background ?? diagram.page.background;
  const padding = opts.padding ?? 16;
  const sel = useStore.getState().ui.selection;
  const visibleShapes = diagram.shapes.filter((s) => {
    const layer = diagram.layers.find((l) => l.id === s.layerId);
    return layer?.visible !== false;
  });
  const filteredShapes =
    scope === 'selection' ? visibleShapes.filter((s) => sel.shapeIds.has(s.id)) : visibleShapes;
  const filteredShapeIds = new Set(filteredShapes.map((s) => s.id));
  const filteredConnectors = diagram.connectors.filter(
    (c) =>
      (c.sourceId && filteredShapeIds.has(c.sourceId)) ||
      (c.targetId && filteredShapeIds.has(c.targetId)) ||
      scope === 'page'
  );

  // Bounding box for the export
  let minX = 0;
  let minY = 0;
  let maxX = diagram.page.width;
  let maxY = diagram.page.height;
  if (filteredShapes.length > 0) {
    minX = Math.min(...filteredShapes.map((s) => s.x));
    minY = Math.min(...filteredShapes.map((s) => s.y));
    maxX = Math.max(...filteredShapes.map((s) => s.x + s.width));
    maxY = Math.max(...filteredShapes.map((s) => s.y + s.height));
  }
  const pad = padding;
  const width = Math.max(1, maxX - minX + pad * 2);
  const height = Math.max(1, maxY - minY + pad * 2);
  const tx = -minX + pad;
  const ty = -minY + pad;

  const layers = [...diagram.layers].sort((a, b) => a.zIndex - b.zIndex);
  const layerMarkup = layers
    .filter((l) => l.visible)
    .map((layer) => {
      const shapesMarkup = filteredShapes
        .filter((s) => (s.layerId ?? 'layer-default') === layer.id)
        .map((s) => shapeToSvg(s))
        .join('\n');
      const connsMarkup = filteredConnectors
        .filter((c) => {
          const sourceShape = filteredShapes.find((s) => s.id === c.sourceId);
          const targetShape = filteredShapes.find((s) => s.id === c.targetId);
          const sourceLayer = sourceShape
            ? diagram.layers.find((l) => l.id === sourceShape.layerId)
            : null;
          const targetLayer = targetShape
            ? diagram.layers.find((l) => l.id === targetShape.layerId)
            : null;
          return (
            sourceLayer?.id === layer.id ||
            targetLayer?.id === layer.id ||
            (!sourceShape && !targetShape)
          );
        })
        .map((c) => connectorToSvg(c, filteredShapes))
        .join('\n');
      return `<g data-layer="${escapeAttr(layer.name)}" opacity="${layer.opacity}">${shapesMarkup}\n${connsMarkup}</g>`;
    })
    .join('\n');

  const bgFill = background === 'transparent' ? 'none' : escapeAttr(background);
  const bgRect =
    background === 'transparent'
      ? ''
      : `<rect x="0" y="0" width="${width}" height="${height}" fill="${bgFill}"/>`;

  // Render Watermark
  const watermarkMarkup = opts.watermark
    ? `<text x="${width / 2}" y="${height / 2}" fill="#94a3b8" fill-opacity="0.15" font-size="72" font-family="system-ui, sans-serif" font-weight="extrabold" text-anchor="middle" transform="rotate(-30, ${width / 2}, ${height / 2})">${escapeAttr(opts.watermark)}</text>`
    : '';

  // Render Classification Header/Footer
  const classificationColor =
    opts.classification === 'public'
      ? '#10b981'
      : opts.classification === 'internal'
        ? '#3b82f6'
        : '#ef4444';
  const classificationMarkup = opts.classification
    ? `<text x="${width / 2}" y="24" fill="${classificationColor}" font-size="12" font-family="system-ui, sans-serif" font-weight="bold" letter-spacing="2" text-anchor="middle">${escapeAttr(opts.classification.toUpperCase())}</text>
       <text x="${width / 2}" y="${height - 16}" fill="${classificationColor}" font-size="12" font-family="system-ui, sans-serif" font-weight="bold" letter-spacing="2" text-anchor="middle">${escapeAttr(opts.classification.toUpperCase())}</text>`
    : '';

  // Render Cartouche Info Box
  let cartoucheMarkup = '';
  if (opts.showCartouche) {
    const boxW = 240;
    const boxH = 90;
    const bx = width - boxW - 20;
    const by = height - boxH - 20;
    cartoucheMarkup = `
      <g transform="translate(${bx}, ${by})">
        <rect width="${boxW}" height="${boxH}" fill="#ffffff" fill-opacity="0.95" stroke="#cbd5e1" stroke-width="1.5" rx="6"/>
        <line x1="0" y1="30" x2="${boxW}" y2="30" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="120" y1="30" x2="120" y2="${boxH}" stroke="#cbd5e1" stroke-width="1"/>
        <text x="12" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Project: Netdraw Topology</text>
        <text x="12" y="45" font-family="system-ui, sans-serif" font-size="9" fill="#64748b">Author</text>
        <text x="12" y="58" font-family="system-ui, sans-serif" font-size="9" font-weight="semibold" fill="#334155">Network Admin</text>
        <text x="12" y="72" font-family="system-ui, sans-serif" font-size="8" fill="#64748b">Date: ${new Date().toLocaleDateString()}</text>
        
        <text x="132" y="45" font-family="system-ui, sans-serif" font-size="9" fill="#64748b">Status</text>
        <text x="132" y="58" font-family="system-ui, sans-serif" font-size="9" font-weight="semibold" fill="#3b82f6">DRAFT / REVIEW</text>
        <text x="132" y="72" font-family="system-ui, sans-serif" font-size="8" fill="#64748b">Ver: 1.0.0</text>
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${bgRect}
  <g transform="translate(${tx} ${ty})">
    ${layerMarkup}
  </g>
  ${watermarkMarkup}
  ${classificationMarkup}
  ${cartoucheMarkup}
</svg>`;
}

function shapeToSvg(s: Shape): string {
  const plugin = getPlugin(s.type);
  const body = plugin ? plugin.renderBody(s) : '';
  return `<g transform="translate(${s.x} ${s.y}) rotate(${s.rotation} ${s.width / 2} ${s.height / 2})" data-id="${escapeAttr(s.id)}" data-type="${escapeAttr(s.type)}">${body}</g>`;
}

function connectorToSvg(
  c: ReturnType<typeof useStore.getState>['diagram']['connectors'][number],
  shapes: Shape[]
): string {
  const source = c.sourceId ? (shapes.find((s) => s.id === c.sourceId) ?? null) : null;
  const target = c.targetId ? (shapes.find((s) => s.id === c.targetId) ?? null) : null;
  const getAnchor = (sh: Shape, anchor: string | null | undefined) => {
    if (!sh) return { x: 0, y: 0 };
    const list = [
      { id: 'n', x: sh.width / 2, y: 0 },
      { id: 'e', x: sh.width, y: sh.height / 2 },
      { id: 's', x: sh.width / 2, y: sh.height },
      { id: 'w', x: 0, y: sh.height / 2 },
      { id: 'center', x: sh.width / 2, y: sh.height / 2 },
    ];
    const a = list.find((x) => x.id === anchor) ?? list[0];
    return { x: sh.x + a.x, y: sh.y + a.y };
  };
  const start = source ? getAnchor(source, c.sourceAnchor) : (c.sourcePoint ?? { x: 0, y: 0 });
  const end = target ? getAnchor(target, c.targetAnchor) : (c.targetPoint ?? { x: 0, y: 0 });
  const d = computeConnectorPath(c.type, start, end, source, target);
  return `<path d="${d}" fill="none" stroke="${escapeAttr(c.style.stroke)}" stroke-width="${c.style.strokeWidth}" ${
    c.style.strokeDasharray ? `stroke-dasharray="${c.style.strokeDasharray}"` : ''
  }/>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Trigger a download for the given content with a filename. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

export interface ExportOptions {
  scope?: 'page' | 'selection';
  filename?: string;
  /** Background: CSS color string or 'transparent'. */
  background?: string;
  /** PNG: target width in pixels (overrides the natural size). */
  width?: number;
  /** PNG: target height in pixels (overrides the natural size). */
  height?: number;
  /** PNG: legacy scale multiplier (used when width/height are not set). */
  scale?: number;
}

/** Public export entry point. */
export async function exportDiagram(
  format: 'svg' | 'png' | 'ndj',
  opts: ExportOptions = {}
): Promise<void> {
  const diagram = useStore.getState().diagram;
  const baseName = opts.filename ?? `netdraw-${Date.now()}`;

  if (format === 'svg') {
    const svg = diagramToSvgString(diagram, { scope: opts.scope, background: opts.background });
    const cleaned = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
    downloadBlob(new Blob([cleaned], { type: 'image/svg+xml' }), `${baseName}.svg`);
    return;
  }

  if (format === 'png') {
    const svg = diagramToSvgString(diagram, { scope: opts.scope, background: opts.background });
    const cleaned = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
    const blob = await rasterizeSvg(cleaned, {
      width: opts.width,
      height: opts.height,
      scale: opts.width || opts.height ? 1 : (opts.scale ?? 2),
    });
    if (!blob) throw new Error('Failed to rasterize SVG');
    downloadBlob(blob, `${baseName}.png`);
    return;
  }

  if (format === 'ndj') {
    const { compressString } = await import('./compression');
    const text = JSON.stringify(diagram);
    const blob = await compressString(text);
    downloadBlob(blob, `${baseName}.ndj`);
    return;
  }
}

export interface RasterizeOptions {
  /** Target width in pixels. If provided, height is auto-derived from aspect ratio. */
  width?: number;
  /** Target height in pixels. */
  height?: number;
  /** Legacy scale multiplier. Ignored if width/height are provided. */
  scale?: number;
}

/** Rasterize an SVG string to a PNG blob at the requested size. */
export async function rasterizeSvg(
  svgString: string,
  opts: number | RasterizeOptions = 2
): Promise<Blob | null> {
  const o: RasterizeOptions = typeof opts === 'number' ? { scale: opts } : opts;
  return new Promise<Blob | null>((resolve) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      // Extract viewBox dimensions
      const m = svgString.match(/viewBox="([\d.\s\-]+)"/);
      let vbW = img.width || 800;
      let vbH = img.height || 600;
      if (m && m[1]) {
        const parts = m[1].trim().split(/\s+/).map(Number);
        if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
          vbW = parts[2];
          vbH = parts[3];
        }
      }
      // Compute final canvas size
      let outW: number;
      let outH: number;
      if (o.width && o.height) {
        outW = Math.max(1, Math.round(o.width));
        outH = Math.max(1, Math.round(o.height));
      } else if (o.width) {
        outW = Math.max(1, Math.round(o.width));
        outH = Math.max(1, Math.round((vbH / vbW) * outW));
      } else if (o.height) {
        outH = Math.max(1, Math.round(o.height));
        outW = Math.max(1, Math.round((vbW / vbH) * outH));
      } else {
        const scale = o.scale ?? 1;
        outW = Math.max(1, Math.round(vbW * scale));
        outH = Math.max(1, Math.round(vbH * scale));
      }
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return resolve(null);
      }
      ctx.drawImage(img, 0, 0, outW, outH);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => resolve(b), 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Convenience: return a data URL for a small preview of the diagram. */
export async function previewSvg(diagram: Diagram, scale = 0.4): Promise<string | null> {
  const svg = diagramToSvgString(diagram);
  const cleaned = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
  const blob = await rasterizeSvg(cleaned, { scale });
  if (!blob) return null;
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Best-effort SVG import: parses basic shapes and adds them to the diagram. */
export function importSvgString(svg: string): { added: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid SVG');
  const sanitized = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
  const cleanDoc = parser.parseFromString(sanitized, 'image/svg+xml');

  const newShapes: Shape[] = [];
  const rects = cleanDoc.querySelectorAll('rect');
  rects.forEach((r) => {
    const x = parseFloat(r.getAttribute('x') ?? '0');
    const y = parseFloat(r.getAttribute('y') ?? '0');
    const width = parseFloat(r.getAttribute('width') ?? '0');
    const height = parseFloat(r.getAttribute('height') ?? '0');
    if (width <= 0 || height <= 0) return;
    newShapes.push({
      id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'rectangle',
      x,
      y,
      width,
      height,
      rotation: 0,
      style: {
        fill: r.getAttribute('fill') ?? '#ffffff',
        stroke: r.getAttribute('stroke') ?? '#1f2937',
        strokeWidth: parseFloat(r.getAttribute('stroke-width') ?? '1.5'),
        opacity: 1,
      },
    });
  });
  const ellipses = cleanDoc.querySelectorAll('ellipse, circle');
  ellipses.forEach((el) => {
    const cx = parseFloat(el.getAttribute('cx') ?? '0');
    const cy = parseFloat(el.getAttribute('cy') ?? '0');
    const rx = parseFloat(el.getAttribute('rx') ?? el.getAttribute('r') ?? '0');
    const ry = parseFloat(el.getAttribute('ry') ?? el.getAttribute('r') ?? '0');
    newShapes.push({
      id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'ellipse',
      x: cx - rx,
      y: cy - ry,
      width: rx * 2,
      height: ry * 2,
      rotation: 0,
      style: {
        fill: el.getAttribute('fill') ?? '#ffffff',
        stroke: el.getAttribute('stroke') ?? '#1f2937',
        strokeWidth: parseFloat(el.getAttribute('stroke-width') ?? '1.5'),
        opacity: 1,
      },
    });
  });
  for (const s of newShapes) useStore.getState().addShape(s);
  return { added: newShapes.length };
}

/** Export the diagram as a Mermaid `graph TD` string. */
export function exportMermaid(): void {
  const diagram = useStore.getState().diagram;
  const idMap = new Map<string, string>();
  let i = 0;
  for (const s of diagram.shapes) {
    idMap.set(s.id, `n${i++}`);
  }
  const lines: string[] = ['graph TD'];
  for (const s of diagram.shapes) {
    const label = (s.text ?? s.name ?? s.type).replace(/"/g, "'");
    lines.push(`  ${idMap.get(s.id)}["${label}"]`);
  }
  for (const c of diagram.connectors) {
    if (!c.sourceId || !c.targetId) continue;
    const a = idMap.get(c.sourceId);
    const b = idMap.get(c.targetId);
    if (!a || !b) continue;
    const arrow = c.arrows === 'both' ? '<-->' : c.arrows === 'backward' ? '<--' : '-->';
    const lbl = c.label ? `|${c.label.replace(/"/g, "'")}|` : '';
    lines.push(`  ${a} ${arrow}${lbl} ${b}`);
  }
  const text = lines.join('\n');
  downloadBlob(new Blob([text], { type: 'text/plain' }), `netdraw-${Date.now()}.mmd`);
}

/** Export a CSV inventory of shapes and connectors — for IaC / documentation. */
export function exportInventoryCsv(): void {
  const diagram = useStore.getState().diagram;
  const rows: string[] = ['kind,id,type,name,text,x,y,width,height,rotation,fill,stroke,layer'];
  for (const s of diagram.shapes) {
    rows.push(
      [
        'shape',
        s.id,
        s.type,
        csv(s.name),
        csv(s.text),
        s.x,
        s.y,
        s.width,
        s.height,
        s.rotation,
        s.style.fill,
        s.style.stroke,
        s.layerId ?? '',
      ].join(',')
    );
  }
  for (const c of diagram.connectors) {
    rows.push(
      [
        'connector',
        c.id,
        c.type,
        '',
        csv(c.label),
        '',
        '',
        '',
        '',
        '',
        c.style.stroke,
        '',
        c.sourceId ?? '',
        c.targetId ?? '',
      ]
        .filter(Boolean)
        .join(',')
    );
  }
  downloadBlob(new Blob([rows.join('\n')], { type: 'text/csv' }), `netdraw-${Date.now()}.csv`);
}

function csv(v: string | undefined | null): string {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Export the diagram as a fully self-contained HTML page (offline-friendly). */
export function exportStandaloneHtml(): void {
  const diagram = useStore.getState().diagram;
  const svg = diagramToSvgString(diagram);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>NetDraw export</title>
<style>html,body{margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif}
.frame{padding:24px}
svg{background:#fff;border:1px solid #cbd5e1;border-radius:8px;max-width:100%;height:auto;display:block;box-shadow:0 1px 3px rgba(0,0,0,.08)}</style>
</head><body><div class="frame">${svg}</div></body></html>`;
  downloadBlob(new Blob([html], { type: 'text/html' }), `netdraw-${Date.now()}.html`);
}

/** Export the diagram as a JSON Schema — for Infrastructure-as-Code tools. */
export function exportJsonSchema(): void {
  const diagram = useStore.getState().diagram;
  const nodes = diagram.shapes.map((s) => {
    const meta = (s.data?.metadata ?? {}) as Record<string, unknown>;
    return {
      id: s.id,
      type: s.type,
      name: s.name ?? null,
      position: { x: s.x, y: s.y },
      size: { width: s.width, height: s.height },
      rotation: s.rotation,
      style: s.style,
      metadata: meta,
    };
  });
  const links = diagram.connectors.map((c) => ({
    id: c.id,
    from: c.sourceId,
    to: c.targetId,
    label: c.label ?? null,
    type: c.type,
    arrows: c.arrows,
  }));
  const out = { schemaVersion: 1, generatedAt: new Date().toISOString(), nodes, links };
  downloadBlob(
    new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }),
    `netdraw-${Date.now()}.schema.json`
  );
}

/** Export as a print-ready PDF via the browser's print-to-PDF mechanism. */
export function exportPdf(): void {
  const diagram = useStore.getState().diagram;
  const page = diagram.page;
  const isPrintable = page.pageMode === 'printable';
  const sizeAttr = isPrintable
    ? `${page.pageSize || 'A4'} ${page.pageOrientation || 'landscape'}`
    : 'auto';

  const svg = diagramToSvgString(diagram, { background: '#ffffff' });
  const cleaned = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>NetDraw PDF</title>
  <style>
    @page {
      size: ${sizeAttr};
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: white;
      overflow: hidden;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100vw;
      max-height: 100vh;
    }
  </style>
</head>
<body>
  ${cleaned}
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
