// Built-in shape plugins: rectangle, ellipse, diamond, parallelogram, text, line.

import type { ShapePlugin } from './types';
import { renderShapeText } from './text';

export const rectanglePlugin: ShapePlugin = {
  type: 'rectangle',
  category: 'basic',
  label: 'Rectangle',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 80 },
  preview: (color = '#1f2937') =>
    `<rect x="3" y="5" width="18" height="14" rx="1" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) =>
    `<rect x="0" y="0" width="${s.width}" height="${s.height}" rx="2" ry="2" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`,
};

export const ellipsePlugin: ShapePlugin = {
  type: 'ellipse',
  category: 'basic',
  label: 'Ellipse',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 80 },
  preview: (color = '#1f2937') =>
    `<ellipse cx="12" cy="12" rx="9" ry="6" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) =>
    `<ellipse cx="${s.width / 2}" cy="${s.height / 2}" rx="${s.width / 2}" ry="${s.height / 2}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`,
};

export const diamondPlugin: ShapePlugin = {
  type: 'diamond',
  category: 'basic',
  label: 'Diamond',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 120, height: 100 },
  preview: (color = '#1f2937') =>
    `<polygon points="12,3 21,12 12,21 3,12" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    return `<polygon points="${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const parallelogramPlugin: ShapePlugin = {
  type: 'parallelogram',
  category: 'basic',
  label: 'Parallelogram',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 70 },
  preview: (color = '#1f2937') =>
    `<polygon points="6,5 21,5 18,19 3,19" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const o = Math.min(s.width * 0.2, 24);
    return `<polygon points="${o},0 ${s.width},0 ${s.width - o},${s.height} 0,${s.height}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const textPlugin: ShapePlugin = {
  type: 'text',
  category: 'basic',
  label: 'Text',
  defaultStyle: { fill: 'transparent', stroke: 'transparent', strokeWidth: 0 },
  defaultSize: { width: 160, height: 32 },
  preview: (color = '#1f2937') =>
    `<text x="12" y="16" font-family="sans-serif" font-size="11" text-anchor="middle" fill="${color}">T</text>`,
  renderBody: (s) => {
    return renderShapeText(s, s.text ?? 'Text');
  },
  noTransform: false,
};

export const linePlugin: ShapePlugin = {
  type: 'line',
  category: 'basic',
  label: 'Line',
  defaultStyle: { fill: 'transparent', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 160, height: 0 },
  preview: (color = '#1f2937') =>
    `<line x1="3" y1="12" x2="21" y2="12" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    if (s.height === 0) {
      return `<line x1="0" y1="0" x2="${s.width}" y2="0" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
    }
    return `<line x1="0" y1="0" x2="${s.width}" y2="${s.height}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const builtinPlugins: ShapePlugin[] = [
  rectanglePlugin,
  ellipsePlugin,
  diamondPlugin,
  parallelogramPlugin,
  textPlugin,
  linePlugin,
];
