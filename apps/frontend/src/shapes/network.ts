// Network icon shape plugins.
// All shapes share a generic body that places a styled SVG icon inside the
// shape's bounding box. Anchors and resize semantics are inherited from the
// default (cardinal) anchor set.

import type { ShapePlugin, ColorSlot } from './types';
import type { ShapePort } from '../types/diagram';

export const NETWORK_SLOTS: ColorSlot[] = [
  {
    id: 'body',
    label: 'Chassis / Body',
    default: '#0284c7',
    target: 'fill',
    group: 'Network Colors',
  },
  {
    id: 'accent',
    label: 'Symbols / Accents',
    default: '#ffffff',
    target: 'fill',
    group: 'Network Colors',
  },
  {
    id: 'screen',
    label: 'Faceplate / Screen',
    default: '#0f172a',
    target: 'fill',
    group: 'Network Colors',
  },
  {
    id: 'led',
    label: 'LED Indicators',
    default: '#22c55e',
    target: 'fill',
    group: 'Network Colors',
  },
  {
    id: 'shadow',
    label: 'Ports / Highlights',
    default: '#475569',
    target: 'fill',
    group: 'Network Colors',
  },
];

interface NetworkIconConfig {
  type: string;
  label: string;
  defaultSize: { width: number; height: number };
  defaultStyle: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    theme?: Record<string, string>;
  };
  colorSlots?: ColorSlot[];
  defaultTheme?: Record<string, string>;
  body: (theme: Record<string, string>) => string;
}

const ciscoBlue = '#0ea5e9';
const defaultStroke = '#0f172a';

const networkIcons: NetworkIconConfig[] = [
  {
    type: 'router',
    label: 'Router',
    defaultSize: { width: 100, height: 100 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0ea5e9',
      accent: '#ffffff',
      screen: '#0284c7',
      led: '#22c55e',
      shadow: '#38bdf8',
    },
    body: (t) => {
      const b = t.body ?? '#0ea5e9';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#0284c7';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#38bdf8';
      return `
        <!-- Outer circle chassis -->
        <circle cx="50" cy="50" r="46" fill="${b}" stroke="${s}" stroke-width="3"/>
        <circle cx="50" cy="50" r="41" fill="none" stroke="${sh}" stroke-width="1.5" stroke-dasharray="2 3"/>
        <!-- Center core panel -->
        <circle cx="50" cy="50" r="14" fill="${s}" stroke="${a}" stroke-width="1.5"/>
        <!-- Cisco-style 4 network arrows -->
        <path d="M 50,4 L 50,26 M 46,14 L 50,4 M 54,14 L 50,4" fill="none" stroke="${a}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 50,74 L 50,96 M 45,86 L 50,96 M 55,86 L 50,96" fill="none" stroke="${a}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 4,50 L 26,50 M 14,46 L 4,50 M 14,54 L 4,50" fill="none" stroke="${a}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 74,50 L 96,50 M 86,45 L 96,50 M 86,55 L 96,50" fill="none" stroke="${a}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Status LEDs -->
        <circle cx="34" cy="34" r="2.5" fill="${l}"/>
        <circle cx="66" cy="34" r="2.5" fill="${l}"/>
        <circle cx="34" cy="66" r="2.5" fill="${l}"/>
        <circle cx="66" cy="66" r="2.5" fill="#facc15"/>
      `;
    },
  },
  {
    type: 'switch',
    label: 'Switch',
    defaultSize: { width: 120, height: 60 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#1e293b',
      accent: '#facc15',
      screen: '#0f172a',
      led: '#22c55e',
      shadow: '#475569',
    },
    body: (t) => {
      const b = t.body ?? '#1e293b';
      const a = t.accent ?? '#facc15';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#475569';
      return `
        <rect x="3" y="6" width="114" height="48" rx="4" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <rect x="8" y="24" width="104" height="24" rx="2" fill="${s}" stroke="${sh}" stroke-width="1"/>
        ${Array.from({ length: 6 })
          .map(
            (_, i) => `
          <rect x="${14 + i * 14}" y="27" width="8" height="7" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.5"/>
          <circle cx="${18 + i * 14}" cy="37" r="1.2" fill="${l}"/>
          <rect x="${14 + i * 14}" y="38" width="8" height="7" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.5"/>
          <circle cx="${18 + i * 14}" cy="47" r="1.2" fill="${l}"/>
        `
          )
          .join('')}
        <rect x="98" y="27" width="5" height="8" rx="0.5" fill="#cbd5e1"/>
        <rect x="104" y="27" width="5" height="8" rx="0.5" fill="#cbd5e1"/>
        <path d="M 15,15 L 35,15 M 35,15 L 30,12 M 35,15 L 30,18" fill="none" stroke="${a}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 45,15 L 25,15 M 25,15 L 30,12 M 25,15 L 30,18" fill="none" stroke="${a}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="108" cy="14" r="1.5" fill="${l}"/>
        <circle cx="112" cy="14" r="1.5" fill="${a}"/>
      `;
    },
  },
  {
    type: 'firewall',
    label: 'Firewall',
    defaultSize: { width: 100, height: 100 },
    defaultStyle: { fill: '#ffffff', stroke: '#dc2626', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#dc2626',
      accent: '#fca5a5',
      screen: '#7f1d1d',
      led: '#facc15',
      shadow: '#ef4444',
    },
    body: (t) => {
      const b = t.body ?? '#dc2626';
      const a = t.accent ?? '#fca5a5';
      const s = t.screen ?? '#7f1d1d';
      const l = t.led ?? '#facc15';
      const sh = t.shadow ?? '#ef4444';
      return `
        <path d="M 50,4 L 92,16 L 92,60 Q 92,90 50,96 Q 8,90 8,60 L 8,16 Z" fill="${b}" stroke="${s}" stroke-width="3.5" stroke-linejoin="round"/>
        <g stroke="${s}" stroke-width="1.2">
          <rect x="22" y="24" width="26" height="10" fill="${a}"/>
          <rect x="52" y="24" width="26" height="10" fill="${sh}"/>
          <rect x="16" y="37" width="14" height="10" fill="${sh}"/>
          <rect x="34" y="37" width="32" height="10" fill="${a}"/>
          <rect x="70" y="37" width="14" height="10" fill="${sh}"/>
          <rect x="22" y="50" width="26" height="10" fill="${sh}"/>
          <rect x="52" y="50" width="26" height="10" fill="${a}"/>
          <rect x="18" y="63" width="18" height="10" fill="${a}"/>
          <rect x="40" y="63" width="20" height="10" fill="${sh}"/>
          <rect x="64" y="63" width="18" height="10" fill="${a}"/>
          <rect x="30" y="76" width="40" height="10" fill="${sh}"/>
        </g>
        <circle cx="50" cy="14" r="3" fill="${l}"/>
        <circle cx="40" cy="14" r="2" fill="${l}" opacity="0.6"/>
        <circle cx="60" cy="14" r="2" fill="${l}" opacity="0.6"/>
      `;
    },
  },
  {
    type: 'server',
    label: 'Server',
    defaultSize: { width: 100, height: 110 },
    defaultStyle: { fill: '#f8fafc', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#f1f5f9',
      accent: '#3b82f6',
      screen: '#1e293b',
      led: '#22c55e',
      shadow: '#94a3b8',
    },
    body: (t) => {
      const b = t.body ?? '#f1f5f9';
      const a = t.accent ?? '#3b82f6';
      const s = t.screen ?? '#1e293b';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#94a3b8';
      return `
        <rect x="8" y="4" width="84" height="102" rx="4" fill="${b}" stroke="${s}" stroke-width="1.8"/>
        <rect x="2" y="12" width="6" height="24" rx="1.5" fill="${sh}" stroke="${s}" stroke-width="1"/>
        <rect x="92" y="12" width="6" height="24" rx="1.5" fill="${sh}" stroke="${s}" stroke-width="1"/>
        ${[0, 1, 2, 3]
          .map(
            (i) => `
          <g transform="translate(0, ${i * 20})">
            <rect x="14" y="14" width="72" height="15" rx="2" fill="${s}" stroke="${sh}" stroke-width="0.8"/>
            <rect x="18" y="18" width="26" height="7" rx="0.5" fill="${b}" opacity="0.3"/>
            <rect x="48" y="18" width="28" height="7" rx="1" fill="${sh}"/>
            <circle cx="81" cy="21.5" r="1.5" fill="${l}"/>
          </g>
        `
          )
          .join('')}
        <rect x="14" y="92" width="46" height="10" rx="1" fill="${s}" stroke="${sh}" stroke-width="0.5"/>
        <text x="37" y="100" text-anchor="middle" font-family="monospace" font-size="7" fill="${a}">SRV-01</text>
        <circle cx="74" cy="97" r="2.5" fill="${l}"/>
        <circle cx="82" cy="97" r="2" fill="#ef4444"/>
      `;
    },
  },
  {
    type: 'rack',
    label: 'Rack 19"',
    defaultSize: { width: 110, height: 160 },
    defaultStyle: { fill: '#0f172a', stroke: '#020617', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0f172a',
      accent: '#0284c7',
      screen: '#1e293b',
      led: '#22c55e',
      shadow: '#475569',
    },
    body: (t) => {
      const b = t.body ?? '#0f172a';
      const a = t.accent ?? '#0284c7';
      const s = t.screen ?? '#1e293b';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#475569';
      return `
        <rect x="4" y="4" width="102" height="152" rx="5" fill="${b}" stroke="${sh}" stroke-width="2.5"/>
        <rect x="10" y="10" width="90" height="140" rx="2" fill="${s}" stroke="${sh}" stroke-width="1.2"/>
        <rect x="14" y="14" width="4" height="132" fill="${sh}"/>
        <rect x="92" y="14" width="4" height="132" fill="${sh}"/>
        <rect x="20" y="18" width="70" height="20" rx="1.5" fill="${b}" stroke="${sh}" stroke-width="0.8"/>
        <line x1="24" y1="28" x2="60" y2="28" stroke="${sh}" stroke-width="3"/>
        <circle cx="80" cy="28" r="2" fill="${l}"/>
        <circle cx="85" cy="28" r="2" fill="${l}"/>
        <rect x="20" y="44" width="70" height="10" rx="1" fill="${b}" stroke="${sh}" stroke-width="0.8"/>
        ${Array.from({ length: 12 })
          .map((_, i) => `<rect x="${24 + i * 4.5}" y="47" width="2.5" height="4" fill="${sh}"/>`)
          .join('')}
        <rect x="20" y="60" width="70" height="10" rx="1" fill="${b}" stroke="${sh}" stroke-width="0.8"/>
        <rect x="24" y="63" width="30" height="4" fill="${s}"/>
        <circle cx="82" cy="65" r="1.5" fill="${l}"/>
        <circle cx="86" cy="65" r="1.5" fill="${l}"/>
        <rect x="20" y="76" width="70" height="16" rx="1.5" fill="${b}" stroke="${sh}" stroke-width="0.8"/>
        <circle cx="28" cy="84" r="3" fill="${s}"/>
        <rect x="40" y="81" width="30" height="6" rx="1" fill="${s}"/>
        <circle cx="82" cy="84" r="2" fill="${l}"/>
        <rect x="20" y="98" width="70" height="6" fill="${sh}"/>
        <rect x="20" y="110" width="70" height="28" rx="2" fill="${b}" stroke="${sh}" stroke-width="0.8"/>
        ${[0, 1, 2].map((j) => `<rect x="${26 + j * 16}" y="116" width="10" height="16" rx="0.5" fill="${s}"/>`).join('')}
        <circle cx="82" cy="124" r="2" fill="${l}"/>
        <path d="M 12,12 L 88,12 L 12,148 Z" fill="${a}" fill-opacity="0.08" pointer-events="none"/>
      `;
    },
  },
  {
    type: 'ont',
    label: 'ONT / Modem',
    defaultSize: { width: 100, height: 60 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#f8fafc',
      accent: '#64748b',
      screen: '#e2e8f0',
      led: '#22c55e',
      shadow: '#0ea5e9',
    },
    body: (t) => {
      const b = t.body ?? '#f8fafc';
      const a = t.accent ?? '#64748b';
      const s = t.screen ?? '#e2e8f0';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#0ea5e9';
      return `
        <rect x="4" y="10" width="92" height="40" rx="6" fill="${b}" stroke="${a}" stroke-width="1.8"/>
        <path d="M 12,50 L 88,50 L 80,54 L 20,54 Z" fill="${s}" stroke="${a}" stroke-width="1"/>
        <rect x="12" y="20" width="46" height="12" rx="2.5" fill="${s}" stroke="${a}" stroke-width="0.6"/>
        <circle cx="18" cy="26" r="2" fill="${l}"/>
        <circle cx="26" cy="26" r="2" fill="${l}"/>
        <circle cx="34" cy="26" r="2" fill="${l}"/>
        <circle cx="42" cy="26" r="2" fill="#ef4444" fill-opacity="0.2"/>
        <g fill="${a}">
          <rect x="68" y="20" width="16" height="2" rx="0.5"/>
          <rect x="68" y="25" width="16" height="2" rx="0.5"/>
          <rect x="68" y="30" width="16" height="2" rx="0.5"/>
        </g>
        <path d="M 88,18 Q 93,22 88,26" fill="none" stroke="${sh}" stroke-width="2" stroke-linecap="round"/>
      `;
    },
  },
  {
    type: 'olt',
    label: 'OLT',
    defaultSize: { width: 140, height: 80 },
    defaultStyle: { fill: '#ffffff', stroke: '#ea580c', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#ea580c',
      accent: '#fed7aa',
      screen: '#431407',
      led: '#22c55e',
      shadow: '#f97316',
    },
    body: (t) => {
      const b = t.body ?? '#ea580c';
      const a = t.accent ?? '#fed7aa';
      const s = t.screen ?? '#431407';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#f97316';
      return `
        <rect x="4" y="6" width="132" height="68" rx="4" fill="${b}" stroke="${s}" stroke-width="2"/>
        <rect x="10" y="14" width="120" height="42" rx="2" fill="${s}" stroke="${sh}" stroke-width="1.2"/>
        ${Array.from({ length: 8 })
          .map(
            (_, i) => `
          <g transform="translate(${i * 14.5}, 0)">
            <rect x="13" y="16" width="12" height="38" rx="1" fill="${a}" stroke="${sh}" stroke-width="0.6"/>
            <rect x="17" y="20" width="4" height="6" fill="${s}"/>
            <circle cx="19" cy="27.5" r="1" fill="${l}"/>
            <rect x="17" y="30" width="4" height="6" fill="${s}"/>
            <circle cx="19" cy="37.5" r="1" fill="${l}"/>
            <rect x="15" y="44" width="8" height="3" rx="0.5" fill="${sh}"/>
          </g>
        `
          )
          .join('')}
        <rect x="10" y="58" width="120" height="12" rx="1" fill="${sh}" stroke="${s}" stroke-width="0.8"/>
        <circle cx="18" cy="64" r="2.5" fill="${l}"/>
        <circle cx="26" cy="64" r="2.5" fill="${l}"/>
        <rect x="36" y="62" width="20" height="4" rx="0.5" fill="${s}"/>
      `;
    },
  },
  {
    type: 'cloud',
    label: 'Cloud',
    defaultSize: { width: 130, height: 80 },
    defaultStyle: { fill: '#f1f5f9', stroke: '#0284c7', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0ea5e9',
      accent: '#ffffff',
      screen: '#0284c7',
      led: '#22c55e',
      shadow: '#bae6fd',
    },
    body: (t) => {
      const b = t.body ?? '#0ea5e9';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#0284c7';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#bae6fd';
      return `
        <path d="M26 62 Q6 62 6 48 Q6 34 26 36 Q30 18 50 18 Q70 18 72 36 Q90 34 96 48 Q102 62 82 62 Z" fill="${s}" transform="translate(6, 6)"/>
        <path d="M26 62 Q6 62 6 48 Q6 34 26 36 Q30 18 50 18 Q70 18 72 36 Q90 34 96 48 Q102 62 82 62 Z" fill="${b}" stroke="${a}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M30 54 Q18 54 18 44 Q18 36 30 38 Q34 26 48 26 Q62 26 64 38 Q78 36 82 44" fill="none" stroke="${sh}" stroke-width="3" stroke-linecap="round" opacity="0.65"/>
        <circle cx="50" cy="48" r="3" fill="${l}"/>
        <circle cx="62" cy="48" r="2" fill="${sh}"/>
        <circle cx="38" cy="48" r="2" fill="${sh}"/>
      `;
    },
  },
  {
    type: 'internet',
    label: 'Internet',
    defaultSize: { width: 110, height: 110 },
    defaultStyle: { fill: '#dbeafe', stroke: '#1d4ed8', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#1d4ed8',
      accent: '#93c5fd',
      screen: '#172554',
      led: '#facc15',
      shadow: '#3b82f6',
    },
    body: (t) => {
      const b = t.body ?? '#1d4ed8';
      const a = t.accent ?? '#93c5fd';
      const s = t.screen ?? '#172554';
      const l = t.led ?? '#facc15';
      const sh = t.shadow ?? '#3b82f6';
      return `
        <circle cx="50" cy="50" r="46" fill="none" stroke="${s}" stroke-width="1.8" stroke-dasharray="6 4"/>
        <circle cx="50" cy="50" r="38" fill="${b}" stroke="${s}" stroke-width="2"/>
        <line x1="13" y1="50" x2="87" y2="50" stroke="${a}" stroke-width="1.5"/>
        <path d="M 18,34 Q 50,42 82,34 M 18,66 Q 50,58 82,66" fill="none" stroke="${a}" stroke-width="1.2"/>
        <ellipse cx="50" cy="50" rx="38" ry="16" fill="none" stroke="${a}" stroke-width="1.5" transform="rotate(90, 50, 50)"/>
        <ellipse cx="50" cy="50" rx="38" ry="28" fill="none" stroke="${a}" stroke-width="1" transform="rotate(90, 50, 50)"/>
        <line x1="50" y1="12" x2="50" y2="88" stroke="${a}" stroke-width="1.5"/>
        <circle cx="50" cy="4" r="4" fill="${l}" stroke="${b}" stroke-width="0.8"/>
        <circle cx="96" cy="50" r="4" fill="${l}" stroke="${b}" stroke-width="0.8"/>
        <circle cx="4" cy="50" r="4" fill="${l}" stroke="${b}" stroke-width="0.8"/>
        <circle cx="42" cy="42" r="38" fill="none" stroke="${sh}" stroke-width="2" opacity="0.3"/>
      `;
    },
  },
  {
    type: 'lan',
    label: 'LAN',
    defaultSize: { width: 120, height: 80 },
    defaultStyle: { fill: '#ecfdf5', stroke: '#059669', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#10b981',
      accent: '#ffffff',
      screen: '#064e3b',
      led: '#34d399',
      shadow: '#047857',
    },
    body: (t) => {
      const b = t.body ?? '#10b981';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#064e3b';
      const l = t.led ?? '#34d399';
      const sh = t.shadow ?? '#047857';
      return `
        <rect x="4" y="4" width="112" height="72" rx="8" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <line x1="16" y1="52" x2="104" y2="52" stroke="${a}" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="30" y1="52" x2="30" y2="38" stroke="${a}" stroke-width="2"/>
        <rect x="20" y="22" width="20" height="16" rx="2" fill="${s}" stroke="${a}" stroke-width="1.2"/>
        <circle cx="37" cy="27" r="1.5" fill="${l}"/>
        <line x1="60" y1="52" x2="60" y2="38" stroke="${a}" stroke-width="2"/>
        <rect x="50" y="22" width="20" height="16" rx="2" fill="${s}" stroke="${a}" stroke-width="1.2"/>
        <circle cx="67" cy="27" r="1.5" fill="${l}"/>
        <line x1="90" y1="52" x2="90" y2="38" stroke="${a}" stroke-width="2"/>
        <rect x="80" y="22" width="20" height="16" rx="2" fill="${s}" stroke="${a}" stroke-width="1.2"/>
        <circle cx="97" cy="27" r="1.5" fill="${l}"/>
        <text x="60" y="68" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="10" fill="${a}" letter-spacing="1">LAN</text>
      `;
    },
  },
  {
    type: 'wan',
    label: 'WAN',
    defaultSize: { width: 120, height: 80 },
    defaultStyle: { fill: '#fef3c7', stroke: '#b45309', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#f59e0b',
      accent: '#ffffff',
      screen: '#78350f',
      led: '#fbbf24',
      shadow: '#b45309',
    },
    body: (t) => {
      const b = t.body ?? '#f59e0b';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#78350f';
      const l = t.led ?? '#fbbf24';
      const sh = t.shadow ?? '#b45309';
      return `
        <rect x="4" y="4" width="112" height="72" rx="8" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <path d="M 28,28 L 60,42 L 92,28 M 28,28 L 92,28 M 60,42 L 60,60" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="18" y="20" width="20" height="16" rx="2" fill="${s}" stroke="${a}" stroke-width="1.2"/>
        <circle cx="28" cy="28" r="2.5" fill="${l}"/>
        <rect x="82" y="20" width="20" height="16" rx="2" fill="${s}" stroke="${a}" stroke-width="1.2"/>
        <circle cx="92" cy="28" r="2.5" fill="${l}"/>
        <circle cx="60" cy="42" r="8" fill="${s}" stroke="${a}" stroke-width="1.5"/>
        <circle cx="60" cy="42" r="3" fill="${l}"/>
        <text x="60" y="68" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="10" fill="${a}" letter-spacing="1">WAN</text>
      `;
    },
  },
  {
    type: 'wifi',
    label: 'Wi-Fi',
    defaultSize: { width: 100, height: 100 },
    defaultStyle: { fill: 'transparent', stroke: '#0284c7', strokeWidth: 1.8 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0ea5e9',
      accent: '#bae6fd',
      screen: '#0369a1',
      led: '#22c55e',
      shadow: '#7dd3fc',
    },
    body: (t) => {
      const b = t.body ?? '#0ea5e9';
      const a = t.accent ?? '#bae6fd';
      const s = t.screen ?? '#0369a1';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#7dd3fc';
      return `
        <circle cx="50" cy="84" r="6" fill="${b}" stroke="${s}" stroke-width="1.5"/>
        <circle cx="50" cy="84" r="2" fill="${l}"/>
        <path d="M 38,72 A 16 16 0 0 1 62,72" fill="none" stroke="${b}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 28,60 A 32 32 0 0 1 72,60" fill="none" stroke="${sh}" stroke-width="4" stroke-linecap="round"/>
        <path d="M 18,48 A 48 48 0 0 1 82,48" fill="none" stroke="${b}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M 8,36 A 64 64 0 0 1 92,36" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 4"/>
      `;
    },
  },
  {
    type: 'workstation',
    label: 'Workstation',
    defaultSize: { width: 110, height: 95 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#475569',
      accent: '#38bdf8',
      screen: '#0f172a',
      led: '#22c55e',
      shadow: '#cbd5e1',
    },
    body: (t) => {
      const b = t.body ?? '#475569';
      const a = t.accent ?? '#38bdf8';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#cbd5e1';
      return `
        <rect x="6" y="6" width="76" height="52" rx="4" fill="${b}" stroke="${s}" stroke-width="1.8"/>
        <rect x="11" y="11" width="66" height="42" rx="1" fill="${s}"/>
        <rect x="16" y="16" width="22" height="14" rx="1" fill="${a}" fill-opacity="0.15" stroke="${a}" stroke-width="0.6"/>
        <line x1="20" y1="36" x2="68" y2="36" stroke="${a}" stroke-width="1" opacity="0.6"/>
        <line x1="20" y1="42" x2="52" y2="42" stroke="${a}" stroke-width="1" opacity="0.6"/>
        <circle cx="62" cy="23" r="4" fill="${a}"/>
        <path d="M 38,58 L 50,58 L 54,74 L 34,74 Z" fill="${sh}" stroke="${s}" stroke-width="1"/>
        <rect x="28" y="72" width="32" height="4" rx="1" fill="${b}" stroke="${s}" stroke-width="1"/>
        <rect x="88" y="16" width="18" height="60" rx="2" fill="${s}" stroke="${b}" stroke-width="1.5"/>
        <rect x="91" y="22" width="12" height="4" rx="0.5" fill="${b}"/>
        <rect x="91" y="29" width="12" height="2" rx="0.5" fill="${b}"/>
        <line x1="91" y1="64" x2="97" y2="64" stroke="${b}" stroke-width="1.5"/>
        <circle cx="94" cy="70" r="2" fill="${l}"/>
        <rect x="16" y="82" width="56" height="4" rx="1" fill="${s}"/>
        <ellipse cx="80" cy="84" rx="2.5" ry="3.5" fill="${b}"/>
      `;
    },
  },
  {
    type: 'laptop',
    label: 'Laptop',
    defaultSize: { width: 110, height: 75 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#64748b',
      accent: '#22d3ee',
      screen: '#0f172a',
      led: '#22c55e',
      shadow: '#e2e8f0',
    },
    body: (t) => {
      const b = t.body ?? '#64748b';
      const a = t.accent ?? '#22d3ee';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#e2e8f0';
      return `
        <rect x="18" y="8" width="74" height="46" rx="4" fill="${b}" stroke="${s}" stroke-width="1.8"/>
        <rect x="22" y="12" width="66" height="38" rx="1.5" fill="${s}"/>
        <path d="M 28,42 L 44,28 L 56,36 L 76,22" fill="none" stroke="${a}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="76" cy="22" r="1.5" fill="${l}"/>
        <circle cx="22" cy="12" r="1" fill="${l}"/>
        <path d="M 6,54 L 104,54 L 98,66 L 12,66 Z" fill="${sh}" stroke="${s}" stroke-width="1.5" stroke-linejoin="round"/>
        <polygon points="18,56 92,56 89,61 21,61" fill="${s}"/>
        <rect x="47" y="62" width="16" height="3" rx="0.5" fill="${b}"/>
        <circle cx="10" cy="60" r="1.2" fill="${l}"/>
      `;
    },
  },
  {
    type: 'phone',
    label: 'Phone',
    defaultSize: { width: 60, height: 100 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#1e293b',
      accent: '#38bdf8',
      screen: '#0f172a',
      led: '#22c55e',
      shadow: '#475569',
    },
    body: (t) => {
      const b = t.body ?? '#1e293b';
      const a = t.accent ?? '#38bdf8';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#475569';
      return `
        <rect x="6" y="4" width="48" height="92" rx="7" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <rect x="20" y="8" width="20" height="4" rx="2" fill="${sh}"/>
        <circle cx="44" cy="10" r="1" fill="${l}"/>
        <rect x="10" y="16" width="40" height="68" rx="2.5" fill="${s}" stroke="${sh}" stroke-width="0.8"/>
        <rect x="14" y="20" width="10" height="2" rx="0.5" fill="${a}"/>
        <rect x="38" y="20" width="8" height="2" rx="0.5" fill="${l}"/>
        <circle cx="30" cy="48" r="12" fill="none" stroke="${a}" stroke-width="1"/>
        <line x1="22" y1="48" x2="38" y2="48" stroke="${a}" stroke-width="1"/>
        <line x1="30" y1="40" x2="30" y2="56" stroke="${a}" stroke-width="1"/>
        <circle cx="30" cy="48" r="3" fill="${a}"/>
        <circle cx="30" cy="40" r="2.2" fill="${l}"/>
        <circle cx="38" cy="48" r="2.2" fill="${l}"/>
        <circle cx="30" cy="88" r="3.5" fill="none" stroke="${sh}" stroke-width="1"/>
      `;
    },
  },
  {
    type: 'printer',
    label: 'Printer',
    defaultSize: { width: 110, height: 90 },
    defaultStyle: { fill: '#f8fafc', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#e2e8f0',
      accent: '#ffffff',
      screen: '#334155',
      led: '#22c55e',
      shadow: '#94a3b8',
    },
    body: (t) => {
      const b = t.body ?? '#e2e8f0';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#334155';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#94a3b8';
      return `
        <rect x="22" y="6" width="66" height="20" rx="1.5" fill="${sh}" stroke="${s}" stroke-width="1.2"/>
        <rect x="26" y="10" width="58" height="16" fill="${a}"/>
        <rect x="8" y="24" width="94" height="52" rx="5" fill="${b}" stroke="${s}" stroke-width="2"/>
        <rect x="18" y="52" width="74" height="16" rx="2" fill="${sh}" stroke="${s}" stroke-width="1"/>
        <rect x="24" y="44" width="62" height="14" rx="1" fill="${a}" stroke="${s}" stroke-width="0.8"/>
        <line x1="30" y1="48" x2="80" y2="48" stroke="${sh}" stroke-width="1"/>
        <line x1="30" y1="52" x2="64" y2="52" stroke="${sh}" stroke-width="1"/>
        <rect x="18" y="30" width="36" height="12" rx="1.5" fill="${s}"/>
        <rect x="22" y="33" width="16" height="6" rx="0.5" fill="${a}" fill-opacity="0.2" stroke="${a}" stroke-width="0.5"/>
        <circle cx="48" cy="36" r="2" fill="${l}"/>
        <circle cx="90" cy="34" r="3" fill="${l}"/>
      `;
    },
  },
  {
    type: 'database',
    label: 'Database',
    defaultSize: { width: 90, height: 110 },
    defaultStyle: { fill: '#f8fafc', stroke: '#0369a1', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0ea5e9',
      accent: '#e0f2fe',
      screen: '#0284c7',
      led: '#f59e0b',
      shadow: '#0369a1',
    },
    body: (t) => {
      const b = t.body ?? '#0ea5e9';
      const a = t.accent ?? '#e0f2fe';
      const s = t.screen ?? '#0284c7';
      const l = t.led ?? '#f59e0b';
      const sh = t.shadow ?? '#0369a1';
      return `
        <path d="M 8,76 L 8,92 C 8,102 82,102 82,92 L 82,76" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <ellipse cx="45" cy="92" rx="37" ry="10" fill="none" stroke="${a}" stroke-width="1.2" opacity="0.4"/>
        <ellipse cx="45" cy="76" rx="37" ry="10" fill="${s}" stroke="${sh}" stroke-width="2"/>
        <circle cx="20" cy="84" r="2" fill="${l}"/>
        <path d="M 8,46 L 8,62 C 8,72 82,72 82,62 L 82,46" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <ellipse cx="45" cy="62" rx="37" ry="10" fill="none" stroke="${a}" stroke-width="1.2" opacity="0.4"/>
        <ellipse cx="45" cy="46" rx="37" ry="10" fill="${s}" stroke="${sh}" stroke-width="2"/>
        <circle cx="20" cy="54" r="2" fill="${l}"/>
        <path d="M 8,16 L 8,32 C 8,42 82,42 82,32 L 82,16" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <ellipse cx="45" cy="32" rx="37" ry="10" fill="none" stroke="${a}" stroke-width="1.2" opacity="0.4"/>
        <ellipse cx="45" cy="16" rx="37" ry="10" fill="${s}" stroke="${sh}" stroke-width="2"/>
        <circle cx="20" cy="24" r="2" fill="${l}"/>
        <path d="M 35,16 Q 45,21 55,16" fill="none" stroke="${a}" stroke-width="1.8" stroke-linecap="round"/>
      `;
    },
  },
  {
    type: 'access-point',
    label: 'Access Point',
    defaultSize: { width: 110, height: 100 },
    defaultStyle: { fill: '#f8fafc', stroke: '#0d9488', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#f8fafc',
      accent: '#0d9488',
      screen: '#cbd5e1',
      led: '#22c55e',
      shadow: '#e2e8f0',
    },
    body: (t) => {
      const b = t.body ?? '#f8fafc';
      const a = t.accent ?? '#0d9488';
      const s = t.screen ?? '#cbd5e1';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#e2e8f0';
      return `
        <circle cx="55" cy="56" r="42" fill="${s}" stroke="${a}" stroke-width="1.5"/>
        <circle cx="55" cy="56" r="36" fill="${b}" stroke="${a}" stroke-width="2"/>
        <circle cx="55" cy="56" r="10" fill="none" stroke="${sh}" stroke-width="2"/>
        <circle cx="55" cy="56" r="10" fill="none" stroke="${l}" stroke-width="2" stroke-dasharray="16 10"/>
        <circle cx="55" cy="56" r="4" fill="${a}"/>
        <path d="M 34,22 Q 55,6 76,22" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 42,32 Q 55,18 68,32" fill="none" stroke="${a}" stroke-width="1.8" stroke-linecap="round"/>
      `;
    },
  },
  {
    type: 'camera',
    label: 'IP Camera',
    defaultSize: { width: 100, height: 75 },
    defaultStyle: { fill: '#f8fafc', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#475569',
      accent: '#22d3ee',
      screen: '#0f172a',
      led: '#ef4444',
      shadow: '#94a3b8',
    },
    body: (t) => {
      const b = t.body ?? '#475569';
      const a = t.accent ?? '#22d3ee';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#ef4444';
      const sh = t.shadow ?? '#94a3b8';
      return `
        <rect x="6" y="26" width="12" height="30" rx="2" fill="${sh}" stroke="${s}" stroke-width="1.5"/>
        <path d="M 18,41 L 34,41" fill="none" stroke="${s}" stroke-width="5" stroke-linecap="round"/>
        <rect x="32" y="16" width="56" height="50" rx="10" fill="${b}" stroke="${s}" stroke-width="2" transform="rotate(-15, 60, 41)"/>
        <rect x="76" y="24" width="14" height="34" rx="2" fill="${s}" stroke="${b}" stroke-width="1.2" transform="rotate(-15, 60, 41)"/>
        <ellipse cx="84" cy="41" rx="2" ry="8" fill="${a}" transform="rotate(-15, 60, 41)"/>
        <circle cx="56" cy="30" r="2.5" fill="${l}"/>
        <path d="M 30,16 L 86,10 L 84,20 Z" fill="${sh}" stroke="${s}" stroke-width="1"/>
      `;
    },
  },
  {
    type: 'tv',
    label: 'TV / Display',
    defaultSize: { width: 130, height: 85 },
    defaultStyle: { fill: '#0f172a', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#1e293b',
      accent: '#ffffff',
      screen: '#0ea5e9',
      led: '#ef4444',
      shadow: '#475569',
    },
    body: (t) => {
      const b = t.body ?? '#1e293b';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#0ea5e9';
      const l = t.led ?? '#ef4444';
      const sh = t.shadow ?? '#475569';
      return `
        <rect x="4" y="4" width="122" height="66" rx="3" fill="${b}" stroke="${sh}" stroke-width="1.8"/>
        <rect x="8" y="8" width="114" height="58" fill="${s}"/>
        <polyline points="16,48 40,28 64,42 92,20 112,38" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="40" cy="28" r="3" fill="${a}"/>
        <circle cx="92" cy="20" r="3" fill="${a}"/>
        <text x="14" y="20" font-family="sans-serif" font-weight="700" font-size="7" fill="${a}">LIVE STATUS</text>
        <rect x="58" y="70" width="14" height="8" fill="${sh}" stroke="${b}" stroke-width="1"/>
        <ellipse cx="65" cy="78" rx="22" ry="4" fill="${b}" stroke="${sh}" stroke-width="1"/>
        <circle cx="65" cy="67" r="1.5" fill="${l}"/>
      `;
    },
  },
  {
    type: 'cable-tray',
    label: 'Cable Tray',
    defaultSize: { width: 140, height: 40 },
    defaultStyle: { fill: '#e2e8f0', stroke: '#64748b', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#64748b',
      accent: '#3b82f6',
      screen: '#475569',
      led: '#ea580c',
      shadow: '#cbd5e1',
    },
    body: (t) => {
      const b = t.body ?? '#64748b';
      const a = t.accent ?? '#3b82f6';
      const l = t.led ?? '#ea580c';
      const sh = t.shadow ?? '#cbd5e1';
      return `
        <rect x="2" y="6" width="136" height="28" rx="2" fill="none" stroke="${b}" stroke-width="2.5"/>
        ${Array.from({ length: 9 })
          .map(
            (_, i) =>
              `<line x1="${14 + i * 14}" y1="6" x2="${14 + i * 14}" y2="34" stroke="${b}" stroke-width="1.8"/>`
          )
          .join('')}
        <path d="M 2,12 Q 35,16 70,12 T 138,14" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round"/>
        <path d="M 2,22 Q 45,18 90,24 T 138,20" fill="none" stroke="${l}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M 2,28 Q 25,30 60,26 T 138,27" fill="none" stroke="${sh}" stroke-width="2.5" stroke-linecap="round"/>
      `;
    },
  },
];

function getDefaultPortsForType(type: string): ShapePort[] {
  switch (type) {
    case 'router':
      return [
        { id: 'gi0-0', label: 'Gi0/0', x: 0.2, y: 1, mediaType: 'copper' },
        { id: 'gi0-1', label: 'Gi0/1', x: 0.4, y: 1, mediaType: 'copper' },
        { id: 'gi0-2', label: 'Gi0/2', x: 0.6, y: 1, mediaType: 'copper' },
        { id: 'gi0-3', label: 'Gi0/3', x: 0.8, y: 1, mediaType: 'copper' },
        { id: 'mgmt', label: 'Mgmt', x: 0.1, y: 0, mediaType: 'copper' },
        { id: 'console', label: 'Console', x: 0.9, y: 0, mediaType: 'console' },
      ];
    case 'switch': {
      const ports: ShapePort[] = [];
      for (let i = 1; i <= 24; i++) {
        ports.push({
          id: `port-${i}`,
          label: `${i}`,
          x: 0.05 + (i / 25) * 0.9,
          y: 1,
          mediaType: 'copper',
        });
      }
      ports.push({ id: 'sfp1', label: 'SFP1', x: 0.85, y: 0, mediaType: 'sfp' });
      ports.push({ id: 'sfp2', label: 'SFP2', x: 0.95, y: 0, mediaType: 'sfp' });
      return ports;
    }
    case 'firewall':
      return [
        { id: 'inside', label: 'Inside', x: 0.25, y: 1, mediaType: 'copper' },
        { id: 'outside', label: 'Outside', x: 0.75, y: 1, mediaType: 'copper' },
        { id: 'dmz', label: 'DMZ', x: 0.5, y: 1, mediaType: 'copper' },
        { id: 'mgmt', label: 'Mgmt', x: 0.5, y: 0, mediaType: 'copper' },
      ];
    case 'server':
      return [
        { id: 'eth0', label: 'eth0', x: 0.3, y: 1, mediaType: 'copper' },
        { id: 'eth1', label: 'eth1', x: 0.7, y: 1, mediaType: 'copper' },
        { id: 'ipmi', label: 'IPMI', x: 0.5, y: 0, mediaType: 'copper' },
      ];
    case 'olt': {
      const oltPorts: ShapePort[] = [];
      for (let i = 1; i <= 8; i++) {
        oltPorts.push({
          id: `pon-${i}`,
          label: `PON${i}`,
          x: 0.1 + (i / 9) * 0.8,
          y: 1,
          mediaType: 'fiber',
        });
      }
      oltPorts.push({ id: 'uplink-1', label: 'Uplink1', x: 0.3, y: 0, mediaType: 'sfp' });
      oltPorts.push({ id: 'uplink-2', label: 'Uplink2', x: 0.7, y: 0, mediaType: 'sfp' });
      return oltPorts;
    }
    case 'ont':
      return [
        { id: 'pon', label: 'PON', x: 0.5, y: 0, mediaType: 'fiber' },
        { id: 'lan1', label: 'LAN1', x: 0.2, y: 1, mediaType: 'copper' },
        { id: 'lan2', label: 'LAN2', x: 0.4, y: 1, mediaType: 'copper' },
        { id: 'lan3', label: 'LAN3', x: 0.6, y: 1, mediaType: 'copper' },
        { id: 'lan4', label: 'LAN4', x: 0.8, y: 1, mediaType: 'copper' },
      ];
    default:
      return [];
  }
}

function makeNetworkPlugin(cfg: NetworkIconConfig): ShapePlugin {
  return {
    type: cfg.type,
    category: 'network',
    label: cfg.label,
    defaultStyle: {
      ...cfg.defaultStyle,
      theme: cfg.defaultTheme ? { ...cfg.defaultTheme } : {},
    },
    defaultSize: cfg.defaultSize,
    colorSlots: cfg.colorSlots,
    defaultTheme: cfg.defaultTheme,
    preview: (color = cfg.defaultStyle.stroke) => {
      const theme = cfg.defaultTheme ? { ...cfg.defaultTheme } : {};
      if (
        color &&
        color !== defaultStroke &&
        color !== '#dc2626' &&
        color !== '#ea580c' &&
        color !== '#059669' &&
        color !== '#b45309' &&
        color !== '#1d4ed8'
      ) {
        theme.body = color;
        theme.accent = '#ffffff';
      }
      const scale = 24 / Math.max(cfg.defaultSize.width, cfg.defaultSize.height);
      const w = cfg.defaultSize.width * scale;
      const h = cfg.defaultSize.height * scale;
      const offX = (24 - w) / 2;
      const offY = (24 - h) / 2;
      return `<g transform="translate(${offX} ${offY}) scale(${scale})">${cfg.body(theme)}</g>`;
    },
    renderBody: (s) => {
      const sx = s.width / cfg.defaultSize.width;
      const sy = s.height / cfg.defaultSize.height;
      const theme = s.style.theme ?? cfg.defaultTheme ?? {};
      return `<g transform="scale(${sx} ${sy})" opacity="${s.style.opacity}">${cfg.body(theme)}</g>`;
    },
    getDefaultPorts: (s) => getDefaultPortsForType(s.type),
  };
}

export const networkPlugins: ShapePlugin[] = networkIcons.map(makeNetworkPlugin);

export const ciscoColors = {
  blue: ciscoBlue,
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#facc15',
  purple: '#a855f7',
  orange: '#f97316',
  teal: '#14b8a6',
};
