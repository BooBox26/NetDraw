// 2.5D Isometric shape library for network & telecom diagrams.
// Designed with a uniform perspective angle (cabinet projection: dx=8, dy=6) and consistent stroke rendering.
// Allows user color personalization via Theme slots (body, accent, screen, led, shadow).

import type { ColorSlot, ShapePlugin } from './types';

// Uniform color slots for the 2.5D style
export const ISOMETRIC_SLOTS: ColorSlot[] = [
  {
    id: 'body',
    label: 'Face principale (Chassis)',
    default: '#3b82f6',
    target: 'fill',
    group: 'Surfaces 2.5D',
  },
  {
    id: 'accent',
    label: 'Face supérieure (Reflet)',
    default: '#93c5fd',
    target: 'fill',
    group: 'Surfaces 2.5D',
  },
  {
    id: 'screen',
    label: 'Face latérale (Ombre)',
    default: '#1d4ed8',
    target: 'fill',
    group: 'Surfaces 2.5D',
  },
  { id: 'led', label: 'Indicateurs LED', default: '#10b981', target: 'fill', group: 'Statut' },
  {
    id: 'shadow',
    label: 'Contour / Tracé',
    default: '#1e293b',
    target: 'stroke',
    group: 'Contours',
  },
];

export interface IsometricTheme {
  body: string;
  accent: string;
  screen: string;
  led: string;
  shadow: string;
}

// ------------------------------------------------------------------
// 2.5D Geometry Builders
// ------------------------------------------------------------------

/**
 * Renders a 3D block (cabinet projection) with 3 visible faces.
 * Front face spans from (0,0) to (W, H). Top/right faces extend by (dx, dy).
 */
function chassis3D(
  W: number,
  H: number,
  dx: number,
  dy: number,
  t: IsometricTheme,
  opts: { frontRadius?: number; strokeWidth?: number } = {}
): string {
  const r = opts.frontRadius ?? 1.5;
  const sw = opts.strokeWidth ?? 1.2;

  return `
    <polygon points="0,0 ${W},0 ${W + dx},${-dy} ${dx},${-dy}"
      fill="${t.accent}" stroke="${t.shadow}" stroke-width="${sw}" stroke-linejoin="round"/>
    <polygon points="${W},0 ${W},${H} ${W + dx},${H - dy} ${W + dx},${-dy}"
      fill="${t.screen}" stroke="${t.shadow}" stroke-width="${sw}" stroke-linejoin="round"/>
    <rect x="0" y="0" width="${W}" height="${H}" rx="${r}"
      fill="${t.body}" stroke="${t.shadow}" stroke-width="${sw + 0.1}"/>
  `;
}

/**
 * Renders a 3D cylinder.
 * Top ellipse centered at (cx, cy) with radii (rx, ry).
 * Extrudes downwards by h.
 */
function cylinder3D(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  h: number,
  t: IsometricTheme,
  sw = 1.2
): string {
  return `
    <path d="M ${cx - rx},${cy} A ${rx},${ry} 0 0,0 ${cx + rx},${cy} L ${cx + rx},${cy + h} A ${rx},${ry} 0 0,1 ${cx - rx},${cy + h} Z"
      fill="${t.screen}" stroke="${t.shadow}" stroke-width="${sw}" stroke-linejoin="round"/>
    <path d="M ${cx - rx},${cy} A ${rx},${ry} 0 0,1 ${cx + rx},${cy} L ${cx + rx},${cy + h} A ${rx},${ry} 0 0,0 ${cx - rx},${cy + h} Z"
      fill="${t.body}" stroke="${t.shadow}" stroke-width="${sw}" stroke-linejoin="round" opacity="0.85"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
      fill="${t.accent}" stroke="${t.shadow}" stroke-width="${sw}"/>
  `;
}

/**
 * Renders a 2.5D volumetric cloud shape.
 */
function cloud3D(
  _W: number,
  H: number,
  dx: number,
  dy: number,
  t: IsometricTheme,
  sw = 1.2
): string {
  // A clean cloud outline path in the local box [10, 10, W-10, H-10]
  const path = `M 25,${H - 15} 
    C 12,${H - 15} 8,${H - 28} 15,${H - 38} 
    C 12,${H - 48} 25,${H - 58} 38,${H - 52} 
    C 45,${H - 65} 70,${H - 65} 80,${H - 52} 
    C 92,${H - 58} 105,${H - 45} 102,${H - 35} 
    C 112,${H - 28} 108,${H - 15} 90,${H - 15} Z`;

  return `
    <path d="${path}" fill="${t.screen}" stroke="${t.shadow}" stroke-width="${sw}" transform="translate(${dx}, ${-dy})"/>
    <path d="M 25,${H - 15} L ${25 + dx},${H - 15 - dy} L ${90 + dx},${H - 15 - dy} L 90,${H - 15} Z" fill="${t.screen}" stroke="${t.shadow}" stroke-width="${sw}" stroke-linejoin="round"/>
    <path d="${path}" fill="${t.body}" stroke="${t.shadow}" stroke-width="${sw + 0.1}"/>
  `;
}

// ------------------------------------------------------------------
// Front Face Component Helpers
// ------------------------------------------------------------------

function led(x: number, y: number, r: number, color: string, t: IsometricTheme): string {
  return `
    <circle cx="${x}" cy="${y}" r="${r + 0.5}" fill="${t.shadow}" opacity="0.4"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>
  `;
}

function port(x: number, y: number, w: number, h: number, t: IsometricTheme): string {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0.5" fill="${t.shadow}" opacity="0.9"/>
    <line x1="${x + 0.5}" y1="${y + 0.5}" x2="${x + w - 0.5}" y2="${y + 0.5}" stroke="${t.accent}" stroke-width="0.3" opacity="0.4"/>
  `;
}

function portGrid(
  x: number,
  y: number,
  w: number,
  h: number,
  rows: number,
  cols: number,
  t: IsometricTheme,
  ledColor: string
): string {
  let svg = '';
  const gapX = (w - cols * 5) / (cols + 1);
  const gapY = (h - rows * 4) / (rows + 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = x + gapX + c * (5 + gapX);
      const py = y + gapY + r * (4 + gapY);
      svg += port(px, py, 5, 4, t);
      svg += led(px + 2.5, py - 1.2, 0.4, ledColor, t);
    }
  }
  return svg;
}

// ------------------------------------------------------------------
// Category Themes (Presets)
// ------------------------------------------------------------------

const THEME_NETWORK: IsometricTheme = {
  body: '#3b82f6',
  accent: '#93c5fd',
  screen: '#1d4ed8',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_DATACENTER: IsometricTheme = {
  body: '#4b5563',
  accent: '#d1d5db',
  screen: '#1f2937',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_SERVERS: IsometricTheme = {
  body: '#64748b',
  accent: '#cbd5e1',
  screen: '#334155',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_STORAGE: IsometricTheme = {
  body: '#8b5cf6',
  accent: '#c4b5fd',
  screen: '#6d28d9',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_TELECOM: IsometricTheme = {
  body: '#0d9488',
  accent: '#99f6e4',
  screen: '#115e59',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_WIFI: IsometricTheme = {
  body: '#f59e0b',
  accent: '#fde68a',
  screen: '#b45309',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_SECURITY: IsometricTheme = {
  body: '#dc2626',
  accent: '#fca5a5',
  screen: '#991b1b',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_USERS: IsometricTheme = {
  body: '#06b6d4',
  accent: '#a5f3fc',
  screen: '#0891b2',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_PERIPHERALS: IsometricTheme = {
  body: '#10b981',
  accent: '#a7f3d0',
  screen: '#047857',
  led: '#10b981',
  shadow: '#1e293b',
};
const THEME_CLOUD: IsometricTheme = {
  body: '#ec4899',
  accent: '#fbcfe8',
  screen: '#be185d',
  led: '#10b981',
  shadow: '#1e293b',
};

// ------------------------------------------------------------------
// Automatic Bilingual Search Tag Generator
// ------------------------------------------------------------------

function generateDefaultTags(type: string, label: string): string[] {
  const tags = new Set<string>();
  const words = `${type} ${label}`
    .toLowerCase()
    .replace(/[-().]/g, ' ')
    .split(/\s+/);
  for (const w of words) {
    if (w && w !== '25d' && w !== '2.5d' && w !== 'plugin') {
      tags.add(w);
    }
  }

  const synonyms: Record<string, string[]> = {
    router: ['routeur', 'routing', 'route', 'l3', 'layer3'],
    routeur: ['router', 'routing', 'route', 'l3', 'layer3'],
    switch: ['commutateur', 'commutation', 'lan', 'l2', 'layer2', 'port'],
    firewall: ['pare-feu', 'filtrage', 'security', 'sécurité', 'protect'],
    vpn: ['tunnel', 'gateway', 'passerelle', 'crypto', 'ipsec'],
    balancer: ['repartiteur', 'lb', 'load', 'trafic'],
    proxy: ['mandataire', 'gateway', 'passerelle'],
    ids: ['intrusion', 'detection', 'alarme', 'securite', 'security'],
    ips: ['prevention', 'protection', 'securite', 'security'],
    rack: ['baie', 'chassis', 'cabinet', 'datacenter', 'armoire'],
    patch: ['brassage', 'panneau', 'rj45', 'port'],
    odf: ['optique', 'fibre', 'splice', 'tiroir'],
    pdu: ['alimentation', 'prise', 'power', 'courant'],
    ups: ['onduleur', 'batterie', 'secours', 'power'],
    kvm: ['console', 'ecran', 'clavier', 'écran'],
    server: ['serveur', 'compute', 'chassis'],
    serveur: ['server', 'compute', 'chassis'],
    nas: ['stockage', 'disque', 'storage', 'disk', 'partage'],
    san: ['stockage', 'baie', 'storage', 'fibre', 'fc'],
    backup: ['sauvegarde', 'restauration', 'bande', 'archive'],
    pop: ['nro', 'point', 'presence', 'cabinet', 'shelter'],
    olt: ['gpon', 'fibre', 'ftth', 'operator'],
    ont: ['box', 'cpe', 'fibre', 'ftth'],
    dslam: ['adsl', 'vdsl', 'copper', 'cuivre'],
    antenne: ['antenna', 'rf', 'radio', 'hertzien'],
    faisceau: ['fh', 'microwave', 'hertzien', 'wireless'],
    tower: ['pylone', 'pylône', 'mât', 'mast', 'mobile', 'gsm', 'cell'],
    satellite: ['gateway', 'parabole', 'dish'],
    point: ['ap', 'borne', 'wifi', 'wireless', 'onde'],
    ap: ['point', 'borne', 'wifi', 'wireless'],
    bastion: ['passerelle', 'securite', 'security', 'ssh'],
    waf: ['firewall', 'web', 'securite', 'security'],
    siem: ['logs', 'evenements', 'supervision', 'monitoring'],
    pc: ['desktop', 'ordinateur', 'poste', 'client'],
    laptop: ['portable', 'ordinateur', 'pc', 'notebook'],
    workstation: ['station', 'travail', 'poste', 'puissant'],
    client: ['client', 'terminal', 'thin'],
    imprimante: ['printer', 'print', 'copieur'],
    scanner: ['numerisation', 'numérisation', 'copie'],
    telephone: ['phone', 'voip', 'sip', 'appel'],
    camera: ['cctv', 'surveillance', 'video', 'vidéo'],
    cloud: ['nuage', 'virtuel', 'iaas', 'saas'],
    internet: ['web', 'wan', 'mondial', 'globe'],
  };

  for (const w of Array.from(tags)) {
    if (synonyms[w]) {
      for (const syn of synonyms[w]) {
        tags.add(syn);
      }
    }
  }

  return Array.from(tags);
}

// ------------------------------------------------------------------
// Plugin Generator Factory
// ------------------------------------------------------------------

interface IsometricConfig {
  type: string;
  label: string;
  category: 'network' | 'basic' | 'topology' | 'custom' | 'monochrome';
  defaultSize: { width: number; height: number };
  defaultTheme: IsometricTheme;
  body: (theme: IsometricTheme) => string;
  tags?: string[];
}

function makeIsometricPlugin(cfg: IsometricConfig): ShapePlugin {
  return {
    type: cfg.type,
    category: cfg.category,
    label: cfg.label,
    tags: [...generateDefaultTags(cfg.type, cfg.label), ...(cfg.tags ?? [])],
    defaultStyle: {
      fill: '#ffffff',
      stroke: cfg.defaultTheme.shadow,
      strokeWidth: 1.2,
      theme: { ...cfg.defaultTheme },
    },
    defaultSize: cfg.defaultSize,
    colorSlots: ISOMETRIC_SLOTS,
    defaultTheme: { ...cfg.defaultTheme },
    preview: (color) => {
      const theme: IsometricTheme = { ...cfg.defaultTheme };
      if (color && color !== '#1e293b' && color !== '#0f172a') {
        theme.body = color;
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
      const theme: IsometricTheme = {
        body: cfg.defaultTheme.body,
        accent: cfg.defaultTheme.accent,
        screen: cfg.defaultTheme.screen,
        led: cfg.defaultTheme.led,
        shadow: cfg.defaultTheme.shadow,
        ...(s.style.theme ?? {}),
      };
      return `<g transform="scale(${sx} ${sy})" opacity="${s.style.opacity ?? 1}">${cfg.body(theme)}</g>`;
    },
  };
}

// ------------------------------------------------------------------
// 1. Category: Réseau (Network) - 15 Icons
// ------------------------------------------------------------------

export const router25d = makeIsometricPlugin({
  type: 'router-25d',
  label: 'Router 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 75 },
  defaultTheme: THEME_NETWORK,
  body: (t) => {
    const cx = 60,
      cy = 26,
      rx = 46,
      ry = 20,
      h = 20;
    const chassis = cylinder3D(cx, cy, rx, ry, h, t, 1.2);
    // Circular routing glyph on top face
    const glyph = `
      <ellipse cx="60" cy="26" rx="30" ry="13" fill="${t.body}" stroke="${t.shadow}" stroke-width="0.8"/>
      <ellipse cx="60" cy="26" rx="18" ry="8" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.6"/>
      <ellipse cx="60" cy="26" rx="6" ry="2.6" fill="${t.shadow}"/>
      <path d="M 60,18 L 60,9" stroke="${t.shadow}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M 58,12 L 60,9 L 62,12" fill="none" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M 60,34 L 60,43" stroke="${t.shadow}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M 58,40 L 60,43 L 62,40" fill="none" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M 72,26 L 90,26" stroke="${t.shadow}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M 86,23 L 90,26 L 86,29" fill="none" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M 48,26 L 30,26" stroke="${t.shadow}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M 34,23 L 30,26 L 34,29" fill="none" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
    `;
    return chassis + glyph;
  },
});

export const coreRouter25d = makeIsometricPlugin({
  type: 'core-router-25d',
  label: 'Core Router 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 87 },
  defaultTheme: { ...THEME_NETWORK, body: '#dc2626', screen: '#991b1b', accent: '#fca5a5' },
  body: (t) => {
    const cx = 60,
      cy = 26,
      rx = 46,
      ry = 20,
      h = 32;
    const chassis = cylinder3D(cx, cy, rx, ry, h, t, 1.2);
    // Double deck divider
    const divider = `<path d="M 14,42 A 46,20 0 0,0 106,42" fill="none" stroke="${t.shadow}" stroke-width="1"/>`;
    const glyph = `
      <ellipse cx="60" cy="26" rx="30" ry="13" fill="${t.body}" stroke="${t.shadow}" stroke-width="0.8"/>
      <ellipse cx="60" cy="26" rx="18" ry="8" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.6"/>
      <ellipse cx="60" cy="26" rx="6" ry="2.6" fill="${t.shadow}"/>
      <path d="M 60,18 L 60,9 M 60,34 L 60,43 M 72,26 L 90,26 M 48,26 L 30,26" stroke="${t.shadow}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M 58,12 L 60,9 L 62,12 M 58,40 L 60,43 L 62,40 M 86,23 L 90,26 L 86,29 M 34,23 L 30,26 L 34,29" fill="none" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
    `;
    return chassis + divider + glyph;
  },
});

export const edgeRouter25d = makeIsometricPlugin({
  type: 'edge-router-25d',
  label: 'Edge Router 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 75 },
  defaultTheme: { ...THEME_NETWORK, body: '#ea580c', screen: '#9a3412', accent: '#ffedd5' },
  body: (t) => {
    const cx = 60,
      cy = 26,
      rx = 46,
      ry = 20,
      h = 20;
    const chassis = cylinder3D(cx, cy, rx, ry, h, t, 1.2);
    const divider = `<line x1="60" y1="26" x2="60" y2="46" stroke="${t.shadow}" stroke-width="1"/>`;
    const glyph = `
      <ellipse cx="60" cy="26" rx="30" ry="13" fill="${t.body}" stroke="${t.shadow}" stroke-width="0.8"/>
      <ellipse cx="60" cy="26" rx="18" ry="8" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.6"/>
      <ellipse cx="60" cy="26" rx="6" ry="2.6" fill="${t.shadow}"/>
      <path d="M 60,18 L 60,9 M 60,34 L 60,43 M 72,26 L 90,26 M 48,26 L 30,26" stroke="${t.shadow}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M 58,12 L 60,9 L 62,12 M 58,40 L 60,43 L 62,40 M 86,23 L 90,26 L 86,29 M 34,23 L 30,26 L 34,29" fill="none" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
    `;
    return chassis + divider + glyph;
  },
});

export const switch25d = makeIsometricPlugin({
  type: 'switch-25d',
  label: 'Switch 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 56 },
  defaultTheme: THEME_NETWORK,
  body: (t) => {
    const W = 112,
      H = 50,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    const ports = portGrid(8, 15, 96, 22, 1, 10, t, t.led);
    return chassis + ports;
  },
});

export const coreSwitch25d = makeIsometricPlugin({
  type: 'core-switch-25d',
  label: 'Core Switch 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 86 },
  defaultTheme: { ...THEME_NETWORK, body: '#1e293b', screen: '#0f172a', accent: '#64748b' },
  body: (t) => {
    const W = 112,
      H = 80,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // 4 vertical module blades
    let blades = '';
    for (let i = 0; i < 4; i++) {
      const bx = 8 + i * 25;
      blades += `
        <rect x="${bx}" y="6" width="22" height="68" rx="0.5" fill="${t.body}" stroke="${t.shadow}" stroke-width="0.8"/>
        <line x1="${bx + 11}" y1="10" x2="${bx + 11}" y2="60" stroke="${t.shadow}" stroke-width="0.6" stroke-dasharray="1 2"/>
        ${led(bx + 6, 68, 1, t.led, t)}
        ${led(bx + 16, 68, 1, '#eab308', t)}
      `;
    }
    return chassis + blades;
  },
});

export const distributionSwitch25d = makeIsometricPlugin({
  type: 'distribution-switch-25d',
  label: 'Distribution Switch 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_NETWORK,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Separated clusters of uplink vs local ports
    const portCluster1 = portGrid(8, 15, 40, 30, 2, 3, t, t.led);
    const portCluster2 = portGrid(52, 15, 40, 30, 2, 3, t, t.led);
    const uplinks = `
      <rect x="96" y="15" width="8" height="30" rx="0.5" fill="${t.shadow}"/>
      ${led(100, 22, 1, '#38bdf8', t)}
      ${led(100, 38, 1, '#38bdf8', t)}
    `;
    return chassis + portCluster1 + portCluster2 + uplinks;
  },
});

export const accessSwitch25d = makeIsometricPlugin({
  type: 'access-switch-25d',
  label: 'Access Switch 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 56 },
  defaultTheme: THEME_NETWORK,
  body: (t) => {
    const W = 112,
      H = 50,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Dense 24 port layout
    const ports = portGrid(8, 12, 96, 26, 2, 12, t, t.led);
    return chassis + ports;
  },
});

export const l3Switch25d = makeIsometricPlugin({
  type: 'l3-switch-25d',
  label: 'L3 Switch 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 61 },
  defaultTheme: THEME_NETWORK,
  body: (t) => {
    const W = 112,
      H = 55,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Switch ports on the right, crossing arrows on the left
    const ports = portGrid(55, 12, 50, 30, 2, 4, t, t.led);
    const crossingArrows = `
      <path d="M 12,38 L 38,18 M 12,18 L 38,38" stroke="${t.shadow}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 34,18 L 38,18 L 38,22 M 16,18 L 12,18 L 12,22 M 12,34 L 12,38 L 16,38 M 38,34 L 38,38 L 34,38" fill="none" stroke="${t.shadow}" stroke-width="1.5" stroke-linejoin="round"/>
    `;
    return chassis + ports + crossingArrows;
  },
});

export const firewall25d = makeIsometricPlugin({
  type: 'firewall-25d',
  label: 'Firewall 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Red brick wall pattern overlay
    let bricks = '';
    const rows = 5;
    const cols = 6;
    for (let r = 0; r < rows; r++) {
      const y = 8 + r * 9;
      bricks += `<line x1="8" y1="${y}" x2="104" y2="${y}" stroke="${t.shadow}" stroke-width="0.8"/>`;
      const offset = (r % 2) * 8;
      for (let c = 0; c < cols; c++) {
        const x = 16 + c * 16 + offset;
        if (x < 104) {
          bricks += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 9}" stroke="${t.shadow}" stroke-width="0.8"/>`;
        }
      }
    }
    // Mini metal lock/shield in corner
    const shield = `
      <path d="M 92,12 L 100,12 L 100,18 C 100,22 96,25 92,26 C 88,25 84,22 84,18 L 84,12 Z" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1"/>
    `;
    return chassis + bricks + shield;
  },
});

export const vpnGateway25d = makeIsometricPlugin({
  type: 'vpn-gateway-25d',
  label: 'VPN Gateway 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Padlock drawing
    const lock = `
      <path d="M 46,26 L 46,20 C 46,14 66,14 66,20 L 66,26" fill="none" stroke="${t.shadow}" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="40" y="26" width="32" height="22" rx="2" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2"/>
      <circle cx="56" cy="35" r="2.5" fill="${t.shadow}"/>
      <line x1="56" y1="37" x2="56" y2="43" stroke="${t.shadow}" stroke-width="1.5" stroke-linecap="round"/>
    `;
    const leds = `
      ${led(12, 12, 1.2, t.led, t)}
      ${led(20, 12, 1.2, t.led, t)}
    `;
    return chassis + lock + leds;
  },
});

export const loadBalancer25d = makeIsometricPlugin({
  type: 'load-balancer-25d',
  label: 'Load Balancer 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_NETWORK,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Fork arrow drawing
    const fork = `
      <path d="M 15,30 L 45,30 M 45,30 L 70,15 M 45,30 L 75,30 M 45,30 L 70,45" stroke="${t.shadow}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M 64,15 L 70,15 L 68,21 M 69,30 L 75,30 L 72,34 M 64,45 L 70,45 L 68,39" fill="none" stroke="${t.shadow}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="15" cy="30" r="3" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1"/>
      <circle cx="70" cy="15" r="2" fill="${t.led}"/>
      <circle cx="75" cy="30" r="2" fill="${t.led}"/>
      <circle cx="70" cy="45" r="2" fill="${t.led}"/>
    `;
    return chassis + fork;
  },
});

export const proxy25d = makeIsometricPlugin({
  type: 'proxy-25d',
  label: 'Proxy 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_NETWORK,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Gateway middle wall and passing arrows
    const diagram = `
      <rect x="52" y="12" width="8" height="36" rx="1" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1"/>
      <path d="M 15,22 L 95,22" stroke="${t.shadow}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 3"/>
      <path d="M 95,38 L 15,38" stroke="${t.shadow}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 3"/>
      <path d="M 91,22 L 95,22 L 91,18 M 19,38 L 15,38 L 19,42" fill="none" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
    `;
    return chassis + diagram;
  },
});

export const ids25d = makeIsometricPlugin({
  type: 'ids-25d',
  label: 'IDS 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Eye/Radar scanning
    const scan = `
      <circle cx="56" cy="30" r="14" fill="none" stroke="${t.shadow}" stroke-width="1.2" stroke-dasharray="2 2"/>
      <circle cx="56" cy="30" r="8" fill="none" stroke="${t.shadow}" stroke-width="1"/>
      <circle cx="56" cy="30" r="3" fill="${t.led}"/>
      <line x1="56" y1="30" x2="68" y2="20" stroke="${t.shadow}" stroke-width="1.2" stroke-linecap="round"/>
    `;
    return chassis + scan;
  },
});

export const ips25d = makeIsometricPlugin({
  type: 'ips-25d',
  label: 'IPS 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Shield blocking a lightning bolt
    const shieldBlock = `
      <path d="M 44,18 C 44,18 56,15 56,15 C 56,15 68,18 68,18 L 68,32 C 68,39 56,45 56,45 C 56,45 44,39 44,32 Z" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2"/>
      <path d="M 20,15 L 36,25 L 30,28 L 46,38" fill="none" stroke="${t.shadow}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="46" cy="38" r="1.5" fill="#f59e0b"/>
    `;
    return chassis + shieldBlock;
  },
});

export const sdwanAppliance25d = makeIsometricPlugin({
  type: 'sdwan-appliance-25d',
  label: 'SD-WAN Appliance 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_NETWORK,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Cloud and 3 connection endpoints
    const cloudIcon = `
      <path d="M 48,34 C 44,34 42,30 45,26 C 45,22 50,18 56,20 C 60,16 68,16 71,21 C 75,23 76,28 72,34 Z" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M 25,42 L 48,30 M 58,34 L 58,45 M 68,30 L 85,42" stroke="${t.shadow}" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="25" cy="42" r="2" fill="${t.led}"/>
      <circle cx="58" cy="45" r="2" fill="${t.led}"/>
      <circle cx="85" cy="42" r="2" fill="${t.led}"/>
    `;
    return chassis + cloudIcon;
  },
});

// ------------------------------------------------------------------
// 2. Category: Datacenter - 8 Icons
// ------------------------------------------------------------------

export const rack25d = makeIsometricPlugin({
  type: 'rack-25d',
  label: 'Rack 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 146 },
  defaultTheme: THEME_DATACENTER,
  body: (t) => {
    const W = 72,
      H = 140,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t, { frontRadius: 0.5 });
    // Empty vertical frame rack rails
    const rails = `
      <line x1="8" y1="5" x2="8" y2="135" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="1 2"/>
      <line x1="64" y1="5" x2="64" y2="135" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="1 2"/>
      <rect x="10" y="5" width="52" height="130" rx="0.5" fill="none" stroke="${t.shadow}" stroke-width="0.8" opacity="0.4"/>
      <!-- transparent glass reflection -->
      <polygon points="12,10 50,10 25,130 12,130" fill="#ffffff" opacity="0.12"/>
    `;
    return chassis + rails;
  },
});

export const rackEmpty25d = makeIsometricPlugin({
  type: 'rack-empty-25d',
  label: 'Rack Vide 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 146 },
  defaultTheme: THEME_DATACENTER,
  body: (t) => {
    const W = 72,
      H = 140,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t, { frontRadius: 0.5 });
    // Empty rack showing inside grid lines
    let slots = '';
    for (let i = 0; i < 12; i++) {
      const y = 10 + i * 10;
      slots += `
        <line x1="8" y1="${y}" x2="64" y2="${y}" stroke="${t.shadow}" stroke-width="0.6" stroke-dasharray="2 3"/>
      `;
    }
    return chassis + slots;
  },
});

export const rackFull25d = makeIsometricPlugin({
  type: 'rack-full-25d',
  label: 'Rack Rempli 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 146 },
  defaultTheme: THEME_DATACENTER,
  body: (t) => {
    const W = 72,
      H = 140,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t, { frontRadius: 0.5 });
    // Populated rack
    let content = '';
    const items = [
      { y: 8, h: 12, color: '#3b82f6', label: 'SW' },
      { y: 24, h: 15, color: '#64748b', label: 'SRV' },
      { y: 43, h: 15, color: '#64748b', label: 'SRV' },
      { y: 62, h: 15, color: '#8b5cf6', label: 'SAN' },
      { y: 81, h: 12, color: '#4b5563', label: 'PP' },
      { y: 97, h: 15, color: '#dc2626', label: 'FW' },
      { y: 116, h: 18, color: '#1e293b', label: 'UPS' },
    ];
    for (const item of items) {
      content += `
        <rect x="8" y="${item.y}" width="56" height="${item.h}" fill="${item.color}" stroke="${t.shadow}" stroke-width="0.8" rx="0.5"/>
        <line x1="12" y1="${item.y + item.h / 2}" x2="40" y2="${item.y + item.h / 2}" stroke="${t.accent}" stroke-width="0.6" opacity="0.3"/>
        ${led(50, item.y + 4, 0.6, t.led, t)}
        ${led(50, item.y + item.h - 4, 0.6, '#f59e0b', t)}
      `;
    }
    return chassis + content;
  },
});

export const patchPanel25d = makeIsometricPlugin({
  type: 'patch-panel-25d',
  label: 'Patch Panel 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 48 },
  defaultTheme: THEME_DATACENTER,
  body: (t) => {
    const W = 112,
      H = 42,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Port slots
    let ports = '';
    for (let c = 0; c < 4; c++) {
      const cx = 8 + c * 26;
      ports += `<rect x="${cx}" y="12" width="22" height="10" rx="0.5" fill="${t.shadow}"/>`;
      for (let p = 0; p < 6; p++) {
        ports += `<rect x="${cx + 1.5 + p * 3.3}" y="14" width="2" height="6" rx="0.3" fill="${t.accent}" opacity="0.7"/>`;
      }
      ports += `<line x1="${cx}" y1="8" x2="${cx + 22}" y2="8" stroke="${t.shadow}" stroke-width="0.8"/>`;
    }
    return chassis + ports;
  },
});

export const odf25d = makeIsometricPlugin({
  type: 'odf-25d',
  label: 'ODF 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 53 },
  defaultTheme: THEME_DATACENTER,
  body: (t) => {
    const W = 112,
      H = 47,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Fiber splice/distribution drawers
    let trays = '';
    for (let row = 0; row < 2; row++) {
      const ry = 10 + row * 16;
      trays += `
        <rect x="8" y="${ry}" width="96" height="12" rx="0.5" fill="${t.shadow}" opacity="0.95"/>
        <line x1="12" y1="${ry + 6}" x2="84" y2="${ry + 6}" stroke="${t.accent}" stroke-width="0.5" stroke-dasharray="1 1"/>
        ${led(88, ry + 6, 0.8, '#ec4899', t)}
        ${led(94, ry + 6, 0.8, '#ec4899', t)}
      `;
    }
    return chassis + trays;
  },
});

export const pdu25d = makeIsometricPlugin({
  type: 'pdu-25d',
  label: 'PDU 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 48 },
  defaultTheme: THEME_DATACENTER,
  body: (t) => {
    const W = 112,
      H = 42,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // 6 round sockets and a red switch
    let sockets = '';
    for (let i = 0; i < 6; i++) {
      const sx = 28 + i * 13;
      sockets += `
        <circle cx="${sx}" cy="21" r="4.5" fill="${t.shadow}"/>
        <circle cx="${sx}" cy="21" r="1.5" fill="${t.accent}" opacity="0.8"/>
      `;
    }
    const switchBtn = `
      <rect x="8" y="16" width="10" height="10" fill="#ef4444" stroke="${t.shadow}" stroke-width="1" rx="0.5"/>
      <line x1="13" y1="16" x2="13" y2="26" stroke="${t.shadow}" stroke-width="0.8"/>
    `;
    return chassis + sockets + switchBtn;
  },
});

export const ups25d = makeIsometricPlugin({
  type: 'ups-25d',
  label: 'UPS 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 86 },
  defaultTheme: THEME_DATACENTER,
  body: (t) => {
    const W = 82,
      H = 80,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Battery capacity screen
    const screen = `
      <rect x="12" y="12" width="58" height="30" rx="1" fill="${t.shadow}"/>
      <text x="16" y="24" fill="${t.led}" font-size="6" font-family="monospace" font-weight="bold">BAT: 100%</text>
      <rect x="16" y="28" width="50" height="6" fill="none" stroke="${t.led}" stroke-width="0.8"/>
      <rect x="18" y="30" width="46" height="2" fill="${t.led}"/>
    `;
    const vents = `
      <line x1="12" y1="54" x2="70" y2="54" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="4 2"/>
      <line x1="12" y1="60" x2="70" y2="60" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="4 2"/>
      <line x1="12" y1="66" x2="70" y2="66" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="4 2"/>
    `;
    return chassis + screen + vents;
  },
});

export const kvm25d = makeIsometricPlugin({
  type: 'kvm-25d',
  label: 'KVM 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 53 },
  defaultTheme: THEME_DATACENTER,
  body: (t) => {
    const W = 112,
      H = 47,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Folding screen and grid keys
    const kvmContent = `
      <rect x="8" y="10" width="30" height="24" rx="1" fill="${t.shadow}"/>
      <rect x="11" y="13" width="24" height="15" fill="#3b82f6"/>
      <line x1="11" y1="21" x2="35" y2="21" stroke="#ffffff" stroke-width="0.5" opacity="0.8"/>
      
      <rect x="46" y="15" width="58" height="18" rx="0.5" fill="${t.shadow}"/>
      <line x1="50" y1="20" x2="100" y2="20" stroke="${t.accent}" stroke-width="0.5" stroke-dasharray="1 1" opacity="0.6"/>
      <line x1="50" y1="24" x2="100" y2="24" stroke="${t.accent}" stroke-width="0.5" stroke-dasharray="1 1" opacity="0.6"/>
      <line x1="50" y1="28" x2="100" y2="28" stroke="${t.accent}" stroke-width="0.5" stroke-dasharray="1 1" opacity="0.6"/>
    `;
    return chassis + kvmContent;
  },
});

// ------------------------------------------------------------------
// 3. Category: Serveurs (Servers) - 5 Icons
// ------------------------------------------------------------------

export const serverRack25d = makeIsometricPlugin({
  type: 'server-rack-25d',
  label: 'Serveur Rack 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_SERVERS,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Hard drives and CD slots
    let drives = '';
    for (let i = 0; i < 4; i++) {
      const dy = 12 + i * 11;
      drives += `
        <rect x="10" y="${dy}" width="40" height="8" rx="0.5" fill="${t.shadow}" opacity="0.9"/>
        <line x1="12" y1="${dy + 4}" x2="30" y2="${dy + 4}" stroke="${t.accent}" stroke-width="0.6" opacity="0.4"/>
        ${led(45, dy + 4, 0.6, t.led, t)}
      `;
    }
    const rightPanel = `
      <rect x="65" y="12" width="38" height="8" rx="0.5" fill="${t.shadow}"/>
      <circle cx="95" cy="36" r="3" fill="${t.shadow}"/>
      <circle cx="95" cy="36" r="1.2" fill="${t.led}"/>
      <line x1="65" y1="28" x2="85" y2="28" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="2 1"/>
      <line x1="65" y1="36" x2="85" y2="36" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="2 1"/>
    `;
    return chassis + drives + rightPanel;
  },
});

export const serverTower25d = makeIsometricPlugin({
  type: 'server-tower-25d',
  label: 'Serveur Tour 2.5D',
  category: 'network',
  defaultSize: { width: 60, height: 116 },
  defaultTheme: THEME_SERVERS,
  body: (t) => {
    const W = 52,
      H = 110,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t, { frontRadius: 1 });
    // Power button and CD drive and cooling grille
    const components = `
      <rect x="8" y="10" width="36" height="12" rx="0.5" fill="${t.shadow}"/>
      <line x1="12" y1="16" x2="32" y2="16" stroke="${t.accent}" stroke-width="0.8" opacity="0.5"/>
      <circle cx="26" cy="36" r="4.5" fill="${t.shadow}"/>
      <circle cx="26" cy="36" r="1.5" fill="${t.led}"/>
      <rect x="8" y="52" width="36" height="46" rx="0.5" fill="${t.shadow}" opacity="0.9"/>
    `;
    let grille = '';
    for (let i = 0; i < 9; i++) {
      grille += `<line x1="14" y1="${58 + i * 5}" x2="38" y2="${58 + i * 5}" stroke="${t.accent}" stroke-width="0.8" opacity="0.3"/>`;
    }
    return chassis + components + grille;
  },
});

export const bladeServer25d = makeIsometricPlugin({
  type: 'blade-server-25d',
  label: 'Blade Server 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 81 },
  defaultTheme: THEME_SERVERS,
  body: (t) => {
    const W = 112,
      H = 75,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Vertical blade modules
    let blades = '';
    const numBlades = 8;
    const bw = 9;
    const gap = 3.5;
    for (let i = 0; i < numBlades; i++) {
      const bx = 8 + i * (bw + gap);
      blades += `
        <rect x="${bx}" y="8" width="${bw}" height="59" rx="0.5" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.8"/>
        <rect x="${bx + 2.5}" y="12" width="4" height="4" rx="0.3" fill="${t.shadow}"/>
        ${led(bx + bw / 2, 45, 0.6, t.led, t)}
        ${led(bx + bw / 2, 53, 0.6, '#eab308', t)}
        <line x1="${bx + 2}" y1="22" x2="${bx + bw - 2}" y2="22" stroke="${t.shadow}" stroke-width="0.5"/>
        <line x1="${bx + 2}" y1="26" x2="${bx + bw - 2}" y2="26" stroke="${t.shadow}" stroke-width="0.5"/>
      `;
    }
    return chassis + blades;
  },
});

export const hypervisor25d = makeIsometricPlugin({
  type: 'hypervisor-25d',
  label: 'Hyperviseur 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 71 },
  defaultTheme: THEME_SERVERS,
  body: (t) => {
    const W = 112,
      H = 65,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Virtualization stack layout
    const stack = `
      <rect x="10" y="10" width="92" height="11" rx="0.5" fill="#10b981" stroke="${t.shadow}" stroke-width="0.8"/>
      <rect x="10" y="25" width="92" height="11" rx="0.5" fill="#f59e0b" stroke="${t.shadow}" stroke-width="0.8"/>
      <rect x="10" y="40" width="92" height="11" rx="0.5" fill="#3b82f6" stroke="${t.shadow}" stroke-width="0.8"/>
      <text x="56" y="18" fill="#ffffff" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">VMs</text>
      <text x="56" y="33" fill="#ffffff" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">HYPERVISOR</text>
      <text x="56" y="48" fill="#ffffff" font-size="6" font-family="sans-serif" font-weight="bold" text-anchor="middle">HARDWARE</text>
    `;
    return chassis + stack;
  },
});

export const cluster25d = makeIsometricPlugin({
  type: 'cluster-25d',
  label: 'Cluster 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 95 },
  defaultTheme: THEME_SERVERS,
  body: (t) => {
    const W = 42,
      H = 70,
      dx = 6,
      dy = 4;
    // 2 small towers connected by a horizontal line
    const themeL = { ...t, body: '#475569', screen: '#1e293b' };
    const tower1 = `<g transform="translate(10, 15)">${chassis3D(W, H, dx, dy, themeL)}<rect x="8" y="10" width="26" height="8" fill="${t.shadow}"/></g>`;
    const tower2 = `<g transform="translate(62, 15)">${chassis3D(W, H, dx, dy, themeL)}<rect x="8" y="10" width="26" height="8" fill="${t.shadow}"/></g>`;
    const links = `
      <path d="M 31,87 L 31,92 L 83,92 L 83,87" fill="none" stroke="${t.shadow}" stroke-width="1.5"/>
      <circle cx="57" cy="92" r="3.5" fill="${t.led}" stroke="${t.shadow}" stroke-width="0.8"/>
    `;
    return tower1 + tower2 + links;
  },
});

// ------------------------------------------------------------------
// 4. Category: Stockage (Storage) - 4 Icons
// ------------------------------------------------------------------

export const nas25d = makeIsometricPlugin({
  type: 'nas-25d',
  label: 'NAS 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 81 },
  defaultTheme: THEME_STORAGE,
  body: (t) => {
    const W = 82,
      H = 75,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Vertical drive trays
    let trays = '';
    for (let i = 0; i < 4; i++) {
      const tx = 10 + i * 16;
      trays += `
        <rect x="${tx}" y="10" width="12" height="55" rx="0.5" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.8"/>
        <rect x="${tx + 4}" y="14" width="4" height="4" fill="${t.shadow}"/>
        ${led(tx + 6, 55, 0.6, t.led, t)}
      `;
    }
    return chassis + trays;
  },
});

export const san25d = makeIsometricPlugin({
  type: 'san-25d',
  label: 'SAN 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 81 },
  defaultTheme: THEME_STORAGE,
  body: (t) => {
    const W = 112,
      H = 75,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // SAN layout: storage controllers + fiber ports
    const controller1 = `
      <rect x="8" y="10" width="96" height="22" rx="0.5" fill="${t.shadow}" opacity="0.95"/>
      ${portGrid(12, 12, 50, 18, 1, 4, t, t.led)}
      ${led(80, 21, 1, t.led, t)}
      ${led(88, 21, 1, '#38bdf8', t)}
    `;
    const controller2 = `
      <rect x="8" y="40" width="96" height="22" rx="0.5" fill="${t.shadow}" opacity="0.95"/>
      ${portGrid(12, 42, 50, 18, 1, 4, t, t.led)}
      ${led(80, 51, 1, t.led, t)}
      ${led(88, 51, 1, '#38bdf8', t)}
    `;
    return chassis + controller1 + controller2;
  },
});

export const baieStockage25d = makeIsometricPlugin({
  type: 'baie-stockage-25d',
  label: 'Baie Stockage 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 146 },
  defaultTheme: THEME_STORAGE,
  body: (t) => {
    const W = 72,
      H = 140,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t, { frontRadius: 0.5 });
    // Storage array layout
    let units = '';
    for (let r = 0; r < 6; r++) {
      const y = 8 + r * 21;
      units += `<rect x="6" y="${y}" width="60" height="17" rx="0.5" fill="${t.shadow}" opacity="0.95"/>`;
      for (let c = 0; c < 4; c++) {
        const cx = 10 + c * 13;
        units += `
          <rect x="${cx}" y="${y + 2}" width="10" height="13" rx="0.3" fill="${t.body}"/>
          <line x1="${cx + 2}" y1="${y + 8}" x2="${cx + 8}" y2="${y + 8}" stroke="${t.shadow}" stroke-width="0.5"/>
          ${led(cx + 5, y + 12, 0.4, t.led, t)}
        `;
      }
    }
    return chassis + units;
  },
});

export const backupAppliance25d = makeIsometricPlugin({
  type: 'backup-appliance-25d',
  label: 'Backup Appliance 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_STORAGE,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Magnetic tape reel diagram
    const tapeReel = `
      <circle cx="42" cy="30" r="11" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2"/>
      <circle cx="42" cy="30" r="4" fill="${t.body}" stroke="${t.shadow}" stroke-width="0.8"/>
      <circle cx="70" cy="30" r="11" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2"/>
      <circle cx="70" cy="30" r="4" fill="${t.body}" stroke="${t.shadow}" stroke-width="0.8"/>
      <path d="M 42,41 L 70,41" stroke="${t.shadow}" stroke-width="1.8"/>
      <!-- circular arrow loop -->
      <path d="M 88,20 A 8,8 0 1,1 86,28" fill="none" stroke="${t.led}" stroke-width="1.2"/>
      <path d="M 88,16 L 88,20 L 84,20" fill="none" stroke="${t.led}" stroke-width="1.2" stroke-linecap="round"/>
    `;
    return chassis + tapeReel;
  },
});

// ------------------------------------------------------------------
// 5. Category: Télécom - 8 Icons
// ------------------------------------------------------------------

export const pop25d = makeIsometricPlugin({
  type: 'pop-25d',
  label: 'Point of Presence 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 91 },
  defaultTheme: THEME_TELECOM,
  body: (t) => {
    const W = 82,
      H = 85,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t, { frontRadius: 0.5 });
    // Secure street cabinet double door
    const details = `
      <line x1="41" y1="4" x2="41" y2="81" stroke="${t.shadow}" stroke-width="1"/>
      <circle cx="36" cy="42" r="2.5" fill="${t.shadow}"/>
      <circle cx="46" cy="42" r="2.5" fill="${t.shadow}"/>
      <!-- Ventilation slots -->
      <line x1="12" y1="12" x2="28" y2="12" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="12" y1="16" x2="28" y2="16" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="54" y1="12" x2="70" y2="12" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="54" y1="16" x2="70" y2="16" stroke="${t.shadow}" stroke-width="0.8"/>
      <!-- Danger sign -->
      <polygon points="41,20 47,30 35,30" fill="#f59e0b" stroke="${t.shadow}" stroke-width="0.8"/>
    `;
    return chassis + details;
  },
});

export const olt25d = makeIsometricPlugin({
  type: 'olt-25d',
  label: 'OLT 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 86 },
  defaultTheme: THEME_TELECOM,
  body: (t) => {
    const W = 112,
      H = 80,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Modular PON card grid with fiber patches
    let cards = '';
    for (let i = 0; i < 6; i++) {
      const cx = 8 + i * 16;
      cards += `
        <rect x="${cx}" y="8" width="13" height="64" rx="0.5" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.8"/>
        ${led(cx + 6.5, 14, 0.6, t.led, t)}
        <circle cx="${cx + 6.5}" cy="26" r="1.5" fill="${t.shadow}"/>
        <circle cx="${cx + 6.5}" cy="38" r="1.5" fill="${t.shadow}"/>
        <path d="M ${cx + 6.5},26 C ${cx + 20},35 ${cx + 40},82 100,74" fill="none" stroke="#ec4899" stroke-width="0.6" opacity="0.75"/>
      `;
    }
    return chassis + cards;
  },
});

export const ont25d = makeIsometricPlugin({
  type: 'ont-25d',
  label: 'ONT 2.5D',
  category: 'network',
  defaultSize: { width: 85, height: 66 },
  defaultTheme: THEME_TELECOM,
  body: (t) => {
    const W = 77,
      H = 60,
      dx = 6,
      dy = 4;
    const chassis = chassis3D(W, H, dx, dy, t, { frontRadius: 3 });
    // Small desktop box with 4 status LEDs
    const leds = `
      <text x="12" y="24" fill="${t.shadow}" font-size="6" font-family="sans-serif" font-weight="bold">PON</text>
      ${led(40, 22, 1.2, t.led, t)}
      <text x="12" y="36" fill="${t.shadow}" font-size="6" font-family="sans-serif" font-weight="bold">LOS</text>
      ${led(40, 34, 1.2, '#ef4444', t)}
      <text x="12" y="48" fill="${t.shadow}" font-size="6" font-family="sans-serif" font-weight="bold">LAN</text>
      ${led(40, 46, 1.2, t.led, t)}
    `;
    return chassis + leds;
  },
});

export const dslam25d = makeIsometricPlugin({
  type: 'dslam-25d',
  label: 'DSLAM 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 81 },
  defaultTheme: THEME_TELECOM,
  body: (t) => {
    const W = 112,
      H = 75,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Dense ADSL/VDSL line card bays
    let lines = '';
    for (let r = 0; r < 4; r++) {
      const ry = 8 + r * 16;
      lines += `<rect x="8" y="${ry}" width="96" height="11" rx="0.5" fill="${t.shadow}" opacity="0.95"/>`;
      for (let c = 0; c < 16; c++) {
        const cx = 12 + c * 5.2;
        lines += `<rect x="${cx}" y="${ry + 3}" width="2.5" height="5" rx="0.2" fill="${t.accent}" opacity="0.8"/>`;
      }
    }
    return chassis + lines;
  },
});

export const antenne25d = makeIsometricPlugin({
  type: 'antenne-25d',
  label: 'Antenne 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 115 },
  defaultTheme: THEME_TELECOM,
  body: (t) => {
    // Parabolic antenna dish on stand
    const stand = `
      <rect x="42" y="55" width="6" height="55" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2"/>
      <polygon points="30,110 60,110 52,105 38,105" fill="${t.shadow}"/>
    `;
    const dish = `
      <ellipse cx="45" cy="35" rx="28" ry="20" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.5"/>
      <ellipse cx="45" cy="35" rx="20" ry="13" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.8" opacity="0.8"/>
      <!-- receiver rod -->
      <line x1="45" y1="35" x2="45" y2="15" stroke="${t.shadow}" stroke-width="1.5"/>
      <circle cx="45" cy="15" r="2.5" fill="${t.led}"/>
    `;
    return stand + dish;
  },
});

export const faisceauHertzien25d = makeIsometricPlugin({
  type: 'faisceau-hertzien-25d',
  label: 'Faisceau Hertzien 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 115 },
  defaultTheme: THEME_TELECOM,
  body: (t) => {
    // Same dish but tilted with diagonal wave lines
    const stand = `
      <rect x="30" y="55" width="6" height="55" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2"/>
      <polygon points="18,110 48,110 40,105 26,105" fill="${t.shadow}"/>
    `;
    const tiltedDish = `
      <g transform="rotate(-15, 33, 35)">
        <ellipse cx="33" cy="35" rx="28" ry="18" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.5"/>
        <ellipse cx="33" cy="35" rx="20" ry="11" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.8" opacity="0.8"/>
        <line x1="33" y1="35" x2="33" y2="15" stroke="${t.shadow}" stroke-width="1.5"/>
        <circle cx="33" cy="15" r="2.5" fill="${t.led}"/>
      </g>
    `;
    const waves = `
      <path d="M 68,10 A 32,32 0 0,1 78,35" fill="none" stroke="${t.led}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 78,5 A 42,42 0 0,1 90,38" fill="none" stroke="${t.led}" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
    `;
    return stand + tiltedDish + waves;
  },
});

export const cellTower25d = makeIsometricPlugin({
  type: 'cell-tower-25d',
  label: 'Cell Tower 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 150 },
  defaultTheme: THEME_TELECOM,
  body: (t) => {
    // Tall lattice structural mast
    const mast = `
      <polygon points="34,140 46,140 42,15 38,15" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1"/>
      <polygon points="38,15 42,15 44,5 36,5" fill="${t.body}" stroke="${t.shadow}" stroke-width="1"/>
      <!-- crossbars -->
      <line x1="34" y1="140" x2="42" y2="100" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="46" y1="140" x2="38" y2="100" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="36" y1="100" x2="44" y2="60" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="44" y1="100" x2="36" y2="60" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="38" y1="60" x2="42" y2="20" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="42" y1="60" x2="38" y2="20" stroke="${t.shadow}" stroke-width="0.8"/>
    `;
    const arrays = `
      <!-- Sector antennas panels on top -->
      <rect x="25" y="20" width="6" height="20" rx="0.5" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.8"/>
      <rect x="49" y="20" width="6" height="20" rx="0.5" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.8"/>
      <!-- Warning beacon light -->
      <circle cx="40" cy="5" r="2" fill="#ef4444"/>
    `;
    return mast + arrays;
  },
});

export const satelliteGateway25d = makeIsometricPlugin({
  type: 'satellite-gateway-25d',
  label: 'Satellite Gateway 2.5D',
  category: 'network',
  defaultSize: { width: 110, height: 115 },
  defaultTheme: THEME_TELECOM,
  body: (t) => {
    // Massive parabolic dish pointed upwards
    const base = `
      <polygon points="30,110 70,110 65,80 35,80" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2"/>
      <circle cx="50" cy="80" r="10" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.2"/>
    `;
    const dish = `
      <g transform="rotate(-30, 50, 50)">
        <ellipse cx="50" cy="50" rx="42" ry="24" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.8"/>
        <ellipse cx="50" cy="50" rx="30" ry="15" fill="${t.accent}" stroke="${t.shadow}" stroke-width="0.8" opacity="0.8"/>
        <line x1="50" y1="50" x2="50" y2="20" stroke="${t.shadow}" stroke-width="1.5"/>
        <circle cx="50" cy="20" r="3" fill="${t.led}"/>
      </g>
    `;
    return base + dish;
  },
});

// ------------------------------------------------------------------
// 6. Category: Wifi - 4 Icons
// ------------------------------------------------------------------

export const accessPoint25d = makeIsometricPlugin({
  type: 'access-point-25d',
  label: 'Access Point 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 70 },
  defaultTheme: THEME_WIFI,
  body: (t) => {
    // 2.5D ceiling saucer disk
    const saucer = cylinder3D(45, 35, 30, 15, 6, t, 1.2);
    const signalWaves = `
      <path d="M 45,15 A 25,12 0 0,1 68,26" fill="none" stroke="${t.led}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 45,5 A 35,17 0 0,1 78,20" fill="none" stroke="${t.led}" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
      ${led(45, 35, 1.5, t.led, t)}
    `;
    return saucer + signalWaves;
  },
});

export const wirelessController25d = makeIsometricPlugin({
  type: 'wireless-controller-25d',
  label: 'Wireless Controller 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_WIFI,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Wifi signal bars and screens
    const screen = `
      <rect x="10" y="15" width="48" height="30" rx="1" fill="${t.shadow}"/>
      <path d="M 16,38 L 16,34 M 22,38 L 22,30 M 28,38 L 28,26 M 34,38 L 34,22 M 40,38 L 40,18" stroke="${t.led}" stroke-width="2" stroke-linecap="round"/>
    `;
    const dialPorts = `
      ${portGrid(68, 15, 36, 30, 2, 2, t, t.led)}
    `;
    return chassis + screen + dialPorts;
  },
});

export const antenneIndoor25d = makeIsometricPlugin({
  type: 'antenne-indoor-25d',
  label: 'Antenne Indoor 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 95 },
  defaultTheme: THEME_WIFI,
  body: (t) => {
    const W = 60,
      H = 35,
      dx = 6,
      dy = 4;
    const chassis = chassis3D(W, H + 20, dx, dy, t);
    // 2 small whip antennas on the back top
    const whips = `
      <line x1="16" y1="20" x2="8" y2="-5" stroke="${t.shadow}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="48" y1="20" x2="56" y2="-5" stroke="${t.shadow}" stroke-width="1.8" stroke-linecap="round"/>
    `;
    const leds = `
      ${led(15, 38, 1, t.led, t)}
      ${led(25, 38, 1, t.led, t)}
      ${led(35, 38, 1, '#f59e0b', t)}
    `;
    return whips + chassis + leds;
  },
});

export const antenneOutdoor25d = makeIsometricPlugin({
  type: 'antenne-outdoor-25d',
  label: 'Antenne Outdoor 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 115 },
  defaultTheme: THEME_WIFI,
  body: (t) => {
    // Sector mast panel
    const W = 28,
      H = 80,
      dx = 6,
      dy = 4;
    const pole = `
      <line x1="40" y1="5" x2="40" y2="105" stroke="${t.shadow}" stroke-width="2"/>
    `;
    const panel = `<g transform="translate(26, 12)">${chassis3D(W, H, dx, dy, t, { frontRadius: 0.5 })}</g>`;
    const details = `
      <line x1="32" y1="25" x2="48" y2="25" stroke="${t.shadow}" stroke-width="1"/>
      <line x1="32" y1="80" x2="48" y2="80" stroke="${t.shadow}" stroke-width="1"/>
    `;
    return pole + panel + details;
  },
});

// ------------------------------------------------------------------
// 7. Category: Sécurité - 5 Icons
// ------------------------------------------------------------------

export const firewallSec25d = makeIsometricPlugin({
  type: 'firewall-sec-25d',
  label: 'Firewall (Sécurité) 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Brick pattern
    let bricks = '';
    for (let r = 0; r < 5; r++) {
      const y = 8 + r * 9;
      bricks += `<line x1="8" y1="${y}" x2="104" y2="${y}" stroke="${t.shadow}" stroke-width="0.8"/>`;
      const offset = (r % 2) * 8;
      for (let c = 0; c < 6; c++) {
        const x = 16 + c * 16 + offset;
        if (x < 104) {
          bricks += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 9}" stroke="${t.shadow}" stroke-width="0.8"/>`;
        }
      }
    }
    const shield = `
      <path d="M 12,12 L 20,12 L 20,18 C 20,22 16,25 12,26 C 8,25 4,22 4,18 L 4,12 Z" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1"/>
    `;
    return chassis + bricks + shield;
  },
});

export const bastion25d = makeIsometricPlugin({
  type: 'bastion-25d',
  label: 'Bastion 2.5D',
  category: 'network',
  defaultSize: { width: 75, height: 126 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 58,
      H = 100,
      dx = 8,
      dy = 6;
    // Stone medieval tower chassis
    const chassis = chassis3D(W, H, dx, dy, t, { frontRadius: 0.2 });
    const battlements = `
      <path d="M 0,0 L 0,-6 L 12,-6 L 12,0 L 23,0 L 23,-6 L 35,-6 L 35,0 L 46,0 L 46,-6 L 58,-6 L 58,0 Z" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M 58,0 L 66,-6 L 66,94 L 58,100 Z" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round" opacity="0.6"/>
    `;
    const door = `
      <path d="M 20,100 L 20,75 C 20,68 38,68 38,75 L 38,100 Z" fill="${t.shadow}"/>
      <circle cx="34" cy="88" r="1.5" fill="${t.accent}"/>
    `;
    const loops = `
      <rect x="15" y="25" width="4" height="15" rx="1" fill="${t.shadow}"/>
      <rect x="39" y="25" width="4" height="15" rx="1" fill="${t.shadow}"/>
    `;
    return chassis + battlements + door + loops;
  },
});

export const waf25d = makeIsometricPlugin({
  type: 'waf-25d',
  label: 'WAF 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 71 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 112,
      H = 65,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Web application layout protected by shield
    const browser = `
      <rect x="8" y="10" width="96" height="45" rx="1" fill="${t.shadow}" opacity="0.95"/>
      <circle cx="14" cy="14" r="1.5" fill="#ef4444"/>
      <circle cx="20" cy="14" r="1.5" fill="#f59e0b"/>
      <circle cx="26" cy="14" r="1.5" fill="#10b981"/>
      <line x1="10" y1="20" x2="102" y2="20" stroke="${t.accent}" stroke-width="0.8" opacity="0.4"/>
      <rect x="14" y="25" width="30" height="24" fill="${t.accent}" opacity="0.2"/>
      <line x1="50" y1="28" x2="94" y2="28" stroke="${t.accent}" stroke-width="1.5" opacity="0.6"/>
      <line x1="50" y1="36" x2="80" y2="36" stroke="${t.accent}" stroke-width="1.5" opacity="0.6"/>
    `;
    const protectiveShield = `
      <path d="M 80,25 L 96,25 L 96,35 C 96,43 88,48 80,50 C 72,48 64,43 64,35 L 64,25 Z" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2"/>
      <text x="80" y="38" fill="${t.shadow}" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">W</text>
    `;
    return chassis + browser + protectiveShield;
  },
});

export const reverseProxySec25d = makeIsometricPlugin({
  type: 'reverse-proxy-sec-25d',
  label: 'Reverse Proxy Sec 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 66 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 112,
      H = 60,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Opposing incoming/outgoing filter arrows through central gateway
    const logic = `
      <rect x="52" y="10" width="8" height="40" rx="1" fill="${t.shadow}"/>
      <path d="M 12,22 L 52,22 M 52,22 L 98,15 M 52,22 L 98,28" stroke="${t.accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 98,38 L 52,38 M 52,38 L 12,38" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="56" cy="30" r="3" fill="${t.led}"/>
    `;
    return chassis + logic;
  },
});

export const siem25d = makeIsometricPlugin({
  type: 'siem-25d',
  label: 'SIEM 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 76 },
  defaultTheme: THEME_SECURITY,
  body: (t) => {
    const W = 112,
      H = 70,
      dx = 8,
      dy = 6;
    const chassis = chassis3D(W, H, dx, dy, t);
    // Radar grid scanning log events
    const radar = `
      <rect x="10" y="10" width="50" height="50" rx="1" fill="${t.shadow}"/>
      <circle cx="35" cy="35" r="20" fill="none" stroke="${t.led}" stroke-width="0.8" opacity="0.5"/>
      <circle cx="35" cy="35" r="10" fill="none" stroke="${t.led}" stroke-width="0.8" opacity="0.5"/>
      <line x1="35" y1="15" x2="35" y2="55" stroke="${t.led}" stroke-width="0.8" opacity="0.3"/>
      <line x1="15" y1="35" x2="55" y2="35" stroke="${t.led}" stroke-width="0.8" opacity="0.3"/>
      <line x1="35" y1="35" x2="50" y2="20" stroke="${t.led}" stroke-width="1.5" stroke-linecap="round"/>
    `;
    const logs = `
      <rect x="68" y="10" width="34" height="8" rx="0.5" fill="${t.shadow}"/>
      <rect x="68" y="22" width="34" height="8" rx="0.5" fill="${t.shadow}"/>
      <rect x="68" y="34" width="34" height="8" rx="0.5" fill="${t.shadow}"/>
      <line x1="72" y1="14" x2="90" y2="14" stroke="#eab308" stroke-width="1"/>
      <line x1="72" y1="26" x2="90" y2="26" stroke="${t.led}" stroke-width="1"/>
      <line x1="72" y1="38" x2="90" y2="38" stroke="#ef4444" stroke-width="1"/>
    `;
    return chassis + radar + logs;
  },
});

// ------------------------------------------------------------------
// 8. Category: Utilisateurs (Users) - 4 Icons
// ------------------------------------------------------------------

export const pc25d = makeIsometricPlugin({
  type: 'pc-25d',
  label: 'PC 2.5D',
  category: 'network',
  defaultSize: { width: 110, height: 101 },
  defaultTheme: THEME_USERS,
  body: (t) => {
    // 2.5D Monitor and keyboard
    const monitor = `
      <!-- monitor back depth -->
      <polygon points="15,10 85,10 90,5 20,5" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2"/>
      <polygon points="85,10 85,60 90,55 90,5" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2"/>
      <!-- screen front -->
      <rect x="15" y="10" width="70" height="50" rx="1" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.2"/>
      <rect x="18" y="13" width="64" height="40" fill="${t.shadow}"/>
      <!-- blue display wallpaper -->
      <path d="M 18,35 L 82,20 L 82,53 L 18,53 Z" fill="#2563eb" opacity="0.8"/>
      <!-- stand -->
      <polygon points="45,60 55,60 58,80 42,80" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1"/>
      <ellipse cx="50" cy="80" rx="18" ry="4" fill="${t.shadow}"/>
    `;
    const keyboard = `
      <!-- slanted keyboard -->
      <polygon points="20,86 80,86 85,95 15,95" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1" stroke-linejoin="round"/>
      <line x1="24" y1="89" x2="76" y2="89" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="1 1"/>
      <line x1="22" y1="92" x2="78" y2="92" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="1 1"/>
    `;
    return monitor + keyboard;
  },
});

export const laptop25d = makeIsometricPlugin({
  type: 'laptop-25d',
  label: 'Laptop 2.5D',
  category: 'network',
  defaultSize: { width: 100, height: 81 },
  defaultTheme: THEME_USERS,
  body: (t) => {
    // Slanted base (keyboard) + vertical screen
    const screen = `
      <polygon points="12,10 88,10 92,6 16,6" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2"/>
      <polygon points="88,10 88,52 92,48 92,6" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2"/>
      <rect x="12" y="10" width="76" height="42" rx="1" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.2"/>
      <rect x="16" y="14" width="68" height="34" fill="${t.shadow}"/>
      <rect x="20" y="18" width="60" height="26" fill="#1e3a8a"/>
    `;
    const keyboardBase = `
      <polygon points="6,52 94,52 102,72 0,72" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2" stroke-linejoin="round"/>
      <rect x="15" y="55" width="70" height="10" rx="0.5" fill="none" stroke="${t.shadow}" stroke-width="0.8" stroke-dasharray="2 1"/>
      <rect x="42" y="67" width="16" height="4" rx="0.2" fill="${t.shadow}"/>
    `;
    return screen + keyboardBase;
  },
});

export const workstation25d = makeIsometricPlugin({
  type: 'workstation-25d',
  label: 'Workstation 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 101 },
  defaultTheme: THEME_USERS,
  body: (t) => {
    // Combination of PC Monitor + Tower server
    const tower = `
      <g transform="translate(8, 8)">
        <polygon points="0,0 20,0 24,-3 4,-3" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1"/>
        <polygon points="20,0 20,78 24,75 24,-3" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1"/>
        <rect x="0" y="0" width="20" height="78" rx="0.5" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.1"/>
        <rect x="4" y="6" width="12" height="6" fill="${t.shadow}"/>
        <circle cx="10" cy="24" r="2.5" fill="${t.shadow}"/>
        <circle cx="10" cy="24" r="1" fill="${t.led}"/>
      </g>
    `;
    const monitor = `
      <g transform="translate(38, 0)">
        <rect x="10" y="15" width="64" height="45" rx="1" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.2"/>
        <rect x="13" y="18" width="58" height="36" fill="${t.shadow}"/>
        <polygon points="32,60 42,60 44,78 30,78" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1"/>
        <ellipse cx="37" cy="78" rx="15" ry="3" fill="${t.shadow}"/>
      </g>
    `;
    const keyboard = `
      <polygon points="46,84 106,84 111,92 41,92" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1" stroke-linejoin="round"/>
    `;
    return tower + monitor + keyboard;
  },
});

export const thinClient25d = makeIsometricPlugin({
  type: 'thin-client-25d',
  label: 'Thin Client 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 86 },
  defaultTheme: THEME_USERS,
  body: (t) => {
    // Small terminal unit + ghost monitor
    const monitorGhost = `
      <rect x="8" y="5" width="60" height="40" rx="1" fill="none" stroke="${t.shadow}" stroke-width="1" stroke-dasharray="2 3" opacity="0.5"/>
      <line x1="38" y1="45" x2="38" y2="60" stroke="${t.shadow}" stroke-width="1" opacity="0.3"/>
      <ellipse cx="38" cy="60" rx="12" ry="2.5" fill="${t.shadow}" opacity="0.2"/>
    `;
    const miniBox = `
      <g transform="translate(45, 30)">
        <polygon points="0,0 26,0 30,-3 4,-3" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1"/>
        <polygon points="26,0 26,45 30,42 30,-3" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1"/>
        <rect x="0" y="0" width="26" height="45" rx="1" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.2"/>
        <circle cx="13" cy="12" r="3" fill="${t.shadow}"/>
        <circle cx="13" cy="12" r="1.2" fill="${t.led}"/>
        <line x1="6" y1="25" x2="20" y2="25" stroke="${t.shadow}" stroke-width="0.8"/>
        <line x1="6" y1="30" x2="20" y2="30" stroke="${t.shadow}" stroke-width="0.8"/>
      </g>
    `;
    return monitorGhost + miniBox;
  },
});

// ------------------------------------------------------------------
// 9. Category: Périphériques (Peripherals) - 4 Icons
// ------------------------------------------------------------------

export const imprimante25d = makeIsometricPlugin({
  type: 'imprimante-25d',
  label: 'Imprimante 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 86 },
  defaultTheme: THEME_PERIPHERALS,
  body: (t) => {
    const W = 76,
      H = 55,
      dx = 8,
      dy = 6;
    const base = chassis3D(W, H, dx, dy, t, { frontRadius: 2 });
    // Top feeder and paper out
    const topFeeder = `
      <polygon points="12,0 64,0 68,-10 16,-10" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1"/>
      <rect x="20" y="-8" width="36" height="8" fill="#ffffff" stroke="${t.shadow}" stroke-width="0.8"/>
    `;
    const paperOut = `
      <rect x="18" y="24" width="40" height="15" rx="0.5" fill="${t.shadow}" opacity="0.9"/>
      <path d="M 22,34 L 54,34 L 54,48 L 22,48 Z" fill="#ffffff" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="26" y1="38" x2="50" y2="38" stroke="${t.shadow}" stroke-width="0.5"/>
      <line x1="26" y1="42" x2="44" y2="42" stroke="${t.shadow}" stroke-width="0.5"/>
      ${led(66, 12, 1, t.led, t)}
    `;
    return base + topFeeder + paperOut;
  },
});

export const scanner25d = makeIsometricPlugin({
  type: 'scanner-25d',
  label: 'Scanner 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 71 },
  defaultTheme: THEME_PERIPHERALS,
  body: (t) => {
    const W = 77,
      H = 35,
      dx = 8,
      dy = 6;
    // Flatbed bed
    const bed = chassis3D(W, H, dx, dy, t);
    // Lid open at 15 degree angle
    const lid = `
      <g transform="translate(0, 0) rotate(-15, 0, 0)">
        <polygon points="0,0 ${W},0 ${W + dx},${-dy} ${dx},${-dy}" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2"/>
        <line x1="10" y1="-2" x2="68" y2="-2" stroke="${t.shadow}" stroke-width="1.5" stroke-linecap="round"/>
      </g>
      <!-- Glass scanning light -->
      <rect x="8" y="8" width="60" height="18" fill="none" stroke="${t.shadow}" stroke-width="1"/>
      <line x1="28" y1="8" x2="28" y2="26" stroke="#22d3ee" stroke-width="2" opacity="0.8"/>
    `;
    return bed + lid;
  },
});

export const telephoneIp25d = makeIsometricPlugin({
  type: 'telephone-ip-25d',
  label: 'Téléphone IP 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 91 },
  defaultTheme: THEME_PERIPHERALS,
  body: (t) => {
    const W = 68,
      H = 60,
      dx = 6,
      dy = 4;
    // Slanted base phone unit
    const base = chassis3D(W, H, dx, dy, t);
    const handset = `
      <rect x="8" y="10" width="18" height="42" rx="3" fill="${t.shadow}" stroke="${t.shadow}" stroke-width="1"/>
      <line x1="17" y1="18" x2="17" y2="44" stroke="${t.accent}" stroke-width="1" opacity="0.4"/>
    `;
    const screenKeypad = `
      <rect x="34" y="10" width="26" height="18" rx="0.5" fill="${t.shadow}"/>
      <rect x="37" y="12" width="20" height="12" fill="#60a5fa"/>
      
      <!-- Keypad matrix -->
      <circle cx="38" cy="36" r="1" fill="${t.accent}"/>
      <circle cx="46" cy="36" r="1" fill="${t.accent}"/>
      <circle cx="54" cy="36" r="1" fill="${t.accent}"/>
      <circle cx="38" cy="43" r="1" fill="${t.accent}"/>
      <circle cx="46" cy="43" r="1" fill="${t.accent}"/>
      <circle cx="54" cy="43" r="1" fill="${t.accent}"/>
      <circle cx="38" cy="50" r="1" fill="${t.accent}"/>
      <circle cx="46" cy="50" r="1" fill="${t.accent}"/>
      <circle cx="54" cy="50" r="1" fill="${t.accent}"/>
    `;
    return base + handset + screenKeypad;
  },
});

export const cameraIp25d = makeIsometricPlugin({
  type: 'camera-ip-25d',
  label: 'Caméra IP 2.5D',
  category: 'network',
  defaultSize: { width: 80, height: 101 },
  defaultTheme: THEME_PERIPHERALS,
  body: (t) => {
    // Bullet camera pointing down-left, with mount
    const mount = `
      <path d="M 68,45 L 45,45 L 45,70" fill="none" stroke="${t.shadow}" stroke-width="3.5" stroke-linecap="round"/>
      <polygon points="38,70 52,70 48,75 42,75" fill="${t.shadow}"/>
    `;
    const cameraCylinder = `
      <g transform="rotate(25, 40, 35)">
        ${cylinder3D(40, 35, 14, 8, 32, t, 1.2)}
        <!-- Lens glass -->
        <ellipse cx="40" cy="35" rx="8" ry="4" fill="${t.shadow}"/>
        <circle cx="40" cy="35" r="2" fill="#ef4444"/>
      </g>
    `;
    return mount + cameraCylinder;
  },
});

// ------------------------------------------------------------------
// 10. Category: Cloud - 4 Icons
// ------------------------------------------------------------------

export const cloudGeneric25d = makeIsometricPlugin({
  type: 'cloud-generic-25d',
  label: 'Cloud Générique 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 76 },
  defaultTheme: THEME_CLOUD,
  body: (t) => {
    const W = 112,
      H = 70,
      dx = 8,
      dy = 6;
    return cloud3D(W, H, dx, dy, t);
  },
});

export const datacenterCloud25d = makeIsometricPlugin({
  type: 'datacenter-cloud-25d',
  label: 'Datacenter Cloud 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 101 },
  defaultTheme: THEME_CLOUD,
  body: (t) => {
    const W = 112,
      H = 70,
      dx = 8,
      dy = 6;
    // Cloud on top, server rack base peaking out at bottom
    const rackTheme = { ...THEME_DATACENTER, shadow: t.shadow };
    const rackBase = `
      <g transform="translate(36, 45)">
        ${chassis3D(40, 48, 6, 4, rackTheme)}
        <rect x="6" y="8" width="28" height="6" fill="${t.shadow}"/>
        <rect x="6" y="20" width="28" height="6" fill="${t.shadow}"/>
        <rect x="6" y="32" width="28" height="6" fill="${t.shadow}"/>
      </g>
    `;
    const cloudTop = `<g transform="translate(0, 0)">${cloud3D(W, H, dx, dy, t)}</g>`;
    return rackBase + cloudTop;
  },
});

export const internet25d = makeIsometricPlugin({
  type: 'internet-25d',
  label: 'Internet 2.5D',
  category: 'network',
  defaultSize: { width: 90, height: 96 },
  defaultTheme: THEME_CLOUD,
  body: (t) => {
    // 2.5D Globe with latitude/longitude grid and network points
    const cx = 45,
      cy = 48,
      r = 38;
    const backShadow = `
      <ellipse cx="${cx + 4}" cy="${cy - 3}" rx="${r}" ry="${r - 8}" fill="${t.screen}" stroke="${t.shadow}" stroke-width="1.2"/>
    `;
    const globe = `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.5"/>
      <!-- Latitudes -->
      <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="12" fill="none" stroke="${t.accent}" stroke-width="0.8" opacity="0.6"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="24" fill="none" stroke="${t.accent}" stroke-width="0.8" opacity="0.6"/>
      <!-- Longitudes -->
      <ellipse cx="${cx}" cy="${cy}" rx="14" ry="${r}" fill="none" stroke="${t.accent}" stroke-width="0.8" opacity="0.6"/>
      <ellipse cx="${cx}" cy="${cy}" rx="28" ry="${r}" fill="none" stroke="${t.accent}" stroke-width="0.8" opacity="0.6"/>
      <!-- Grid lines -->
      <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${t.accent}" stroke-width="0.8" opacity="0.6"/>
      <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="${t.accent}" stroke-width="0.8" opacity="0.6"/>
      <!-- Connectors/nodes -->
      <circle cx="${cx - 15}" cy="${cy - 12}" r="3" fill="${t.led}" stroke="${t.shadow}" stroke-width="0.8"/>
      <circle cx="${cx + 20}" cy="${cy - 8}" r="3" fill="${t.led}" stroke="${t.shadow}" stroke-width="0.8"/>
      <circle cx="${cx - 8}" cy="${cy + 18}" r="3" fill="${t.led}" stroke="${t.shadow}" stroke-width="0.8"/>
      <circle cx="${cx + 18}" cy="${cy + 16}" r="3" fill="${t.led}" stroke="${t.shadow}" stroke-width="0.8"/>
      <!-- connection lines -->
      <line x1="${cx - 15}" y1="${cy - 12}" x2="${cx + 20}" y2="${cy - 8}" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="${cx - 15}" y1="${cy - 12}" x2="${cx - 8}" y2="${cy + 18}" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="${cx + 20}" y1="${cy - 8}" x2="${cx + 18}" y2="${cy + 16}" stroke="${t.shadow}" stroke-width="0.8"/>
      <line x1="${cx - 8}" y1="${cy + 18}" x2="${cx + 18}" y2="${cy + 16}" stroke="${t.shadow}" stroke-width="0.8"/>
    `;
    return backShadow + globe;
  },
});

export const saas25d = makeIsometricPlugin({
  type: 'saas-25d',
  label: 'SaaS 2.5D',
  category: 'network',
  defaultSize: { width: 120, height: 96 },
  defaultTheme: THEME_CLOUD,
  body: (t) => {
    const W = 112,
      H = 68,
      dx = 8,
      dy = 6;
    const cloud = cloud3D(W, H, dx, dy, t);
    // Gear wheel overlay in center
    const gear = `
      <g transform="translate(56, 34)">
        <circle cx="0" cy="0" r="12" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2"/>
        <circle cx="0" cy="0" r="5" fill="${t.body}" stroke="${t.shadow}" stroke-width="1.2"/>
        <!-- teeth -->
        <path d="M -2,-16 L 2,-16 L 3,-12 L -3,-12 Z
                 M -2,16 L 2,16 L 3,12 L -3,12 Z
                 M -16,-2 L -16,2 L -12,3 L -12,-3 Z
                 M 16,-2 L 16,2 L 12,3 L 12,-3 Z" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1" stroke-linejoin="round"/>
      </g>
    `;
    return cloud + gear;
  },
});

// ------------------------------------------------------------------
// Exports List
// ------------------------------------------------------------------

export const isometric25dPlugins: ShapePlugin[] = [
  // Réseau
  router25d,
  coreRouter25d,
  edgeRouter25d,
  switch25d,
  coreSwitch25d,
  distributionSwitch25d,
  accessSwitch25d,
  l3Switch25d,
  firewall25d,
  vpnGateway25d,
  loadBalancer25d,
  proxy25d,
  ids25d,
  ips25d,
  sdwanAppliance25d,

  // Datacenter
  rack25d,
  rackEmpty25d,
  rackFull25d,
  patchPanel25d,
  odf25d,
  pdu25d,
  ups25d,
  kvm25d,

  // Serveurs
  serverRack25d,
  serverTower25d,
  bladeServer25d,
  hypervisor25d,
  cluster25d,

  // Stockage
  nas25d,
  san25d,
  baieStockage25d,
  backupAppliance25d,

  // Télécom
  pop25d,
  olt25d,
  ont25d,
  dslam25d,
  antenne25d,
  faisceauHertzien25d,
  cellTower25d,
  satelliteGateway25d,

  // Wifi
  accessPoint25d,
  wirelessController25d,
  antenneIndoor25d,
  antenneOutdoor25d,

  // Sécurité
  firewallSec25d,
  bastion25d,
  waf25d,
  reverseProxySec25d,
  siem25d,

  // Utilisateurs
  pc25d,
  laptop25d,
  workstation25d,
  thinClient25d,

  // Périphériques
  imprimante25d,
  scanner25d,
  telephoneIp25d,
  cameraIp25d,

  // Cloud
  cloudGeneric25d,
  datacenterCloud25d,
  internet25d,
  saas25d,
];
