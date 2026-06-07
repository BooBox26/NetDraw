// Extended network icons — additional professional network equipment.
// Each icon uses the same body-renderer pattern as network.ts.

import type { ShapePlugin, ColorSlot } from './types';
import { NETWORK_SLOTS } from './network';

interface ExtIconConfig {
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

const defaultStroke = '#0f172a';

const extIcons: ExtIconConfig[] = [
  {
    type: 'load-balancer',
    label: 'Load Balancer',
    defaultSize: { width: 110, height: 80 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#10b981',
      accent: '#ffffff',
      screen: '#064e3b',
      led: '#22c55e',
      shadow: '#64748b',
    },
    body: (t) => {
      const b = t.body ?? '#10b981';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#064e3b';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#64748b';
      return `
        <!-- Main box body (chassis) -->
        <rect x="6" y="10" width="98" height="60" rx="4" fill="${b}" stroke="${s}" stroke-width="1.8"/>
        <!-- Inner panel screen -->
        <circle cx="55" cy="40" r="22" fill="${s}" stroke="${sh}" stroke-width="1.2"/>
        <!-- Split arrow lines (Load Balancing Symbol) -->
        <path d="M 55,24 L 55,36" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 55,36 L 42,48 M 42,48 L 48,48 M 42,48 L 42,42" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 55,36 L 68,48 M 68,48 L 62,48 M 68,48 L 68,42" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Nodes centers -->
        <circle cx="55" cy="24" r="3.5" fill="${a}"/>
        <circle cx="42" cy="48" r="3" fill="${l}"/>
        <circle cx="68" cy="48" r="3" fill="${l}"/>
        <!-- Status Indicator LEDs -->
        <circle cx="16" cy="18" r="2.2" fill="${l}"/>
        <circle cx="24" cy="18" r="2.2" fill="#facc15"/>
      `;
    },
  },
  {
    type: 'dns',
    label: 'DNS Server',
    defaultSize: { width: 100, height: 100 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#3b82f6',
      accent: '#eff6ff',
      screen: '#1d4ed8',
      led: '#10b981',
      shadow: '#1e3a8a',
    },
    body: (t) => {
      const b = t.body ?? '#3b82f6';
      const a = t.accent ?? '#eff6ff';
      const s = t.screen ?? '#1d4ed8';
      const l = t.led ?? '#10b981';
      const sh = t.shadow ?? '#1e3a8a';
      return `
        <!-- Server casing -->
        <rect x="10" y="8" width="80" height="84" rx="4" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <!-- Front screen label panel -->
        <rect x="18" y="18" width="64" height="24" rx="2.5" fill="${s}" stroke="${sh}" stroke-width="1"/>
        <text x="50" y="35" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="13" fill="${a}">DNS</text>
        
        <!-- Drive racks / activity LEDs -->
        ${[0, 1, 2]
          .map(
            (i) => `
          <g transform="translate(0, ${i * 12})">
            <rect x="18" y="48" width="54" height="8" rx="1" fill="${a}" stroke="${sh}" stroke-width="0.6"/>
            <rect x="22" y="51" width="12" height="2" fill="${b}"/>
            <circle cx="80" cy="52" r="1.5" fill="${l}"/>
          </g>
        `
          )
          .join('')}
        
        <!-- General Server Status indicators -->
        <circle cx="22" cy="13" r="2" fill="${l}"/>
        <circle cx="28" cy="13" r="2" fill="#facc15"/>
      `;
    },
  },
  {
    type: 'vpn',
    label: 'VPN Gateway',
    defaultSize: { width: 120, height: 80 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#f59e0b',
      accent: '#ffffff',
      screen: '#78350f',
      led: '#10b981',
      shadow: '#d97706',
    },
    body: (t) => {
      const b = t.body ?? '#f59e0b';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#78350f';
      const l = t.led ?? '#10b981';
      const sh = t.shadow ?? '#d97706';
      return `
        <!-- Secure outer gateway chassis -->
        <rect x="8" y="14" width="104" height="52" rx="4" fill="${b}" stroke="${s}" stroke-width="2"/>
        <!-- Inner status shield -->
        <path d="M 20,24 L 46,24 L 46,40 Q 46,52 33,56 Q 20,52 20,40 Z" fill="${s}" stroke="${sh}" stroke-width="1.2"/>
        
        <!-- Padlock symbol (Secure VPN) -->
        <!-- Shackle -->
        <path d="M 72,28 L 72,34 M 82,28 L 82,34 A 5,5 0 0,0 72,28" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Lock body -->
        <rect x="68" y="34" width="18" height="15" rx="1.5" fill="${sh}" stroke="${s}" stroke-width="1"/>
        <circle cx="77" cy="40.5" r="1.5" fill="${a}"/>
        <line x1="77" y1="42" x2="77" y2="46" stroke="${a}" stroke-width="1.2"/>

        <!-- Connected tunnel path lines -->
        <path d="M 33,36 Q 50,42 66,36" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="3 3"/>
        <circle cx="16" cy="20" r="2.2" fill="${l}"/>
        <circle cx="24" cy="20" r="2.2" fill="${l}"/>
      `;
    },
  },
  {
    type: 'proxy',
    label: 'Proxy / Reverse',
    defaultSize: { width: 110, height: 90 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#8b5cf6',
      accent: '#ffffff',
      screen: '#4c1d95',
      led: '#10b981',
      shadow: '#a78bfa',
    },
    body: (t) => {
      const b = t.body ?? '#8b5cf6';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#4c1d95';
      const l = t.led ?? '#10b981';
      const sh = t.shadow ?? '#a78bfa';
      return `
        <!-- Proxy server casing -->
        <rect x="6" y="6" width="98" height="78" rx="4" fill="${b}" stroke="${s}" stroke-width="2"/>
        <!-- Intermediary security screen wall -->
        <rect x="47" y="16" width="16" height="58" fill="${s}" stroke="${sh}" stroke-width="1"/>
        
        <!-- Forwarding Traffic Arrows -->
        <!-- Inward traffic (Left to Screen) -->
        <path d="M 14,32 L 38,32 M 38,32 L 32,27 M 38,32 L 32,37" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Forwarded traffic (Screen to Right) -->
        <path d="M 64,48 L 88,48 M 88,48 L 82,43 M 88,48 L 82,53" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Text Symbol 'P' on the proxy wall -->
        <text x="55" y="48" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="12" fill="${a}">P</text>
        <circle cx="55" cy="62" r="2.5" fill="${l}"/>
        <circle cx="16" cy="14" r="2" fill="${l}"/>
      `;
    },
  },
  {
    type: 'monitoring',
    label: 'Monitoring',
    defaultSize: { width: 130, height: 90 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#1e293b',
      accent: '#22c55e',
      screen: '#0f172a',
      led: '#ef4444',
      shadow: '#475569',
    },
    body: (t) => {
      const b = t.body ?? '#1e293b';
      const a = t.accent ?? '#22c55e';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#ef4444';
      const sh = t.shadow ?? '#475569';
      return `
        <!-- Display frame -->
        <rect x="6" y="6" width="118" height="68" rx="4" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <!-- Diagnostic Screen -->
        <rect x="12" y="12" width="106" height="56" fill="${s}"/>
        
        <!-- Active graph grid lines -->
        <line x1="12" y1="40" x2="118" y2="40" stroke="${sh}" stroke-width="0.5" stroke-dasharray="2 2"/>
        <line x1="65" y1="12" x2="65" y2="68" stroke="${sh}" stroke-width="0.5" stroke-dasharray="2 2"/>
        
        <!-- Sine Wave / Diagnostics graph line -->
        <path d="M 16,56 Q 30,16 46,40 T 76,40 T 106,30" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Alarm thresholds / indicator light -->
        <circle cx="106" cy="20" r="3.5" fill="${l}"/>
        <circle cx="106" cy="20" r="1.5" fill="#ffffff"/>
        
        <!-- Stand mount base -->
        <rect x="50" y="74" width="30" height="6" fill="${sh}" stroke="${b}" stroke-width="0.8"/>
        <rect x="40" y="80" width="50" height="4" rx="1" fill="${b}"/>
      `;
    },
  },
  {
    type: 'web-server',
    label: 'Web Server',
    defaultSize: { width: 100, height: 100 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#eab308',
      accent: '#ffffff',
      screen: '#713f12',
      led: '#22c55e',
      shadow: '#ca8a04',
    },
    body: (t) => {
      const b = t.body ?? '#eab308';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#713f12';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#ca8a04';
      return `
        <!-- Circular network WWW server node -->
        <circle cx="50" cy="50" r="44" fill="${b}" stroke="${s}" stroke-width="2"/>
        <!-- Inner globe grid area -->
        <circle cx="50" cy="50" r="36" fill="${s}" stroke="${sh}" stroke-width="1"/>
        <ellipse cx="50" cy="50" rx="36" ry="12" fill="none" stroke="${sh}" stroke-width="0.8"/>
        <ellipse cx="50" cy="50" rx="12" ry="36" fill="none" stroke="${sh}" stroke-width="0.8"/>
        <line x1="14" y1="50" x2="86" y2="50" stroke="${sh}" stroke-width="0.8"/>
        
        <!-- Text label "WWW" -->
        <rect x="22" y="40" width="56" height="20" rx="3" fill="${b}" stroke="${a}" stroke-width="1.2"/>
        <text x="50" y="55" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="11" fill="${a}" letter-spacing="0.5">WWW</text>
        
        <!-- Connection status LED -->
        <circle cx="50" cy="22" r="2.5" fill="${l}"/>
      `;
    },
  },
  {
    type: 'mail-server',
    label: 'Mail Server',
    defaultSize: { width: 110, height: 85 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#ea580c',
      accent: '#ffffff',
      screen: '#431407',
      led: '#22c55e',
      shadow: '#f97316',
    },
    body: (t) => {
      const b = t.body ?? '#ea580c';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#431407';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#f97316';
      return `
        <!-- Mail server rack box -->
        <rect x="6" y="14" width="98" height="56" rx="4" fill="${b}" stroke="${s}" stroke-width="2"/>
        <!-- Inner display screen -->
        <rect x="14" y="24" width="82" height="36" rx="2" fill="${s}" stroke="${sh}" stroke-width="1.2"/>
        
        <!-- Mailing Envelope Icon -->
        <rect x="26" y="32" width="58" height="20" rx="1" fill="${b}" stroke="${a}" stroke-width="1"/>
        <path d="M26 32 L55 44 L84 32" fill="none" stroke="${a}" stroke-width="1.2"/>
        <circle cx="82" cy="20" r="2" fill="${l}"/>
        <circle cx="88" cy="20" r="2" fill="${l}"/>
      `;
    },
  },
  {
    type: 'app-server',
    label: 'App Server',
    defaultSize: { width: 100, height: 120 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#16a34a',
      accent: '#ffffff',
      screen: '#14532d',
      led: '#facc15',
      shadow: '#22c55e',
    },
    body: (t) => {
      const b = t.body ?? '#16a34a';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#14532d';
      const l = t.led ?? '#facc15';
      const sh = t.shadow ?? '#22c55e';
      return `
        <!-- Vertical app server tower -->
        <rect x="6" y="6" width="88" height="108" rx="5" fill="${b}" stroke="${s}" stroke-width="2"/>
        
        <!-- Application widgets slots -->
        ${[0, 1, 2]
          .map(
            (i) => `
          <g transform="translate(0, ${i * 26})">
            <rect x="14" y="14" width="72" height="20" rx="2" fill="${s}" stroke="${sh}" stroke-width="1"/>
            <!-- Coding brackets logo < > -->
            <path d="M 22,20 L 18,24 L 22,28 M 30,20 L 34,24 L 30,28" fill="none" stroke="${a}" stroke-width="1" stroke-linecap="round"/>
            <rect x="42" y="22" width="36" height="4" rx="0.5" fill="${sh}"/>
          </g>
        `
          )
          .join('')}
        
        <!-- Lower console panel status display -->
        <rect x="14" y="92" width="72" height="14" rx="2" fill="${s}" stroke="${sh}" stroke-width="0.8"/>
        <circle cx="22" cy="99" r="2" fill="${l}"/>
        <circle cx="30" cy="99" r="2" fill="${l}"/>
      `;
    },
  },
  {
    type: 'container',
    label: 'Container',
    defaultSize: { width: 85, height: 85 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0ea5e9',
      accent: '#e0f2fe',
      screen: '#0369a1',
      led: '#22c55e',
      shadow: '#0284c7',
    },
    body: (t) => {
      const b = t.body ?? '#0ea5e9';
      const a = t.accent ?? '#e0f2fe';
      const s = t.screen ?? '#0369a1';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#0284c7';
      return `
        <!-- 3D Isometric Docker-style Container box -->
        <!-- Front Left Facet -->
        <polygon points="42,6 74,22 74,62 42,78 10,62 10,22" fill="${b}" stroke="${s}" stroke-width="1.8" stroke-linejoin="round"/>
        <!-- Inner container walls / details -->
        <polygon points="42,18 64,29 64,56 42,67 20,56 20,29" fill="${sh}" stroke="${s}" stroke-width="1" opacity="0.6"/>
        <!-- Corrugation panel lines -->
        <line x1="42" y1="18" x2="42" y2="67" stroke="${s}" stroke-width="1.2" stroke-dasharray="2 3"/>
        <line x1="31" y1="23" x2="31" y2="61" stroke="${s}" stroke-width="0.8" opacity="0.7"/>
        <line x1="53" y1="23" x2="53" y2="61" stroke="${s}" stroke-width="0.8" opacity="0.7"/>
        
        <!-- Active Lock badge -->
        <rect x="34" y="32" width="16" height="12" rx="1.5" fill="${s}" stroke="${a}" stroke-width="0.6"/>
        <circle cx="42" cy="38" r="1.5" fill="${l}"/>
      `;
    },
  },
  {
    type: 'kubernetes',
    label: 'Kubernetes',
    defaultSize: { width: 100, height: 100 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#326ce5',
      accent: '#ffffff',
      screen: '#1d4ed8',
      led: '#10b981',
      shadow: '#93c5fd',
    },
    body: (t) => {
      const b = t.body ?? '#326ce5';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#1d4ed8';
      const l = t.led ?? '#10b981';
      const sh = t.shadow ?? '#93c5fd';
      return `
        <!-- Kubernetes Heptagonal outer frame -->
        <polygon points="50,4 94,26 94,74 50,96 6,74 6,26" fill="${b}" stroke="${s}" stroke-width="3" stroke-linejoin="round"/>
        <!-- Inner Heptagon badge -->
        <polygon points="50,16 82,32 82,68 50,84 18,68 18,32" fill="${s}" stroke="${sh}" stroke-width="1.5"/>
        
        <!-- Core wheel nodes topology -->
        <circle cx="50" cy="38" r="9" fill="${a}" stroke="${s}" stroke-width="1.5"/>
        <circle cx="34" cy="56" r="7" fill="${sh}" stroke="${s}" stroke-width="1.2"/>
        <circle cx="66" cy="56" r="7" fill="${sh}" stroke="${s}" stroke-width="1.2"/>
        <circle cx="50" cy="72" r="7" fill="${l}" stroke="${s}" stroke-width="1.2"/>
        
        <!-- Linking spokes -->
        <line x1="50" y1="38" x2="34" y2="56" stroke="${s}" stroke-width="1.8"/>
        <line x1="50" y1="38" x2="66" y2="56" stroke="${s}" stroke-width="1.8"/>
        <line x1="34" y1="56" x2="50" y2="72" stroke="${s}" stroke-width="1.5"/>
        <line x1="66" y1="56" x2="50" y2="72" stroke="${s}" stroke-width="1.5"/>
      `;
    },
  },
  {
    type: 'storage',
    label: 'Storage / NAS',
    defaultSize: { width: 120, height: 80 },
    defaultStyle: { fill: '#ffffff', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#475569',
      accent: '#e2e8f0',
      screen: '#0f172a',
      led: '#22c55e',
      shadow: '#94a3b8',
    },
    body: (t) => {
      const b = t.body ?? '#475569';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#94a3b8';
      return `
        <!-- Outer storage shelf frame -->
        <rect x="6" y="8" width="108" height="64" rx="4" fill="${b}" stroke="${s}" stroke-width="2"/>
        
        <!-- Drive Bays (4 disk shelves) -->
        ${[0, 1, 2, 3]
          .map(
            (i) => `
          <g transform="translate(0, ${i * 14})">
            <rect x="12" y="14" width="96" height="10" rx="1" fill="${s}" stroke="${sh}" stroke-width="0.8"/>
            <!-- Disk drive tray slot vertical segments -->
            ${Array.from({ length: 6 })
              .map(
                (_, c) =>
                  `<line x1="${24 + c * 10}" y1="14" x2="${24 + c * 10}" y2="24" stroke="${b}" stroke-width="0.8"/>`
              )
              .join('')}
            <!-- Disk activity LEDs -->
            <circle cx="88" cy="19" r="1" fill="${l}"/>
            <circle cx="94" cy="19" r="1" fill="${l}"/>
            <!-- Lock keyhole -->
            <circle cx="16" cy="19" r="1.2" fill="${sh}"/>
          </g>
        `
          )
          .join('')}
      `;
    },
  },
  {
    type: 'antenna',
    label: 'Antenna',
    defaultSize: { width: 60, height: 100 },
    defaultStyle: { fill: 'transparent', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#475569',
      accent: '#8b5cf6',
      screen: '#0f172a',
      led: '#ef4444',
      shadow: '#64748b',
    },
    body: (t) => {
      const b = t.body ?? '#475569';
      const a = t.accent ?? '#8b5cf6';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#ef4444';
      const sh = t.shadow ?? '#64748b';
      return `
        <!-- Main mast support brackets -->
        <line x1="30" y1="14" x2="30" y2="86" stroke="${b}" stroke-width="3"/>
        <line x1="30" y1="36" x2="16" y2="86" stroke="${sh}" stroke-width="1.8"/>
        <line x1="30" y1="36" x2="44" y2="86" stroke="${sh}" stroke-width="1.8"/>
        <line x1="22" y1="60" x2="38" y2="60" stroke="${sh}" stroke-width="1.5"/>
        
        <!-- Signal wave arcs -->
        <path d="M 12,34 Q 30,22 48,34" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 6,48 Q 30,30 54,48" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round"/>
        <path d="M 2,62 Q 30,38 58,62" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 2"/>
        
        <!-- Top red blinking hazard beacon -->
        <circle cx="30" cy="14" r="4.5" fill="${l}"/>
        <circle cx="30" cy="14" r="1.5" fill="#ffffff"/>
        
        <!-- Base unit box -->
        <rect x="18" y="84" width="24" height="12" rx="1.5" fill="${s}" stroke="${b}" stroke-width="1.5"/>
        <circle cx="24" cy="90" r="1.5" fill="${l}"/>
      `;
    },
  },
  {
    type: 'user',
    label: 'User / Client',
    defaultSize: { width: 70, height: 90 },
    defaultStyle: { fill: '#eff6ff', stroke: '#1d4ed8', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#2563eb',
      accent: '#ffffff',
      screen: '#1d4ed8',
      led: '#22c55e',
      shadow: '#dbeafe',
    },
    body: (t) => {
      const b = t.body ?? '#2563eb';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#1d4ed8';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#dbeafe';
      return `
        <!-- User shoulder silhouette -->
        <path d="M8 84 Q8 52 35 52 Q62 52 62 84 Z" fill="${sh}" stroke="${b}" stroke-width="2.2"/>
        <!-- Head silhouette -->
        <circle cx="35" cy="26" r="16" fill="${sh}" stroke="${b}" stroke-width="2.2"/>
        <!-- Neck tie / collar symbol -->
        <path d="M30 52 L35 62 L40 52 Z" fill="${b}"/>
        
        <!-- Status indicator (Online) -->
        <circle cx="56" cy="74" r="7.5" fill="${s}" stroke="${a}" stroke-width="1"/>
        <circle cx="56" cy="74" r="4.5" fill="${l}"/>
      `;
    },
  },
  {
    type: 'group-users',
    label: 'Group',
    defaultSize: { width: 110, height: 80 },
    defaultStyle: { fill: '#eff6ff', stroke: '#1d4ed8', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#2563eb',
      accent: '#ffffff',
      screen: '#1d4ed8',
      led: '#22c55e',
      shadow: '#93c5fd',
    },
    body: (t) => {
      const b = t.body ?? '#2563eb';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#1d4ed8';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#93c5fd';
      return `
        <!-- Back left user -->
        <circle cx="28" cy="24" r="10" fill="${sh}" stroke="${b}" stroke-width="1.2"/>
        <path d="M8 68 Q8 44 28 44 Q48 44 48 68 Z" fill="${sh}" stroke="${b}" stroke-width="1.2"/>
        
        <!-- Back right user -->
        <circle cx="82" cy="24" r="10" fill="${sh}" stroke="${b}" stroke-width="1.2"/>
        <path d="M62 68 Q62 44 82 44 Q102 44 102 68 Z" fill="${sh}" stroke="${b}" stroke-width="1.2"/>
        
        <!-- Forefront primary user -->
        <circle cx="55" cy="22" r="12" fill="${a}" stroke="${s}" stroke-width="1.8"/>
        <path d="M30 68 Q30 40 55 40 Q80 40 80 68 Z" fill="${b}" stroke="${s}" stroke-width="1.8"/>
        <circle cx="78" cy="62" r="5" fill="${s}"/>
        <circle cx="78" cy="62" r="2.5" fill="${l}"/>
      `;
    },
  },
  {
    type: 'smartphone',
    label: 'Smartphone',
    defaultSize: { width: 50, height: 90 },
    defaultStyle: { fill: '#1e293b', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0f172a',
      accent: '#38bdf8',
      screen: '#1e293b',
      led: '#22c55e',
      shadow: '#475569',
    },
    body: (t) => {
      const b = t.body ?? '#0f172a';
      const a = t.accent ?? '#38bdf8';
      const s = t.screen ?? '#1e293b';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#475569';
      return `
        <rect x="4" y="4" width="42" height="82" rx="7" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <rect x="18" y="8" width="14" height="3" rx="1.5" fill="${sh}"/>
        <circle cx="36" cy="9.5" r="0.8" fill="${l}"/>
        
        <rect x="8" y="15" width="34" height="58" rx="2" fill="${s}" stroke="${sh}" stroke-width="0.6"/>
        <rect x="12" y="19" width="8" height="2" rx="0.5" fill="${a}"/>
        <circle cx="38" cy="20" r="1.5" fill="${l}"/>
        <!-- Small settings wheel outline on screen -->
        <circle cx="25" cy="44" r="8" fill="none" stroke="${a}" stroke-width="1.2"/>
        <circle cx="25" cy="44" r="3" fill="${a}"/>
        
        <circle cx="25" cy="79" r="3" fill="none" stroke="${sh}" stroke-width="1"/>
      `;
    },
  },
  {
    type: 'tablet',
    label: 'Tablet',
    defaultSize: { width: 80, height: 110 },
    defaultStyle: { fill: '#1e293b', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0f172a',
      accent: '#a855f7',
      screen: '#1e293b',
      led: '#22c55e',
      shadow: '#475569',
    },
    body: (t) => {
      const b = t.body ?? '#0f172a';
      const a = t.accent ?? '#a855f7';
      const s = t.screen ?? '#1e293b';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#475569';
      return `
        <rect x="5" y="4" width="70" height="102" rx="8" fill="${b}" stroke="${sh}" stroke-width="2"/>
        <circle cx="40" cy="9" r="1.2" fill="${l}"/>
        
        <rect x="10" y="16" width="60" height="78" rx="2" fill="${s}" stroke="${sh}" stroke-width="0.8"/>
        <!-- Charts layout on screen -->
        <rect x="16" y="24" width="22" height="16" rx="1" fill="${a}" fill-opacity="0.15" stroke="${a}" stroke-width="0.6"/>
        <rect x="42" y="24" width="22" height="16" rx="1" fill="${sh}" fill-opacity="0.15" stroke="${sh}" stroke-width="0.6"/>
        <rect x="16" y="46" width="48" height="36" rx="1.5" fill="${s}" stroke="${a}" stroke-width="1"/>
        <polyline points="22,76 34,60 46,68 58,54" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        
        <circle cx="40" cy="99" r="3.5" fill="none" stroke="${sh}" stroke-width="1"/>
      `;
    },
  },
  {
    type: 'voip-phone',
    label: 'VoIP Phone',
    defaultSize: { width: 100, height: 120 },
    defaultStyle: { fill: '#f8fafc', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#334155',
      accent: '#ffffff',
      screen: '#0ea5e9',
      led: '#22c55e',
      shadow: '#1e293b',
    },
    body: (t) => {
      const b = t.body ?? '#334155';
      const a = t.accent ?? '#ffffff';
      const s = t.screen ?? '#0ea5e9';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#1e293b';
      return `
        <!-- Phone base chassis -->
        <rect x="6" y="6" width="88" height="108" rx="6" fill="${b}" stroke="${sh}" stroke-width="2"/>
        
        <!-- Dial pad matrix buttons -->
        ${Array.from({ length: 12 })
          .map(
            (_, i) => `
          <rect x="${14 + (i % 3) * 16}" y="${66 + Math.floor(i / 3) * 11}" width="11" height="7" rx="1" fill="${a}" stroke="${sh}" stroke-width="0.6"/>
        `
          )
          .join('')}
        
        <!-- Active display screen -->
        <rect x="12" y="14" width="46" height="34" rx="2" fill="${s}" stroke="${sh}" stroke-width="1"/>
        <!-- Text overlay on screen -->
        <rect x="16" y="18" width="22" height="4" fill="${a}"/>
        <rect x="16" y="25" width="30" height="3" fill="${a}" opacity="0.6"/>
        <rect x="16" y="30" width="14" height="3" fill="${l}"/>
        <circle cx="48" cy="40" r="2.5" fill="${l}"/>

        <!-- Handset hook and receiver case (left side) -->
        <rect x="66" y="14" width="22" height="92" rx="8" fill="${sh}" stroke="${b}" stroke-width="2.5"/>
        <rect x="70" y="24" width="14" height="20" rx="3" fill="${b}"/>
        <rect x="70" y="72" width="14" height="20" rx="3" fill="${b}"/>
        <!-- Coiled cord visual -->
        <path d="M 62,88 Q 54,98 68,104" fill="none" stroke="${sh}" stroke-width="2.5" stroke-linecap="round"/>
      `;
    },
  },
  {
    type: 'iot',
    label: 'IoT Device',
    defaultSize: { width: 90, height: 90 },
    defaultStyle: { fill: '#ffffff', stroke: '#0e7490', strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#0891b2',
      accent: '#e2e8f0',
      screen: '#155e75',
      led: '#22c55e',
      shadow: '#facc15',
    },
    body: (t) => {
      const b = t.body ?? '#0891b2';
      const a = t.accent ?? '#e2e8f0';
      const s = t.screen ?? '#155e75';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#facc15';
      return `
        <!-- IoT Industrial box -->
        <rect x="10" y="14" width="70" height="70" rx="8" fill="${b}" stroke="${s}" stroke-width="2"/>
        <!-- Embedded PCB Circuit screen -->
        <rect x="18" y="22" width="54" height="54" rx="4" fill="${s}" stroke="${a}" stroke-width="1.2"/>
        
        <!-- Center integrated circuit (microchip) -->
        <rect x="36" y="40" width="18" height="18" rx="2" fill="${b}" stroke="${sh}" stroke-width="1"/>
        <!-- Pins of the chip -->
        ${Array.from({ length: 4 })
          .map(
            (_, i) =>
              `<line x1="${39 + i * 4}" y1="36" x2="${39 + i * 4}" y2="40" stroke="${a}" stroke-width="1"/>`
          )
          .join('')}
        ${Array.from({ length: 4 })
          .map(
            (_, i) =>
              `<line x1="${39 + i * 4}" y1="58" x2="${39 + i * 4}" y2="62" stroke="${a}" stroke-width="1"/>`
          )
          .join('')}
        
        <!-- Traces linking nodes -->
        <path d="M 24,30 L 36,44 M 66,30 L 54,44 M 24,68 L 36,54 M 66,68 L 54,54" fill="none" stroke="${sh}" stroke-width="0.8"/>
        <circle cx="24" cy="30" r="1.5" fill="${sh}"/>
        <circle cx="66" cy="30" r="1.5" fill="${sh}"/>
        <circle cx="24" cy="68" r="1.5" fill="${sh}"/>
        <circle cx="66" cy="68" r="1.5" fill="${sh}"/>

        <!-- Antenna stubs -->
        <line x1="45" y1="14" x2="45" y2="4" stroke="${s}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="45" cy="4" r="2" fill="${l}"/>
      `;
    },
  },
  {
    type: 'solar',
    label: 'Solar Panel',
    defaultSize: { width: 110, height: 75 },
    defaultStyle: { fill: '#1e3a8a', stroke: defaultStroke, strokeWidth: 1.5 },
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: '#1e3a8a',
      accent: '#e2e8f0',
      screen: '#0f172a',
      led: '#22c55e',
      shadow: '#3b82f6',
    },
    body: (t) => {
      const b = t.body ?? '#1e3a8a';
      const a = t.accent ?? '#e2e8f0';
      const s = t.screen ?? '#0f172a';
      const l = t.led ?? '#22c55e';
      const sh = t.shadow ?? '#3b82f6';
      return `
        <!-- PV Solar Panel primary array frame -->
        <rect x="6" y="8" width="98" height="50" rx="3" fill="${s}" stroke="${a}" stroke-width="2.5"/>
        
        <!-- Individual photovoltaic cells grid (2 rows of 4 cells) -->
        ${Array.from({ length: 2 })
          .map((_, r) =>
            Array.from({ length: 4 })
              .map(
                (_, c) => `
            <rect x="${11 + c * 22}" y="${12 + r * 22}" width="20" height="20" fill="${b}" stroke="${a}" stroke-width="0.8"/>
            <path d="M ${11 + c * 22}, ${12 + r * 22} L ${31 + c * 22}, ${32 + r * 22}" fill="none" stroke="${sh}" stroke-width="0.5" opacity="0.3"/>
          `
              )
              .join('')
          )
          .join('')}
        
        <!-- Mounting structure pole / base -->
        <line x1="55" y1="58" x2="55" y2="68" stroke="${a}" stroke-width="3.5"/>
        <line x1="35" y1="68" x2="75" y2="68" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="55" cy="58" r="2.5" fill="${l}"/>
      `;
    },
  },
];

function makeExtNetworkPlugin(cfg: ExtIconConfig): ShapePlugin {
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
        color !== '#10b981' &&
        color !== '#3b82f6' &&
        color !== '#f59e0b' &&
        color !== '#8b5cf6' &&
        color !== '#326ce5' &&
        color !== '#0891b2'
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
  };
}

export const extNetworkPlugins: ShapePlugin[] = extIcons.map(makeExtNetworkPlugin);
