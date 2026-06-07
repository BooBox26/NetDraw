// Shared shape-text rendering. Centralizes font metrics, alignment, and
// optional markdown rendering. Shapes call `renderShapeText(s, fallback)`
// to get a complete <text> SVG element.

import type { Shape } from '../types/diagram';
import { renderInline } from '../lib/markdown';

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Render a shape's text. If the text contains markdown markers, it is
 *  rendered as multi-line tspans (or HTML foreignObject for full markdown
 *  support). Otherwise plain text is rendered.
 */
export function renderShapeText(s: Shape, fallback: string): string {
  const text = s.text ?? fallback;
  const fs = s.style.fontSize ?? 14;
  const fw = s.style.fontWeight ?? 500;
  const ff = s.style.fontFamily ?? 'system-ui, sans-serif';
  const ta = s.style.textAlign ?? 'center';
  const anchor = ta === 'center' ? 'middle' : ta === 'right' ? 'end' : 'start';
  const tx = ta === 'center' ? s.width / 2 : ta === 'right' ? s.width : 0;
  const ty = s.height / 2;
  const fill =
    s.style.textColor ||
    (s.style.stroke && s.style.stroke !== 'transparent' ? s.style.stroke : undefined) ||
    '#1f2937';
  const fst = s.style.fontStyle ?? 'normal';
  const td = s.style.textDecoration ?? 'none';
  const hasMarkdown = /[*`\[]/.test(text);
  if (!hasMarkdown) {
    return `<text x="${tx}" y="${ty}" font-family="${ff}" font-size="${fs}" font-weight="${fw}" text-anchor="${anchor}" dominant-baseline="central" fill="${fill}" opacity="${s.style.opacity}" style="font-style: ${fst}; text-decoration: ${td}">${escapeXml(text)}</text>`;
  }
  // Markdown rendering via foreignObject for full link/bold/italic support
  const linkAttr = s.link ? ` data-nd-link="${escapeXml(s.link)}"` : '';
  const lines = text.split('\n');
  return `<foreignObject x="0" y="0" width="${s.width}" height="${s.height}"${linkAttr} style="overflow:visible;pointer-events:auto">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      width:100%;height:100%;
      display:flex;align-items:center;justify-content:${ta === 'center' ? 'center' : ta === 'right' ? 'flex-end' : 'flex-start'};
      font-family:${ff};font-size:${fs}px;font-weight:${fw};
      font-style:${fst};text-decoration:${td};
      color:${fill};opacity:${s.style.opacity ?? 1};
      text-align:${ta};line-height:1.2;
    ">${lines.map((l) => `<div style=\"max-width:100%\">${renderInline(l)}</div>`).join('')}</div>
  </foreignObject>`;
}
