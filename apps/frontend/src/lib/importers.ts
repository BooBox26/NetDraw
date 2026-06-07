// Mermaid importer — supports `graph TD/LR`, `flowchart`, and a subset of
// `sequenceDiagram`. The output is a Diagram fragment that can be applied
// via setDiagram() to replace the current content (or merged).

import { useStore } from '../state/store';
import { makeId } from './id';
import { DEFAULT_STYLE, type Connector, type Shape, type ShapeType } from '../types/diagram';

interface MermaidNode {
  id: string;
  label: string;
  shape: 'rect' | 'round' | 'diamond' | 'stadium' | 'cyl' | 'cloud';
}

interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
  /** Arrow direction in Mermaid syntax. */
  arrow: 'arrow' | 'open' | 'none' | 'thick' | 'dotted';
}

function parseNodeShape(label: string): MermaidNode['shape'] {
  if (/^\[".*"\]$/.test(label) || /^\[.*\]$/.test(label)) return 'rect';
  if (/^\[".*"\]/.test(label) || /^\(.*\)$/.test(label)) return 'round';
  if (/^\{.*\}$/.test(label)) return 'diamond';
  if (/^>\s*.*\s*]$/.test(label) || /^\(\(.*\)\)$/.test(label)) return 'stadium';
  if (/^\[\(.*\)\]$/.test(label)) return 'cyl';
  if (/^\{\{.*\}\}$/.test(label)) return 'cloud';
  return 'rect';
}

function stripShapeSyntax(text: string): string {
  return text
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .replace(/^\(/, '')
    .replace(/\)$/, '')
    .replace(/^\{/, '')
    .replace(/\}$/, '')
    .replace(/^>\s*/, '')
    .replace(/^<\s*/, '')
    .replace(/^>/, '')
    .replace(/^<\s*$/, '')
    .replace(/^>\s*$/, '')
    .replace(/^<\s+|>+\s*$/, '')
    .replace(/^>/, '')
    .trim();
}

function parseMermaid(source: string): { nodes: MermaidNode[]; edges: MermaidEdge[] } {
  const lines = source
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));
  const nodes = new Map<string, MermaidNode>();
  const edges: MermaidEdge[] = [];

  for (const raw of lines) {
    const header = /^(graph|flowchart)\s+(TD|TB|BT|RL|LR)/i;
    if (header.test(raw)) continue;
    // Split on arrows
    const arrowRegex = /(-->|=+=+>|--[ox]|-.->|~~~)/;
    const parts = raw.split(arrowRegex);
    if (parts.length < 3) continue;
    const fromText = parts[0].trim();
    let rest = parts.slice(2).join('').trim();
    let label: string | undefined;
    // Edge label
    const labelMatch = /^\s*\|([^|]+)\|\s*(.*)$/.exec(rest);
    if (labelMatch) {
      label = labelMatch[1].trim();
      rest = labelMatch[2].trim();
    }
    // The 'to' node may have the rest; if there's another arrow, split again.
    const toText = rest;
    const fromId = sanitizeId(fromText);
    const toId = sanitizeId(toText);
    if (!fromId || !toId) continue;
    if (!nodes.has(fromId)) {
      const shape = parseNodeShape(fromText);
      nodes.set(fromId, { id: fromId, label: cleanLabel(fromText), shape });
    }
    if (!nodes.has(toId)) {
      const shape = parseNodeShape(toText);
      nodes.set(toId, { id: toId, label: cleanLabel(toText), shape });
    }
    edges.push({ from: fromId, to: toId, label, arrow: 'arrow' });
  }
  return { nodes: [...nodes.values()], edges };
}

function cleanLabel(text: string): string {
  // Extract text inside the shape markers
  const m = /[\["'{<]([^"'\]{}<>]+)["'\]{}<>]?$/.exec(text);
  if (m) return m[1].trim();
  return stripShapeSyntax(text);
}

function sanitizeId(text: string): string {
  // Pull the leading bareword if present
  const m = /^([A-Za-z0-9_]+)/.exec(text.trim());
  if (m) return m[1];
  // Fallback: hash the whole token
  return 'n_' + Math.abs(hashCode(text.trim())).toString(36);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

const SHAPE_SIZE: Record<MermaidNode['shape'], { w: number; h: number }> = {
  rect: { w: 140, h: 60 },
  round: { w: 140, h: 60 },
  diamond: { w: 160, h: 80 },
  stadium: { w: 160, h: 60 },
  cyl: { w: 140, h: 80 },
  cloud: { w: 160, h: 100 },
};

const SHAPE_TO_TYPE: Record<MermaidNode['shape'], ShapeType> = {
  rect: 'rectangle',
  round: 'rectangle',
  diamond: 'diamond',
  stadium: 'rectangle',
  cyl: 'rectangle',
  cloud: 'cloud',
};

export function importMermaid(
  source: string,
  options: { replace?: boolean } = {}
): { nodes: number; edges: number } {
  const { nodes, edges } = parseMermaid(source);
  if (nodes.length === 0) throw new Error('No nodes found in Mermaid source');

  // Lay out in a simple grid for now; auto-arrange can be triggered afterwards.
  const COLS = Math.ceil(Math.sqrt(nodes.length));
  const cell = 200;
  const shapes: Shape[] = nodes.map((n, i) => {
    const sz = SHAPE_SIZE[n.shape];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const t = SHAPE_TO_TYPE[n.shape];
    return {
      id: `imported-${makeId('shape')}`,
      type: t,
      x: 80 + col * cell,
      y: 80 + row * cell,
      width: sz.w,
      height: sz.h,
      rotation: 0,
      style: { ...DEFAULT_STYLE },
      text: n.label,
    };
  });
  const idByMermaidId = new Map<string, string>();
  nodes.forEach((m, i) => idByMermaidId.set(m.id, shapes[i].id));
  const connectors: Connector[] = edges
    .map((e): Connector | null => {
      const s = idByMermaidId.get(e.from);
      const t = idByMermaidId.get(e.to);
      if (!s || !t) return null;
      return {
        id: `imported-${makeId('conn')}`,
        type: 'straight',
        sourceId: s,
        targetId: t,
        style: { ...DEFAULT_STYLE, stroke: '#475569', strokeWidth: 1.5 },
        label: e.label,
        arrows: 'forward',
      };
    })
    .filter((c): c is Connector => c !== null);

  if (options.replace) {
    useStore.getState().setDiagram(
      {
        ...useStore.getState().diagram,
        shapes,
        connectors,
      },
      { record: true }
    );
  } else {
    for (const s of shapes) useStore.getState().addShape(s);
    for (const c of connectors) useStore.getState().addConnector(c);
  }
  useStore.getState().fitToContent();
  return { nodes: shapes.length, edges: connectors.length };
}

/** Best-effort draw.io / mxGraph XML import. */
export function importDrawio(
  xml: string,
  options: { replace?: boolean } = {}
): { nodes: number; edges: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid draw.io XML');
  const cells = doc.querySelectorAll('mxCell');
  const shapes: Shape[] = [];
  const connectors: Connector[] = [];
  const idMap = new Map<string, string>();
  for (const cell of Array.from(cells)) {
    const id = cell.getAttribute('id') ?? '';
    const value = cell.getAttribute('value') ?? '';
    const source = cell.getAttribute('source');
    const target = cell.getAttribute('target');
    const x = parseFloat(cell.getAttribute('x') ?? '0');
    const y = parseFloat(cell.getAttribute('y') ?? '0');
    const w = parseFloat(cell.getAttribute('width') ?? '120');
    const h = parseFloat(cell.getAttribute('height') ?? '60');
    if (source || target) {
      connectors.push({
        id: makeId('conn'),
        type: 'orthogonal',
        sourceId: null,
        targetId: null,
        style: { ...DEFAULT_STYLE, stroke: '#475569', strokeWidth: 1.5 },
        label: value || undefined,
        arrows: 'forward',
      });
      idMap.set(id, connectors[connectors.length - 1].id);
    } else {
      shapes.push({
        id: makeId('shape'),
        type: 'rectangle',
        x,
        y,
        width: w || 120,
        height: h || 60,
        rotation: 0,
        style: { ...DEFAULT_STYLE },
        text: value || undefined,
      });
      idMap.set(id, shapes[shapes.length - 1].id);
    }
  }
  // Resolve connector endpoint IDs
  for (let i = 0; i < connectors.length; i++) {
    const cell = Array.from(cells).filter(
      (c) => c.getAttribute('source') || c.getAttribute('target')
    )[i];
    if (!cell) continue;
    const s = cell.getAttribute('source');
    const t = cell.getAttribute('target');
    const c = connectors[i];
    if (s && idMap.has(s)) (c as { sourceId: string | null }).sourceId = idMap.get(s)!;
    if (t && idMap.has(t)) (c as { targetId: string | null }).targetId = idMap.get(t)!;
  }
  if (options.replace) {
    useStore
      .getState()
      .setDiagram({ ...useStore.getState().diagram, shapes, connectors }, { record: true });
  } else {
    for (const s of shapes) useStore.getState().addShape(s);
    for (const c of connectors) useStore.getState().addConnector(c);
  }
  useStore.getState().fitToContent();
  return { nodes: shapes.length, edges: connectors.length };
}

export function applyMermaidPrompt(): void {
  // Convenience entry used by the command palette — opens a small dialog.
  const src = window.prompt('Paste your Mermaid graph (graph TD ...):');
  if (!src) return;
  try {
    const r = importMermaid(src, { replace: false });
    useStore
      .getState()
      .pushToast({ kind: 'success', message: `Imported ${r.nodes} nodes / ${r.edges} edges` });
  } catch (e) {
    useStore.getState().pushToast({ kind: 'error', message: (e as Error).message });
  }
}

export function applyDrawioPrompt(): void {
  const src = window.prompt('Paste your draw.io / mxGraph XML:');
  if (!src) return;
  try {
    const r = importDrawio(src, { replace: false });
    useStore
      .getState()
      .pushToast({ kind: 'success', message: `Imported ${r.nodes} nodes / ${r.edges} edges` });
  } catch (e) {
    useStore.getState().pushToast({ kind: 'error', message: (e as Error).message });
  }
}

/** Best-effort Visio VDX XML stencil import. */
export function importVisioVdx(
  xmlText: string,
  options: { replace?: boolean } = {}
): { nodes: number; edges: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid VDX XML format');
  }

  const shapeNodes = doc.getElementsByTagName('Shape');
  const shapes: Shape[] = [];
  const idMap = new Map<string, string>();
  const ppi = 96;

  for (let i = 0; i < shapeNodes.length; i++) {
    const node = shapeNodes[i];
    if (node.parentElement?.closest('Shape')) continue;

    const visioId = node.getAttribute('ID') ?? `visio-${i}`;
    const name = node.getAttribute('NameU') ?? node.getAttribute('Name') ?? `Shape ${i}`;

    const pinXNode = node.querySelector('XForm > PinX');
    const pinYNode = node.querySelector('XForm > PinY');
    const widthNode = node.querySelector('XForm > Width');
    const heightNode = node.querySelector('XForm > Height');

    const x = pinXNode ? parseFloat(pinXNode.textContent ?? '0') * ppi : 100 + i * 20;
    const y = pinYNode ? parseFloat(pinYNode.textContent ?? '0') * ppi : 100 + i * 20;
    const w = widthNode ? parseFloat(widthNode.textContent ?? '1') * ppi : 100;
    const h = heightNode ? parseFloat(heightNode.textContent ?? '1') * ppi : 80;

    const textNode = node.querySelector('Text');
    const text = textNode ? (textNode.textContent?.trim() ?? '') : '';

    const metadata: Record<string, string> = {};
    const propNodes = node.getElementsByTagName('Prop');
    for (let j = 0; j < propNodes.length; j++) {
      const propNode = propNodes[j];
      const propName =
        propNode.getAttribute('NameU') ?? propNode.getAttribute('Label') ?? `Prop_${j}`;
      const valNode = propNode.querySelector('Value');
      if (valNode) {
        metadata[propName] = valNode.textContent?.trim() ?? '';
      }
    }

    const newId = `visio-imported-${visioId}-${Math.random().toString(36).slice(2, 6)}`;
    idMap.set(visioId, newId);

    let type = 'rectangle';
    const nameLower = name.toLowerCase();
    if (nameLower.includes('router')) type = 'router';
    else if (nameLower.includes('switch')) type = 'switch';
    else if (nameLower.includes('firewall')) type = 'firewall';
    else if (nameLower.includes('server')) type = 'server';
    else if (nameLower.includes('cloud')) type = 'cloud';

    shapes.push({
      id: newId,
      type,
      x,
      y: 1000 - y, // Invert Y coordinate
      width: w,
      height: h,
      rotation: 0,
      style: {
        fill: '#f8fafc',
        stroke: '#1e293b',
        strokeWidth: 1.5,
        opacity: 1,
      },
      text: text || undefined,
      name,
      metadata,
    });
  }

  const connectNodes = doc.getElementsByTagName('Connect');
  const connectors: Connector[] = [];
  const connMap = new Map<string, { sourceId?: string; targetId?: string }>();

  for (let i = 0; i < connectNodes.length; i++) {
    const connNode = connectNodes[i];
    const fromSheet = connNode.getAttribute('FromSheet');
    const toSheet = connNode.getAttribute('ToSheet');
    const fromCell = connNode.getAttribute('FromCell');

    if (fromSheet && toSheet) {
      const record = connMap.get(fromSheet) ?? {};
      if (fromCell === 'BeginX') {
        record.sourceId = idMap.get(toSheet);
      } else if (fromCell === 'EndX') {
        record.targetId = idMap.get(toSheet);
      }
      connMap.set(fromSheet, record);
    }
  }

  let connIdx = 0;
  for (const [connSheetId, endpoints] of connMap.entries()) {
    if (endpoints.sourceId || endpoints.targetId) {
      connectors.push({
        id: `visio-conn-${connSheetId}-${connIdx++}`,
        type: 'orthogonal',
        sourceId: endpoints.sourceId ?? null,
        targetId: endpoints.targetId ?? null,
        style: {
          fill: 'transparent',
          stroke: '#475569',
          strokeWidth: 1.5,
          opacity: 1,
        },
        arrows: 'forward',
      });
    }
  }

  if (options.replace) {
    useStore.getState().setDiagram(
      {
        ...useStore.getState().diagram,
        shapes,
        connectors,
      },
      { record: true }
    );
  } else {
    for (const s of shapes) useStore.getState().addShape(s);
    for (const c of connectors) useStore.getState().addConnector(c);
  }
  useStore.getState().fitToContent();
  return { nodes: shapes.length, edges: connectors.length };
}

export function applyVisioPrompt(): void {
  const src = window.prompt('Paste your Visio VDX XML code:');
  if (!src) return;
  try {
    const r = importVisioVdx(src, { replace: false });
    useStore.getState().pushToast({
      kind: 'success',
      message: `Imported ${r.nodes} nodes / ${r.edges} edges from Visio VDX`,
    });
  } catch (e) {
    useStore.getState().pushToast({ kind: 'error', message: (e as Error).message });
  }
}
