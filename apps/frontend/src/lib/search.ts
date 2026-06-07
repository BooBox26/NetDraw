// Search index over the current diagram — full-text over shape labels, names,
// type, and custom metadata. Returns a ranked list of matches so the search
// panel can render a navigable list with the canvas auto-pan to the hit.

import { useStore } from '../state/store';
import type { Shape } from '../types/diagram';

export interface SearchHit {
  id: string;
  type: 'shape' | 'connector';
  label: string;
  snippet: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: Shape;
  score: number;
}

function score(haystack: string, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const h = haystack.toLowerCase();
  if (h.startsWith(q)) return 0;
  if (h.includes(q)) return 1;
  // Token match
  const tokens = q.split(/\s+/);
  let pos = 0;
  for (const t of tokens) {
    const idx = h.indexOf(t, pos);
    if (idx < 0) return -1;
    pos = idx + t.length;
  }
  return 2;
}

export function search(query: string, limit = 50): SearchHit[] {
  if (!query.trim()) return [];
  const state = useStore.getState();
  const hits: SearchHit[] = [];
  const q = query.toLowerCase().trim();

  for (const s of state.diagram.shapes) {
    const text = s.text ?? '';
    const name = s.name ?? '';
    const metadataStr = s.metadata
      ? Object.entries(s.metadata)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' ')
      : '';
    const haystack = [text, name, s.type, metadataStr].join(' ');

    const sc = score(haystack, query);
    if (sc < 0) continue;

    // Determine the best snippet: check text, name, type, then metadata keys/values
    let snippet = '';
    if (text.toLowerCase().includes(q)) {
      snippet = snippetFor(text, query);
    } else if (name.toLowerCase().includes(q)) {
      snippet = snippetFor(name, query);
    } else if (s.metadata) {
      const matchEntry = Object.entries(s.metadata).find(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
      );
      if (matchEntry) {
        snippet = `${matchEntry[0]}: ${snippetFor(matchEntry[1], query)}`;
      }
    }

    if (!snippet) {
      snippet = snippetFor(s.text ?? s.name ?? s.type, query);
    }

    hits.push({
      id: s.id,
      type: 'shape',
      label: text || name || s.type,
      snippet,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      shape: s,
      score: sc,
    });
  }
  for (const c of state.diagram.connectors) {
    const label = c.label ?? '';
    if (!label) continue;
    const sc = score(label, query);
    if (sc < 0) continue;
    hits.push({
      id: c.id,
      type: 'connector',
      label,
      snippet: snippetFor(label, query),
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      score: sc,
    });
  }
  hits.sort((a, b) => a.score - b.score);
  return hits.slice(0, limit);
}

function snippetFor(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text.slice(0, 60);
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 30);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return prefix + text.slice(start, end) + suffix;
}

/** Center the viewport on the given shape or connector. */
export function focusOnShape(id: string): void {
  const state = useStore.getState();
  const s = state.diagram.shapes.find((x) => x.id === id);
  const c = !s ? state.diagram.connectors.find((x) => x.id === id) : null;

  if (!s && !c) return;

  let cx = 0;
  let cy = 0;

  if (s) {
    state.selectShape(id, 'replace');
    cx = s.x + s.width / 2;
    cy = s.y + s.height / 2;
  } else if (c) {
    state.selectConnector(id, 'replace');
    const shapes = state.diagram.shapes;
    const src = c.sourceId ? shapes.find((sh) => sh.id === c.sourceId) : null;
    const tgt = c.targetId ? shapes.find((sh) => sh.id === c.targetId) : null;
    if (src && tgt) {
      cx = (src.x + src.width / 2 + tgt.x + tgt.width / 2) / 2;
      cy = (src.y + src.height / 2 + tgt.y + tgt.height / 2) / 2;
    } else if (src) {
      cx = src.x + src.width / 2;
      cy = src.y + src.height / 2;
    } else if (tgt) {
      cx = tgt.x + tgt.width / 2;
      cy = tgt.y + tgt.height / 2;
    } else if (c.sourcePoint && c.targetPoint) {
      cx = (c.sourcePoint.x + c.targetPoint.x) / 2;
      cy = (c.sourcePoint.y + c.targetPoint.y) / 2;
    }
  }

  const el = document.querySelector('[data-canvas-root]') as SVGSVGElement | null;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  useStore.setState((st) => ({
    ui: {
      ...st.ui,
      viewport: {
        x: rect.width / 2 - cx * st.ui.viewport.zoom,
        y: rect.height / 2 - cy * st.ui.viewport.zoom,
        zoom: st.ui.viewport.zoom,
      },
    },
  }));
}
