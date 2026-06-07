// Extended basic shapes — additions to the basic shape library.

import type { ShapePlugin } from './types';

export const roundedRectPlugin: ShapePlugin = {
  type: 'rounded-rect',
  category: 'basic',
  label: 'Rounded',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 80 },
  preview: (color = '#1f2937') =>
    `<rect x="3" y="5" width="18" height="14" rx="4" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const r = Math.min(12, s.width / 6, s.height / 6);
    return `<rect x="0" y="0" width="${s.width}" height="${s.height}" rx="${r}" ry="${r}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const hexagonPlugin: ShapePlugin = {
  type: 'hexagon',
  category: 'basic',
  label: 'Hexagon',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 100 },
  preview: (color = '#1f2937') =>
    `<polygon points="8,5 16,5 21,12 16,19 8,19 3,12" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const o = Math.min(20, w * 0.2);
    return `<polygon points="${o},0 ${w - o},0 ${w},${h / 2} ${w - o},${h} ${o},${h} 0,${h / 2}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const octagonPlugin: ShapePlugin = {
  type: 'octagon',
  category: 'basic',
  label: 'Octagon',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 120, height: 120 },
  preview: (color = '#1f2937') =>
    `<polygon points="8,3 16,3 21,8 21,16 16,21 8,21 3,16 3,8" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const o = Math.min(20, w * 0.25, h * 0.25);
    return `<polygon points="${o},0 ${w - o},0 ${w},${o} ${w},${h - o} ${w - o},${h} ${o},${h} 0,${h - o} 0,${o}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const cylinderPlugin: ShapePlugin = {
  type: 'cylinder',
  category: 'basic',
  label: 'Cylinder',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 100, height: 120 },
  preview: (color = '#1f2937') =>
    `<path d="M5 6 Q5 3 12 3 Q19 3 19 6 L19 18 Q19 21 12 21 Q5 21 5 18 Z" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const rx = w / 2;
    const ry = Math.min(12, h * 0.1);
    return `<path d="M 0 ${ry} A ${rx} ${ry} 0 0 1 ${w} ${ry} L ${w} ${h - ry} A ${rx} ${ry} 0 0 1 0 ${h - ry} Z" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/><ellipse cx="${w / 2}" cy="${ry}" rx="${rx}" ry="${ry}" fill="none" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const documentPlugin: ShapePlugin = {
  type: 'document',
  category: 'basic',
  label: 'Document',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 120, height: 140 },
  preview: (color = '#1f2937') =>
    `<path d="M5 3 L15 3 L19 7 L19 21 L5 21 Z" fill="none" stroke="${color}" stroke-width="1.5"/><path d="M15 3 L15 7 L19 7" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const fold = Math.min(20, w * 0.2);
    return `<path d="M 0 0 L ${w - fold} 0 L ${w} ${fold} L ${w} ${h} L 0 ${h} Z" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/><path d="M ${w - fold} 0 L ${w - fold} ${fold} L ${w} ${fold}" fill="none" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" opacity="${s.style.opacity}"/>`;
  },
};

export const calloutPlugin: ShapePlugin = {
  type: 'callout',
  category: 'basic',
  label: 'Callout',
  defaultStyle: { fill: '#fffbeb', stroke: '#b45309', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 90 },
  preview: (color = '#b45309') =>
    `<path d="M3 4 L21 4 L21 14 L13 14 L9 19 L9 14 L3 14 Z" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const tip = Math.min(20, w * 0.2);
    return `<path d="M 0 0 L ${w} 0 L ${w} ${h - 16} L ${tip + 8} ${h - 16} L ${tip} ${h} L ${tip} ${h - 16} L 0 ${h - 16} Z" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const stickyNotePlugin: ShapePlugin = {
  type: 'sticky-note',
  category: 'basic',
  label: 'Sticky',
  defaultStyle: { fill: '#fef08a', stroke: '#a16207', strokeWidth: 1 },
  defaultSize: { width: 120, height: 110 },
  preview: (color = '#a16207') =>
    `<rect x="4" y="4" width="16" height="16" fill="none" stroke="${color}" stroke-width="1.2"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    return `<rect x="0" y="0" width="${w}" height="${h}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" opacity="${s.style.opacity}"/>`;
  },
};

export const arrowRightPlugin: ShapePlugin = {
  type: 'arrow-right',
  category: 'basic',
  label: 'Arrow',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 60 },
  preview: (color = '#1f2937') =>
    `<path d="M3 12 L17 12 M14 8 L18 12 L14 16" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const tip = Math.min(24, h * 0.6);
    return `<path d="M 0 ${h / 2} L ${w - tip} 0 L ${w} ${h / 2} L ${w - tip} ${h} Z" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const starPlugin: ShapePlugin = {
  type: 'star',
  category: 'basic',
  label: 'Star',
  defaultStyle: { fill: '#fef3c7', stroke: '#b45309', strokeWidth: 1.5 },
  defaultSize: { width: 100, height: 100 },
  preview: (color = '#b45309') =>
    `<polygon points="12,2 14.6,8.6 22,9.2 16.4,14 18,21 12,17.4 6,21 7.6,14 2,9.2 9.4,8.6" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const cx = w / 2;
    const cy = h / 2;
    const outer = Math.min(w, h) * 0.45;
    const inner = outer * 0.42;
    const points: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      points.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return `<polygon points="${points.join(' ')}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const trianglePlugin: ShapePlugin = {
  type: 'triangle',
  category: 'basic',
  label: 'Triangle',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 120, height: 100 },
  preview: (color = '#1f2937') =>
    `<polygon points="12,3 21,21 3,21" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    return `<polygon points="${w / 2},0 ${w},${h} 0,${h}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const trapezoidPlugin: ShapePlugin = {
  type: 'trapezoid',
  category: 'basic',
  label: 'Trapezoid',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 80 },
  preview: (color = '#1f2937') =>
    `<polygon points="5,5 19,5 17,19 7,19" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const o = Math.min(20, w * 0.15);
    return `<polygon points="${o},0 ${w - o},0 ${w},${h} 0,${h}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const chevronPlugin: ShapePlugin = {
  type: 'chevron',
  category: 'basic',
  label: 'Chevron',
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  defaultSize: { width: 140, height: 60 },
  preview: (color = '#1f2937') =>
    `<path d="M3 3 L13 12 L3 21" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const notch = Math.min(40, w * 0.3);
    return `<path d="M 0 0 L ${w - notch} 0 L ${w} ${h / 2} L ${w - notch} ${h} L 0 ${h} L ${notch} ${h / 2} Z" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const bannerPlugin: ShapePlugin = {
  type: 'banner',
  category: 'basic',
  label: 'Banner',
  defaultStyle: { fill: '#dbeafe', stroke: '#1d4ed8', strokeWidth: 1.5 },
  defaultSize: { width: 160, height: 40 },
  preview: (color = '#1d4ed8') =>
    `<path d="M3 6 L21 6 L18 12 L21 18 L3 18 L6 12 Z" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const notch = Math.min(h * 0.6, 12);
    return `<path d="M ${notch} 0 L ${w} 0 L ${w - notch} ${h / 2} L ${w} ${h} L ${notch} ${h} L 0 ${h / 2} Z" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const predefProcessPlugin: ShapePlugin = {
  type: 'process',
  category: 'basic',
  label: 'Process',
  defaultStyle: { fill: '#dcfce7', stroke: '#15803d', strokeWidth: 1.5 },
  defaultSize: { width: 130, height: 80 },
  preview: (color = '#15803d') =>
    `<rect x="3" y="5" width="18" height="14" rx="7" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const r = Math.min(h / 2, 16);
    return `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const decisionPlugin: ShapePlugin = {
  type: 'decision',
  category: 'basic',
  label: 'Decision',
  defaultStyle: { fill: '#fef3c7', stroke: '#b45309', strokeWidth: 1.5 },
  defaultSize: { width: 120, height: 100 },
  preview: (color = '#b45309') =>
    `<polygon points="12,3 21,12 12,21 3,12" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    return `<polygon points="${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>`;
  },
};

export const groupPlugin: ShapePlugin = {
  type: 'group',
  category: 'basic',
  label: 'Group / Zone',
  defaultStyle: {
    fill: 'rgba(59, 130, 246, 0.04)',
    stroke: '#3b82f6',
    strokeWidth: 1.5,
    strokeDasharray: '4 4',
  },
  defaultSize: { width: 300, height: 200 },
  preview: (color = '#3b82f6') =>
    `<rect x="2" y="3" width="20" height="18" rx="2" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="2 2"/>`,
  renderBody: (s) => {
    const w = s.width;
    const h = s.height;
    const title = s.text ? s.text : '';
    const fs = s.style.fontSize ?? 12;
    const fw = s.style.fontWeight ?? 600;
    const ff = s.style.fontFamily ?? 'system-ui, sans-serif';
    const textXml = title
      ? `<text x="10" y="13" font-family="${ff}" font-size="${fs}" font-weight="${fw}" fill="${s.style.stroke}" dominant-baseline="middle">${title}</text>`
      : '';
    return `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="${s.style.fill}" stroke="${s.style.stroke}" stroke-width="${s.style.strokeWidth}" ${s.style.strokeDasharray ? `stroke-dasharray="${s.style.strokeDasharray}"` : ''} opacity="${s.style.opacity}"/>
    <rect x="0" y="0" width="${w}" height="24" rx="4" fill="rgba(15, 23, 42, 0.05)" />
    <line x1="0" y1="24" x2="${w}" y2="24" stroke="${s.style.stroke}" stroke-width="0.5" />
    ${textXml}`;
  },
};

export const extendedBuiltinPlugins: ShapePlugin[] = [
  roundedRectPlugin,
  hexagonPlugin,
  octagonPlugin,
  cylinderPlugin,
  documentPlugin,
  calloutPlugin,
  stickyNotePlugin,
  arrowRightPlugin,
  starPlugin,
  trianglePlugin,
  trapezoidPlugin,
  chevronPlugin,
  bannerPlugin,
  predefProcessPlugin,
  decisionPlugin,
  groupPlugin,
];
