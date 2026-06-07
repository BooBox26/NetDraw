// Monochrome gradient shapes.
// Each sub-element of the shape is colorable independently via the
// `colorSlots` system. The shape is rendered as an SVG `<defs>` + content
// where each path/rect uses the corresponding slot color. Users can also
// apply a multi-stop gradient (linear or radial) that tints the body.

import type { ShapePlugin, ColorSlot } from './types';

const THEME_KEYS = ['body', 'accent', 'screen', 'led', 'shadow'] as const;

const DEFAULT_THEME = {
  body: '#ffffff',
  accent: '#1e293b',
  screen: '#f1f5f9',
  led: '#475569',
  shadow: '#cbd5e1',
};

function slot(id: (typeof THEME_KEYS)[number], label: string, group: string) {
  return { id, label, default: DEFAULT_THEME[id], target: 'fill' as const, group };
}

const MONOCHROME_SLOTS: ColorSlot[] = [
  slot('body', 'Body / Base Fill', 'Surfaces'),
  slot('accent', 'Accent / Symbols', 'Surfaces'),
  slot('screen', 'Faceplate / Screen', 'Display'),
  slot('led', 'LED Indicators', 'Status'),
  slot('shadow', 'Highlights / Shadows', 'Surfaces'),
];

/** Build the SVG <defs> gradient block if the shape has a gradient. */
function gradientDefs(s: {
  style: {
    fill?: string;
    gradient?: {
      type: 'linear' | 'radial';
      stops: Array<{ offset: number; color: string }>;
      angle?: number;
    };
  };
}): string {
  const g = s.style.gradient;
  if (!g) return '';
  const stopsXml = g.stops
    .map((s) => `<stop offset="${(s.offset * 100).toFixed(1)}%" stop-color="${s.color}"/>`)
    .join('');
  if (g.type === 'radial') {
    return `<defs><radialGradient id="g-${s.style.fill ?? 'g'}-${Math.round(Math.random() * 1e6)}" cx="50%" cy="50%" r="65%">${stopsXml}</radialGradient></defs>`;
  }
  const angle = g.angle ?? 90;
  const rad = (angle * Math.PI) / 180;
  const x1 = 50 - 50 * Math.cos(rad);
  const y1 = 50 - 50 * Math.sin(rad);
  const x2 = 50 + 50 * Math.cos(rad);
  const y2 = 50 + 50 * Math.sin(rad);
  return `<defs><linearGradient id="g-${s.style.fill ?? 'g'}-${Math.round(Math.random() * 1e6)}" x1="${x1.toFixed(1)}%" y1="${y1.toFixed(1)}%" x2="${x2.toFixed(1)}%" y2="${y2.toFixed(1)}%">${stopsXml}</linearGradient></defs>`;
}

function makeMonoPlugin(cfg: {
  type: string;
  label: string;
  defaultSize: { width: number; height: number };
  defaultStyle: { fill: string; stroke: string; strokeWidth: number };
  body: (theme: Record<string, string>) => string;
}): ShapePlugin {
  return {
    type: cfg.type,
    category: 'monochrome',
    label: cfg.label,
    defaultStyle: {
      ...cfg.defaultStyle,
      theme: { ...DEFAULT_THEME },
    },
    defaultSize: cfg.defaultSize,
    colorSlots: MONOCHROME_SLOTS,
    defaultTheme: { ...DEFAULT_THEME },
    preview: (color = cfg.defaultStyle.stroke) => {
      const theme = { ...DEFAULT_THEME };
      if (color && color !== '#1f2937') {
        theme.accent = color;
      }
      const scale = 24 / Math.max(cfg.defaultSize.width, cfg.defaultSize.height);
      const w = cfg.defaultSize.width * scale;
      const h = cfg.defaultSize.height * scale;
      const offX = (24 - w) / 2;
      const offY = (24 - h) / 2;
      return `<g transform="translate(${offX} ${offY}) scale(${scale})">${cfg.body(theme)}</g>`;
    },
    renderBody: (s) => {
      const theme = s.style.theme ?? DEFAULT_THEME;

      const bodyFill = s.style.gradient
        ? `url(#g-${s.style.fill ?? 'g'}-${Math.round(Math.random() * 1e6)})`
        : (theme.body ?? DEFAULT_THEME.body);
      const defs = gradientDefs(s);

      const themeWithGradient = { ...theme, body: bodyFill };

      const sx = s.width / cfg.defaultSize.width;
      const sy = s.height / cfg.defaultSize.height;

      return `${defs}<g transform="scale(${sx} ${sy})" opacity="${s.style.opacity}">${cfg.body(themeWithGradient)}</g>`;
    },
  };
}

export const monoRouterPlugin = makeMonoPlugin({
  type: 'mono-router',
  label: 'Router (M)',
  defaultSize: { width: 100, height: 100 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <circle cx="50" cy="50" r="46" fill="${b}" stroke="${a}" stroke-width="2"/>
      <circle cx="50" cy="50" r="41" fill="none" stroke="${sh}" stroke-width="1.2" stroke-dasharray="2 3"/>
      <circle cx="50" cy="50" r="14" fill="${s}" stroke="${a}" stroke-width="1.5"/>
      <path d="M 50,4 L 50,26 M 46,14 L 50,4 M 54,14 L 50,4" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 50,74 L 50,96 M 45,86 L 50,96 M 55,86 L 50,96" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 4,50 L 26,50 M 14,46 L 4,50 M 14,54 L 4,50" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 74,50 L 96,50 M 86,45 L 96,50 M 86,55 L 96,50" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="34" cy="34" r="2.5" fill="${l}"/>
      <circle cx="66" cy="34" r="2.5" fill="${l}"/>
      <circle cx="34" cy="66" r="2.5" fill="${l}"/>
      <circle cx="66" cy="66" r="2.5" fill="${sh}"/>
    `;
  },
});

export const monoSwitchPlugin = makeMonoPlugin({
  type: 'mono-switch',
  label: 'Switch (M)',
  defaultSize: { width: 120, height: 60 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <rect x="3" y="6" width="114" height="48" rx="4" fill="${b}" stroke="${a}" stroke-width="1.8"/>
      <rect x="8" y="24" width="104" height="24" rx="2" fill="${s}" stroke="${sh}" stroke-width="1"/>
      ${Array.from({ length: 6 })
        .map(
          (_, i) => `
        <rect x="${14 + i * 14}" y="27" width="8" height="7" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.5"/>
        <circle cx="${18 + i * 14}" cy="37" r="1" fill="${l}"/>
        <rect x="${14 + i * 14}" y="38" width="8" height="7" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.5"/>
        <circle cx="${18 + i * 14}" cy="47" r="1" fill="${l}"/>
      `
        )
        .join('')}
      <rect x="98" y="27" width="5" height="8" rx="0.5" fill="${sh}"/>
      <rect x="104" y="27" width="5" height="8" rx="0.5" fill="${sh}"/>
      <path d="M 15,15 L 35,15 M 35,15 L 30,12 M 35,15 L 30,18" fill="none" stroke="${a}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 45,15 L 25,15 M 25,15 L 30,12 M 25,15 L 30,18" fill="none" stroke="${a}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  },
});

export const monoFirewallPlugin = makeMonoPlugin({
  type: 'mono-firewall',
  label: 'Firewall (M)',
  defaultSize: { width: 100, height: 100 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <path d="M 50,4 L 92,16 L 92,60 Q 92,90 50,96 Q 8,90 8,60 L 8,16 Z" fill="${b}" stroke="${a}" stroke-width="2.5" stroke-linejoin="round"/>
      <g stroke="${a}" stroke-width="1">
        <rect x="22" y="24" width="26" height="10" fill="${sh}"/>
        <rect x="52" y="24" width="26" height="10" fill="${s}"/>
        <rect x="16" y="37" width="14" height="10" fill="${s}"/>
        <rect x="34" y="37" width="32" height="10" fill="${sh}"/>
        <rect x="70" y="37" width="14" height="10" fill="${s}"/>
        <rect x="22" y="50" width="26" height="10" fill="${s}"/>
        <rect x="52" y="50" width="26" height="10" fill="${sh}"/>
        <rect x="18" y="63" width="18" height="10" fill="${sh}"/>
        <rect x="40" y="63" width="20" height="10" fill="${s}"/>
        <rect x="64" y="63" width="18" height="10" fill="${sh}"/>
      </g>
      <circle cx="50" cy="14" r="3.5" fill="${l}"/>
    `;
  },
});

export const monoServerPlugin = makeMonoPlugin({
  type: 'mono-server',
  label: 'Server (M)',
  defaultSize: { width: 100, height: 110 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <rect x="8" y="4" width="84" height="102" rx="4" fill="${b}" stroke="${a}" stroke-width="1.8"/>
      <rect x="2" y="12" width="6" height="24" rx="1.5" fill="${sh}" stroke="${a}" stroke-width="1"/>
      <rect x="92" y="12" width="6" height="24" rx="1.5" fill="${sh}" stroke="${a}" stroke-width="1"/>
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
    `;
  },
});

export const monoCloudPlugin = makeMonoPlugin({
  type: 'mono-cloud',
  label: 'Cloud (M)',
  defaultSize: { width: 130, height: 80 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <path d="M26 62 Q6 62 6 48 Q6 34 26 36 Q30 18 50 18 Q70 18 72 36 Q90 34 96 48 Q102 62 82 62 Z" fill="${b}" stroke="${a}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M30 54 Q18 54 18 44 Q18 36 30 38 Q34 26 48 26 Q62 26 64 38 Q78 36 82 44" fill="none" stroke="${sh}" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <circle cx="50" cy="48" r="3" fill="${l}"/>
    `;
  },
});

export const monoDatabasePlugin = makeMonoPlugin({
  type: 'mono-database',
  label: 'Database (M)',
  defaultSize: { width: 90, height: 110 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <path d="M 8,76 L 8,92 C 8,102 82,102 82,92 L 82,76" fill="${b}" stroke="${a}" stroke-width="2"/>
      <ellipse cx="45" cy="92" rx="37" ry="10" fill="none" stroke="${sh}" stroke-width="1.2" opacity="0.4"/>
      <ellipse cx="45" cy="76" rx="37" ry="10" fill="${s}" stroke="${a}" stroke-width="2"/>
      <circle cx="20" cy="84" r="2" fill="${l}"/>
      <path d="M 8,46 L 8,62 C 8,72 82,72 82,62 L 82,46" fill="${b}" stroke="${a}" stroke-width="2"/>
      <ellipse cx="45" cy="62" rx="37" ry="10" fill="none" stroke="${sh}" stroke-width="1.2" opacity="0.4"/>
      <ellipse cx="45" cy="76" rx="37" ry="10" fill="${s}" stroke="${a}" stroke-width="2"/>
      <circle cx="20" cy="54" r="2" fill="${l}"/>
      <path d="M 8,16 L 8,32 C 8,42 82,42 82,32 L 82,16" fill="${b}" stroke="${a}" stroke-width="2"/>
      <ellipse cx="45" cy="32" rx="37" ry="10" fill="none" stroke="${sh}" stroke-width="1.2" opacity="0.4"/>
      <ellipse cx="45" cy="16" rx="37" ry="10" fill="${s}" stroke="${a}" stroke-width="2"/>
      <circle cx="20" cy="24" r="2" fill="${l}"/>
    `;
  },
});

export const monoWorkstationPlugin = makeMonoPlugin({
  type: 'mono-workstation',
  label: 'Workstation (M)',
  defaultSize: { width: 110, height: 95 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <rect x="6" y="6" width="76" height="52" rx="4" fill="${b}" stroke="${a}" stroke-width="1.8"/>
      <rect x="11" y="11" width="66" height="42" rx="1" fill="${s}"/>
      <path d="M 38,58 L 50,58 L 54,74 L 34,74 Z" fill="${sh}" stroke="${a}" stroke-width="1"/>
      <rect x="28" y="72" width="32" height="4" rx="1" fill="${b}" stroke="${a}" stroke-width="1"/>
      <rect x="88" y="16" width="18" height="60" rx="2" fill="${s}" stroke="${a}" stroke-width="1.5"/>
      <circle cx="94" cy="70" r="2" fill="${l}"/>
      <rect x="16" y="82" width="56" height="4" rx="1" fill="${s}"/>
      <ellipse cx="80" cy="84" rx="2.5" ry="3.5" fill="${b}"/>
    `;
  },
});

export const monoLaptopPlugin = makeMonoPlugin({
  type: 'mono-laptop',
  label: 'Laptop (M)',
  defaultSize: { width: 110, height: 75 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <rect x="18" y="8" width="74" height="46" rx="4" fill="${b}" stroke="${a}" stroke-width="1.8"/>
      <rect x="22" y="12" width="66" height="38" rx="1.5" fill="${s}"/>
      <path d="M 28,42 L 44,28 L 56,36 L 76,22" fill="none" stroke="${sh}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="76" cy="22" r="1.5" fill="${l}"/>
      <circle cx="22" cy="12" r="1" fill="${l}"/>
      <path d="M 6,54 L 104,54 L 98,66 L 12,66 Z" fill="${sh}" stroke="${a}" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="18,56 92,56 89,61 21,61" fill="${s}"/>
      <rect x="47" y="62" width="16" height="3" rx="0.5" fill="${b}"/>
      <circle cx="10" cy="60" r="1.2" fill="${l}"/>
    `;
  },
});

export const monoPhonePlugin = makeMonoPlugin({
  type: 'mono-phone',
  label: 'Phone (M)',
  defaultSize: { width: 60, height: 100 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoPrinterPlugin = makeMonoPlugin({
  type: 'mono-printer',
  label: 'Printer (M)',
  defaultSize: { width: 110, height: 90 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoWifiPlugin = makeMonoPlugin({
  type: 'mono-wifi',
  label: 'Wi-Fi (M)',
  defaultSize: { width: 100, height: 100 },
  defaultStyle: { fill: 'transparent', stroke: '#1f2937', strokeWidth: 1.8 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <circle cx="50" cy="84" r="6" fill="${b}" stroke="${s}" stroke-width="1.5"/>
      <circle cx="50" cy="84" r="2" fill="${l}"/>
      <path d="M 38,72 A 16 16 0 0 1 62,72" fill="none" stroke="${b}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M 28,60 A 32 32 0 0 1 72,60" fill="none" stroke="${sh}" stroke-width="4" stroke-linecap="round"/>
      <path d="M 18,48 A 48 48 0 0 1 82,48" fill="none" stroke="${b}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M 8,36 A 64 64 0 0 1 92,36" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 4"/>
    `;
  },
});

export const monoInternetPlugin = makeMonoPlugin({
  type: 'mono-internet',
  label: 'Internet (M)',
  defaultSize: { width: 110, height: 110 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoAccessPointPlugin = makeMonoPlugin({
  type: 'mono-access-point',
  label: 'Access Point (M)',
  defaultSize: { width: 110, height: 100 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoCameraPlugin = makeMonoPlugin({
  type: 'mono-camera',
  label: 'IP Camera (M)',
  defaultSize: { width: 100, height: 75 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoOntPlugin = makeMonoPlugin({
  type: 'mono-ont',
  label: 'ONT / Modem (M)',
  defaultSize: { width: 100, height: 60 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoOltPlugin = makeMonoPlugin({
  type: 'mono-olt',
  label: 'OLT (M)',
  defaultSize: { width: 140, height: 80 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoLanPlugin = makeMonoPlugin({
  type: 'mono-lan',
  label: 'LAN (M)',
  defaultSize: { width: 120, height: 80 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoWanPlugin = makeMonoPlugin({
  type: 'mono-wan',
  label: 'WAN (M)',
  defaultSize: { width: 120, height: 80 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoTvPlugin = makeMonoPlugin({
  type: 'mono-tv',
  label: 'TV / Display (M)',
  defaultSize: { width: 130, height: 85 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
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
});

export const monoOpticalSplitterPlugin = makeMonoPlugin({
  type: 'mono-optical-splitter',
  label: 'Optical Splitter (M)',
  defaultSize: { width: 100, height: 75 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <!-- Main splitter enclosure -->
      <rect x="6" y="6" width="88" height="63" rx="4" fill="${s}" stroke="${a}" stroke-width="2"/>
      
      <!-- Input Port on the Left -->
      <rect x="2" y="32" width="10" height="10" rx="1" fill="${sh}" stroke="${a}" stroke-width="1"/>
      <line x1="0" y1="37" x2="20" y2="37" stroke="${l}" stroke-width="1.8"/>
      <circle cx="12" cy="37" r="2.5" fill="${b}" stroke="${a}" stroke-width="0.8"/>
      
      <!-- Internal Prism/Splitting Chamber -->
      <polygon points="30,37 50,22 50,52" fill="${sh}" fill-opacity="0.3" stroke="${a}" stroke-width="1.2"/>
      <circle cx="35" cy="37" r="3" fill="${l}"/>
      
      <!-- Branching laser guides -->
      <path d="M 35,37 L 50,25 L 75,18" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 1"/>
      <path d="M 35,37 L 50,33 L 75,30" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 1"/>
      <path d="M 35,37 L 50,41 L 75,44" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 1"/>
      <path d="M 35,37 L 50,49 L 75,56" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 1"/>
      
      <!-- Output coupling modules -->
      <rect x="70" y="12" width="12" height="10" rx="1" fill="${sh}" stroke="${a}" stroke-width="0.8"/>
      <rect x="70" y="25" width="12" height="10" rx="1" fill="${sh}" stroke="${a}" stroke-width="0.8"/>
      <rect x="70" y="39" width="12" height="10" rx="1" fill="${sh}" stroke="${a}" stroke-width="0.8"/>
      <rect x="70" y="52" width="12" height="10" rx="1" fill="${sh}" stroke="${a}" stroke-width="0.8"/>
      
      <!-- Output Fibers -->
      <line x1="82" y1="17" x2="100" y2="17" stroke="${l}" stroke-width="1.2"/>
      <line x1="82" y1="30" x2="100" y2="30" stroke="${l}" stroke-width="1.2"/>
      <line x1="82" y1="44" x2="100" y2="44" stroke="${l}" stroke-width="1.2"/>
      <line x1="82" y1="57" x2="100" y2="57" stroke="${l}" stroke-width="1.2"/>
      
      <!-- Labels / Standard Text inside the box -->
      <text x="56" y="39" font-family="monospace" font-size="7" font-weight="bold" fill="${b}" text-anchor="middle">1:4</text>
    `;
  },
});

export const monoOpticalSpliceClosurePlugin = makeMonoPlugin({
  type: 'mono-optical-splice-closure',
  label: 'Optical Splice Closure (M)',
  defaultSize: { width: 100, height: 60 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <!-- Closure cylindrical body -->
      <rect x="15" y="10" width="70" height="40" rx="10" fill="${s}" stroke="${a}" stroke-width="2.5"/>
      
      <!-- Structural ribbed reinforcement -->
      <line x1="28" y1="10" x2="28" y2="50" stroke="${a}" stroke-width="2"/>
      <line x1="40" y1="10" x2="40" y2="50" stroke="${a}" stroke-width="2"/>
      <line x1="50" y1="10" x2="50" y2="50" stroke="${a}" stroke-width="2"/>
      <line x1="60" y1="10" x2="60" y2="50" stroke="${a}" stroke-width="2"/>
      <line x1="72" y1="10" x2="72" y2="50" stroke="${a}" stroke-width="2"/>
      
      <!-- Cable entry ports/glands on left and right -->
      <rect x="5" y="16" width="10" height="10" rx="1" fill="${sh}" stroke="${a}" stroke-width="1"/>
      <rect x="5" y="34" width="10" height="10" rx="1" fill="${sh}" stroke="${a}" stroke-width="1"/>
      <rect x="85" y="25" width="10" height="10" rx="1" fill="${sh}" stroke="${a}" stroke-width="1"/>
      
      <!-- Fibers entering and exiting -->
      <path d="M 0,21 H 10 Q 15,21 20,25" fill="none" stroke="${sh}" stroke-width="1.5"/>
      <path d="M 0,39 H 10 Q 15,39 20,35" fill="none" stroke="${sh}" stroke-width="1.5"/>
      <path d="M 90,30 H 100" fill="none" stroke="${sh}" stroke-width="1.5"/>
      
      <!-- Splice Organizer tray visualization inside the closure (transparent cutout) -->
      <rect x="32" y="20" width="36" height="20" rx="2" fill="${b}" fill-opacity="0.15" stroke="${a}" stroke-width="0.8" stroke-dasharray="2 2"/>
      
      <!-- Fiber fusion splices -->
      <path d="M 20,25 Q 30,22 45,22 Q 55,22 65,30" fill="none" stroke="${sh}" stroke-width="1"/>
      <path d="M 20,35 Q 30,38 45,38 Q 55,38 65,30" fill="none" stroke="${sh}" stroke-width="1"/>
      <rect x="40" y="20" width="10" height="4" rx="0.5" fill="${l}"/>
      <rect x="40" y="36" width="10" height="4" rx="0.5" fill="${l}"/>
      
      <!-- Mounting brackets -->
      <path d="M 15,14 L 10,14" stroke="${a}" stroke-width="2"/>
      <path d="M 15,46 L 10,46" stroke="${a}" stroke-width="2"/>
      <path d="M 85,14 L 90,14" stroke="${a}" stroke-width="2"/>
      <path d="M 85,46 L 90,46" stroke="${a}" stroke-width="2"/>
    `;
  },
});

export const monoUndergroundManholePlugin = makeMonoPlugin({
  type: 'mono-underground-manhole',
  label: 'Underground Manhole (M)',
  defaultSize: { width: 80, height: 80 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <!-- Outer concrete frame -->
      <rect x="4" y="4" width="72" height="72" rx="4" fill="${sh}" fill-opacity="0.2" stroke="${a}" stroke-width="2"/>
      <rect x="8" y="8" width="64" height="64" rx="2" fill="none" stroke="${a}" stroke-width="1" stroke-dasharray="3 3"/>
      
      <!-- Circular iron cover frame -->
      <circle cx="40" cy="40" r="28" fill="${s}" stroke="${a}" stroke-width="2.5"/>
      <circle cx="40" cy="40" r="23" fill="none" stroke="${a}" stroke-width="1"/>
      
      <!-- Checkerboard / anti-slip pattern lines -->
      <line x1="20" y1="40" x2="60" y2="40" stroke="${a}" stroke-width="1.2"/>
      <line x1="40" y1="20" x2="40" y2="60" stroke="${a}" stroke-width="1.2"/>
      <line x1="26" y1="26" x2="54" y2="54" stroke="${a}" stroke-width="1"/>
      <line x1="26" y1="54" x2="54" y2="26" stroke="${a}" stroke-width="1"/>
      
      <!-- Inner core plate -->
      <circle cx="40" cy="40" r="12" fill="${sh}" stroke="${a}" stroke-width="1"/>
      
      <!-- Handholes / lifting slots -->
      <rect x="36" y="21" width="8" height="3" rx="1" fill="${s}" stroke="${a}" stroke-width="0.8"/>
      <rect x="36" y="56" width="8" height="3" rx="1" fill="${s}" stroke="${a}" stroke-width="0.8"/>
      
      <!-- Telecom symbol (T-shape or text) in center -->
      <text x="40" y="43" font-family="sans-serif" font-size="7" font-weight="extrabold" fill="${b}" text-anchor="middle">TEL</text>
    `;
  },
});

export const monoMediaConverterPlugin = makeMonoPlugin({
  type: 'mono-media-converter',
  label: 'Media Converter (M)',
  defaultSize: { width: 95, height: 50 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <!-- Main box body -->
      <rect x="5" y="8" width="85" height="34" rx="3" fill="${s}" stroke="${a}" stroke-width="2"/>
      
      <!-- Left side: RJ45 Copper Port -->
      <rect x="10" y="15" width="16" height="20" rx="1.5" fill="${sh}" stroke="${a}" stroke-width="1"/>
      <!-- RJ45 Pin contacts and lock notch -->
      <rect x="13" y="29" width="10" height="6" fill="${s}"/>
      <line x1="13" y1="20" x2="13" y2="26" stroke="${b}" stroke-width="0.8"/>
      <line x1="16" y1="20" x2="16" y2="26" stroke="${b}" stroke-width="0.8"/>
      <line x1="19" y1="20" x2="19" y2="26" stroke="${b}" stroke-width="0.8"/>
      <line x1="22" y1="20" x2="22" y2="26" stroke="${b}" stroke-width="0.8"/>
      <text x="18" y="13" font-family="sans-serif" font-size="5" fill="${a}">TX</text>
      
      <!-- Right side: Dual Fiber LC/SC Port -->
      <rect x="68" y="17" width="16" height="16" rx="1" fill="${sh}" stroke="${a}" stroke-width="1"/>
      <circle cx="73" cy="25" r="2.5" fill="${b}" stroke="${a}" stroke-width="0.6"/>
      <circle cx="79" cy="25" r="2.5" fill="${sh}" stroke="${a}" stroke-width="0.6"/>
      <text x="76" y="13" font-family="sans-serif" font-size="5" fill="${a}">FX</text>
      
      <!-- Center conversion arrow icons (Copper <-> Fiber symbol) -->
      <path d="M 36,20 H 52 L 48,16" fill="none" stroke="${b}" stroke-width="1" stroke-linecap="round"/>
      <path d="M 52,28 H 36 L 40,32" fill="none" stroke="${b}" stroke-width="1" stroke-linecap="round"/>
      
      <!-- LEDs panel (Link, Act, FDX, PWR) -->
      <circle cx="34" cy="14" r="1.5" fill="${l}"/>
      <circle cx="44" cy="14" r="1.5" fill="${l}"/>
      <circle cx="54" cy="14" r="1.5" fill="${l}"/>
      
      <!-- Small cooling vents -->
      <line x1="33" y1="34" x2="35" y2="34" stroke="${a}" stroke-width="1"/>
      <line x1="39" y1="34" x2="41" y2="34" stroke="${a}" stroke-width="1"/>
      <line x1="45" y1="34" x2="47" y2="34" stroke="${a}" stroke-width="1"/>
      <line x1="51" y1="34" x2="53" y2="34" stroke="${a}" stroke-width="1"/>
      <line x1="57" y1="34" x2="59" y2="34" stroke="${a}" stroke-width="1"/>
    `;
  },
});

export const monoUpsPlugin = makeMonoPlugin({
  type: 'mono-ups',
  label: 'UPS (Onduleur) (M)',
  defaultSize: { width: 110, height: 50 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <!-- Main rack unit body -->
      <rect x="4" y="6" width="102" height="38" rx="2" fill="${s}" stroke="${a}" stroke-width="2"/>
      
      <!-- Left & Right Rack Ears -->
      <rect x="0" y="6" width="4" height="38" fill="${a}"/>
      <rect x="106" y="6" width="4" height="38" fill="${a}"/>
      <circle cx="2" cy="12" r="1" fill="${b}"/>
      <circle cx="2" cy="38" r="1" fill="${b}"/>
      <circle cx="108" cy="12" r="1" fill="${b}"/>
      <circle cx="108" cy="38" r="1" fill="${b}"/>
      
      <!-- LCD Display screen -->
      <rect x="30" y="12" width="50" height="26" rx="1.5" fill="${a}" fill-opacity="0.1" stroke="${a}" stroke-width="1.2"/>
      
      <!-- Battery status graph (bar segments) inside LCD -->
      <rect x="35" y="16" width="6" height="18" fill="none" stroke="${b}" stroke-width="0.8"/>
      <rect x="37" y="18" width="2" height="14" fill="${l}"/>
      
      <!-- Sine wave symbol inside LCD -->
      <path d="M 46,25 Q 52,15 58,25 T 70,25" fill="none" stroke="${b}" stroke-width="1.2"/>
      <!-- Sine wave text or digital metrics -->
      <text x="65" y="32" font-family="monospace" font-size="6" font-weight="bold" fill="${b}">230V</text>
      
      <!-- Left venting grilles -->
      <line x1="10" y1="16" x2="22" y2="16" stroke="${sh}" stroke-width="1"/>
      <line x1="10" y1="20" x2="22" y2="20" stroke="${sh}" stroke-width="1"/>
      <line x1="10" y1="24" x2="22" y2="24" stroke="${sh}" stroke-width="1"/>
      <line x1="10" y1="28" x2="22" y2="28" stroke="${sh}" stroke-width="1"/>
      <line x1="10" y1="32" x2="22" y2="32" stroke="${sh}" stroke-width="1"/>
      
      <!-- Right controls (power switch, status LEDs) -->
      <!-- Power Switch -->
      <rect x="88" y="18" width="10" height="14" rx="1" fill="${sh}" stroke="${a}" stroke-width="0.8"/>
      <circle cx="93" cy="25" r="2.5" fill="${l}"/>
      
      <!-- Alarm Status LED -->
      <circle cx="93" cy="12" r="2" fill="${sh}" stroke="${a}" stroke-width="0.5"/>
    `;
  },
});

export const monoPduPlugin = makeMonoPlugin({
  type: 'mono-pdu',
  label: 'PDU (M)',
  defaultSize: { width: 140, height: 35 },
  defaultStyle: { fill: '#ffffff', stroke: '#1f2937', strokeWidth: 1.5 },
  body: (t) => {
    const b = t.body ?? DEFAULT_THEME.body;
    const a = t.accent ?? DEFAULT_THEME.accent;
    const s = t.screen ?? DEFAULT_THEME.screen;
    const l = t.led ?? DEFAULT_THEME.led;
    const sh = t.shadow ?? DEFAULT_THEME.shadow;
    return `
      <!-- Main PDU strip -->
      <rect x="4" y="4" width="132" height="27" rx="2" fill="${s}" stroke="${a}" stroke-width="1.8"/>
      
      <!-- Left Mounting ear -->
      <rect x="0" y="4" width="4" height="27" fill="${a}"/>
      <circle cx="2" cy="17" r="1.2" fill="${b}"/>
      <!-- Right Mounting ear -->
      <rect x="136" y="4" width="4" height="27" fill="${a}"/>
      <circle cx="138" cy="17" r="1.2" fill="${b}"/>
      
      <!-- Amperage / Voltage digital display screen -->
      <rect x="10" y="9" width="22" height="17" rx="1" fill="${a}" fill-opacity="0.1" stroke="${a}" stroke-width="0.8"/>
      <text x="21" y="20" font-family="monospace" font-size="7" font-weight="bold" fill="${b}" text-anchor="middle">16.0A</text>
      
      <!-- Sockets array (C13/C14 style outlets) -->
      ${[0, 1, 2, 3, 4]
        .map(
          (i) => `
        <g transform="translate(${38 + i * 16}, 9)">
          <!-- Outer hexagonal / rounded C13 socket shape -->
          <polygon points="1,2 11,2 12,6 12,12 11,16 1,16 0,12 0,6" fill="${sh}" stroke="${a}" stroke-width="0.6"/>
          <!-- Plug pin slots -->
          <rect x="2" y="6" width="2" height="4" rx="0.3" fill="${s}"/>
          <rect x="8" y="6" width="2" height="4" rx="0.3" fill="${s}"/>
          <rect x="5" y="11" width="2" height="3" rx="0.3" fill="${s}"/>
        </g>
      `
        )
        .join('')}
        
      <!-- Surge protector / rocker power switch -->
      <rect x="118" y="9" width="12" height="17" rx="1.5" fill="${sh}" stroke="${a}" stroke-width="0.8"/>
      <rect x="121" y="11" width="6" height="6" fill="${sh}" stroke="${a}" stroke-width="0.5"/>
      <circle cx="124" cy="21" r="1.2" fill="${l}"/>
    `;
  },
});

export const monochromePlugins: ShapePlugin[] = [
  monoServerPlugin,
  monoRouterPlugin,
  monoSwitchPlugin,
  monoFirewallPlugin,
  monoCloudPlugin,
  monoDatabasePlugin,
  monoWorkstationPlugin,
  monoLaptopPlugin,
  monoPhonePlugin,
  monoPrinterPlugin,
  monoWifiPlugin,
  monoInternetPlugin,
  monoAccessPointPlugin,
  monoCameraPlugin,
  monoOntPlugin,
  monoOltPlugin,
  monoLanPlugin,
  monoWanPlugin,
  monoTvPlugin,
  monoOpticalSplitterPlugin,
  monoOpticalSpliceClosurePlugin,
  monoUndergroundManholePlugin,
  monoMediaConverterPlugin,
  monoUpsPlugin,
  monoPduPlugin,
];
