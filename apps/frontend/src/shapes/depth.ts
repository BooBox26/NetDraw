// 2.5D network device shapes — Visio / draw.io style.
//
// Design philosophy:
//   * Silhouette first: each device is recognizable from its outline alone,
//     before reading the inside details. The collection covers Cisco-style
//     network gear (routers, switches) in the spirit of the default Visio
//     and draw.io stencils.
//   * Cabinet projection: 3 visible faces (front, top, right) give a
//     subtle 3D depth. No cast shadow — depth is conveyed by the three
//     faces alone.
//   * Minimal surface detail: 1–2 LEDs, a simplified port grid, no brand
//     strips, no labels. 2–3 colors per shape (body / accent / screen).
//   * Each device type has a distinctive marker:
//       Router              → circular "routing" glyph (Cisco icon)
//       Core Router         → two-bay chassis, strong center divider, red
//       Edge Router         → WAN/LAN split with side "wall" rails
//       Switch              → clean row of port dots
//       Core Switch         → three vertical module bays
//       Distribution Switch → main port area + separated uplink module
//
// Slot usage:
//   body   → front face (the main color of the device)
//   accent → top face (lighter) + highlight accents
//   screen → right side (darker) + recessed port cavities
//   led    → LED indicator fill
//   shadow → outline / stroke

import type { ColorSlot, ShapePlugin } from './types';

// ------------------------------------------------------------------
// Color slots and defaults
// ------------------------------------------------------------------

const DEPTH_SLOTS: ColorSlot[] = [
  {
    id: 'body',
    label: 'Chassis (front face)',
    default: '#0ea5e9',
    target: 'fill',
    group: 'Depth Surfaces',
  },
  {
    id: 'accent',
    label: 'Top face (highlight)',
    default: '#bae6fd',
    target: 'fill',
    group: 'Depth Surfaces',
  },
  {
    id: 'screen',
    label: 'Right side / port cavity',
    default: '#0c4a6e',
    target: 'fill',
    group: 'Depth Surfaces',
  },
  { id: 'led', label: 'LED indicators', default: '#22c55e', target: 'fill', group: 'Status' },
  { id: 'shadow', label: 'Edge / stroke', default: '#082f49', target: 'stroke', group: 'Outline' },
];

interface DepthTheme {
  body: string;
  accent: string;
  screen: string;
  led: string;
  shadow: string;
}

// ------------------------------------------------------------------
// 3D chassis builder (no cast shadow)
// ------------------------------------------------------------------

interface ChassisResult {
  svg: string;
  fx: number;
  fy: number;
  fw: number;
  fh: number;
  dx: number;
  dy: number;
  canvasW: number;
  canvasH: number;
}

/**
 * 3 visible faces of a box (cabinet projection, no shadow):
 *   - Top face     (lighter, slot accent)
 *   - Right face   (darker, slot screen)
 *   - Front face   (main, slot body)
 *
 * Front face spans (0, 0) to (W, H). The top + right faces extend up-right
 * by (dx, dy).
 */
function chassis3D(
  W: number,
  H: number,
  dx: number,
  dy: number,
  t: DepthTheme,
  opts: { frontRadius?: number; strokeWidth?: number } = {}
): ChassisResult {
  const r = opts.frontRadius ?? 1.5;
  const sw = opts.strokeWidth ?? 1.3;

  const top = `
    <polygon points="0,0 ${W},0 ${W + dx},${-dy} ${dx},${-dy}"
      fill="${t.accent}" stroke="${t.shadow}" stroke-width="${sw}" stroke-linejoin="round"/>
  `;
  const right = `
    <polygon points="${W},0 ${W},${H} ${W + dx},${H - dy} ${W + dx},${-dy}"
      fill="${t.screen}" stroke="${t.shadow}" stroke-width="${sw}" stroke-linejoin="round"/>
  `;
  const front = `
    <rect x="0" y="0" width="${W}" height="${H}" rx="${r}"
      fill="${t.body}" stroke="${t.shadow}" stroke-width="${sw + 0.2}"/>
  `;

  return {
    svg: top + right + front,
    fx: 0,
    fy: 0,
    fw: W,
    fh: H,
    dx,
    dy,
    canvasW: W + dx,
    canvasH: H + dy,
  };
}

// ------------------------------------------------------------------
// Tiny front-face helpers
// ------------------------------------------------------------------

/** Recessed port cavity — a small dark rect with a thin top highlight. */
function port(x: number, y: number, w: number, h: number, t: DepthTheme): string {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0.6"
      fill="${t.shadow}" opacity="0.92"/>
    <line x1="${x + 0.5}" y1="${y + 0.3}" x2="${x + w - 0.5}" y2="${y + 0.3}"
      stroke="${t.accent}" stroke-width="0.4" opacity="0.55"/>
  `;
}

/** Recessed port with a small LED dot. */
function portWithLed(
  x: number,
  y: number,
  w: number,
  h: number,
  t: DepthTheme,
  ledColor: string
): string {
  return (
    port(x, y, w, h, t) + `<circle cx="${x + w - 0.8}" cy="${y + 0.8}" r="0.5" fill="${ledColor}"/>`
  );
}

/** Status LED with thin halo. */
function led(x: number, y: number, r: number, color: string, t: DepthTheme): string {
  return `
    <circle cx="${x}" cy="${y}" r="${r + 0.6}" fill="${t.shadow}" opacity="0.45"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>
  `;
}

// ------------------------------------------------------------------
// 1. ROUTER (1U, classic circular routing glyph)
// ------------------------------------------------------------------
function routerBody(t: DepthTheme): string {
  const W = 110,
    H = 64;
  const dx = 7,
    dy = 5;
  const parts: string[] = [chassis3D(W, H, dx, dy, t).svg];

  // Cisco-style circular routing glyph on the left
  const cx = 22,
    cy = H / 2,
    r = 16;
  parts.push(`
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.accent}" stroke="${t.shadow}" stroke-width="1.2"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="${t.body}" stroke="${t.shadow}" stroke-width="0.8"/>
    <circle cx="${cx}" cy="${cy}" r="2.2" fill="${t.shadow}"/>
  `);
  // 4 directional arrows around the circle
  for (const [dxA, dyA] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ] as const) {
    const ax = cx + dxA * (r + 4);
    const ay = cy + dyA * (r + 4);
    const tipX = cx + dxA * (r + 9);
    const tipY = cy + dyA * (r + 9);
    parts.push(
      `<path d="M ${ax},${ay} L ${tipX},${tipY}" stroke="${t.shadow}" stroke-width="1.6" stroke-linecap="round"/>`
    );
    // arrow head
    const headDx = dxA === 0 ? 3 : 2.5;
    const headDy = dyA === 0 ? 3 : 2.5;
    parts.push(
      `<path d="M ${tipX - (dxA === 0 ? 0 : headDx * Math.sign(dxA))},${tipY - (dyA === 0 ? 0 : headDy * Math.sign(dyA))} L ${tipX},${tipY} L ${tipX + (dxA === 0 ? 0 : -headDx * Math.sign(dxA))},${tipY + (dyA === 0 ? 0 : -headDy * Math.sign(dyA))}" stroke="${t.shadow}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    );
  }

  // 6 simple ports on the right (2 rows × 3)
  const portX = 50,
    portY = 12,
    portW = 14,
    portH = 9,
    gapX = 17,
    gapY = 14;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const x = portX + col * gapX;
      const y = portY + row * gapY;
      const led = (row + col) % 2 === 0 ? t.led : '#facc15';
      parts.push(portWithLed(x, y, portW, portH, t, led));
    }
  }

  // 1 status LED
  parts.push(led(W - 8, 8, 1.3, t.led, t));

  return parts.join('');
}

// ------------------------------------------------------------------
// 2. CORE ROUTER (dual-bay, strong center divider, red)
// ------------------------------------------------------------------
function coreRouterBody(t: DepthTheme): string {
  const W = 140,
    H = 78;
  const dx = 8,
    dy = 6;
  const parts: string[] = [chassis3D(W, H, dx, dy, t).svg];

  // Strong central spine (a vertical bar that visually splits the chassis)
  const spineX = W / 2;
  parts.push(
    `<rect x="${spineX - 2}" y="2" width="4" height="${H - 4}" rx="0.5" fill="${t.shadow}" opacity="0.7"/>`
  );
  parts.push(
    `<line x1="${spineX}" y1="4" x2="${spineX}" y2="${H - 4}" stroke="${t.accent}" stroke-width="0.6" opacity="0.5"/>`
  );

  // Two bays, each with a 2x3 port grid
  const bayW = (W - 16) / 2;
  const portW = 13,
    portH = 8,
    gapX = 16,
    gapY = 13;
  for (let bay = 0; bay < 2; bay++) {
    const bayX = 8 + bay * bayW;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = bayX + 4 + col * gapX;
        const y = 12 + row * gapY;
        const led = (bay + row + col) % 2 === 0 ? t.led : '#facc15';
        parts.push(portWithLed(x, y, portW, portH, t, led));
      }
    }
  }

  // 1 status LED per bay (top corners)
  parts.push(led(8, 6, 1.3, t.led, t));
  parts.push(led(W - 8, 6, 1.3, '#facc15', t));

  return parts.join('');
}

// ------------------------------------------------------------------
// 3. EDGE ROUTER (WAN/LAN split + side "wall" rails)
// ------------------------------------------------------------------
function edgeRouterBody(t: DepthTheme): string {
  const W = 120,
    H = 68;
  const dx = 7,
    dy = 5;
  const parts: string[] = [chassis3D(W, H, dx, dy, t).svg];

  // Side rails (the "edge" / "wall" indicator)
  for (let i = 0; i < 4; i++) {
    const ry = 10 + i * 12;
    parts.push(
      `<rect x="3" y="${ry}" width="2" height="8" rx="0.3" fill="${t.shadow}" opacity="0.7"/>`
    );
    parts.push(
      `<rect x="${W - 5}" y="${ry}" width="2" height="8" rx="0.3" fill="${t.shadow}" opacity="0.7"/>`
    );
  }

  // Inset face panel
  parts.push(
    `<rect x="10" y="8" width="${W - 20}" height="${H - 16}" rx="1.2" fill="${t.screen}" stroke="${t.shadow}" stroke-width="0.6"/>`
  );

  // WAN / LAN vertical divider
  const splitX = W / 2;
  parts.push(
    `<line x1="${splitX}" y1="12" x2="${splitX}" y2="${H - 12}" stroke="${t.accent}" stroke-width="0.6" opacity="0.45"/>`
  );

  // WAN side: 2 ports stacked
  parts.push(portWithLed(14, 14, 22, 9, t, t.led));
  parts.push(portWithLed(14, 28, 22, 9, t, '#facc15'));

  // LAN side: 4 ports (2x2)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const x = splitX + 4 + col * 13;
      const y = 14 + row * 13;
      const ledColor = (row + col) % 2 === 0 ? t.led : '#facc15';
      parts.push(portWithLed(x, y, 11, 9, t, ledColor));
    }
  }

  // 1 status LED
  parts.push(led(W / 2, 4, 1.3, t.led, t));

  return parts.join('');
}

// ------------------------------------------------------------------
// 4. SWITCH (1U, simple row of ports)
// ------------------------------------------------------------------
function switchBody(t: DepthTheme): string {
  const W = 130,
    H = 60;
  const dx = 7,
    dy = 5;
  const parts: string[] = [chassis3D(W, H, dx, dy, t).svg];

  // 12 simple port dots in a single row
  const portW = 7,
    portH = 12,
    startX = 8,
    gapX = (W - 16) / 12;
  for (let i = 0; i < 12; i++) {
    const x = startX + i * gapX + (gapX - portW) / 2;
    const y = (H - portH) / 2;
    const led = i % 3 === 0 ? t.led : i % 3 === 1 ? '#facc15' : t.led;
    parts.push(portWithLed(x, y, portW, portH, t, led));
  }

  // 1 status LED
  parts.push(led(W - 6, 6, 1.3, t.led, t));

  return parts.join('');
}

// ------------------------------------------------------------------
// 5. CORE SWITCH (3 module bays with vertical separators)
// ------------------------------------------------------------------
function coreSwitchBody(t: DepthTheme): string {
  const W = 150,
    H = 80;
  const dx = 8,
    dy = 6;
  const parts: string[] = [chassis3D(W, H, dx, dy, t).svg];

  // Two thick vertical separators (creating 3 bays)
  const bayW = (W - 12) / 3;
  for (let i = 1; i <= 2; i++) {
    const sx = 6 + bayW * i;
    parts.push(
      `<rect x="${sx - 1.5}" y="3" width="3" height="${H - 6}" rx="0.5" fill="${t.shadow}" opacity="0.7"/>`
    );
    parts.push(
      `<line x1="${sx}" y1="5" x2="${sx}" y2="${H - 5}" stroke="${t.accent}" stroke-width="0.5" opacity="0.4"/>`
    );
  }

  // 6 ports per bay (2 rows × 3)
  const portW = 12,
    portH = 8,
    gapX = (bayW - 8) / 3,
    gapY = 12;
  for (let bay = 0; bay < 3; bay++) {
    const bayX = 6 + bay * bayW;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = bayX + 4 + col * gapX;
        const y = 14 + row * gapY;
        const led = (bay + row + col) % 2 === 0 ? t.led : '#facc15';
        parts.push(portWithLed(x, y, portW, portH, t, led));
      }
    }
  }

  // 1 LED per bay (bottom-center)
  for (let bay = 0; bay < 3; bay++) {
    parts.push(led(6 + bay * bayW + bayW / 2, H - 6, 1.2, t.led, t));
  }

  return parts.join('');
}

// ------------------------------------------------------------------
// 6. DISTRIBUTION SWITCH (main port area + separate uplink module)
// ------------------------------------------------------------------
function distributionSwitchBody(t: DepthTheme): string {
  const W = 130,
    H = 76;
  const dx = 8,
    dy = 5;
  const parts: string[] = [chassis3D(W, H, dx, dy, t).svg];

  // Strong vertical divider between main ports and uplink module
  const divX = W - 28;
  parts.push(
    `<rect x="${divX - 1.5}" y="4" width="3" height="${H - 8}" rx="0.5" fill="${t.shadow}" opacity="0.7"/>`
  );
  parts.push(
    `<line x1="${divX}" y1="6" x2="${divX}" y2="${H - 6}" stroke="${t.accent}" stroke-width="0.5" opacity="0.4"/>`
  );

  // Main port area: 12 ports in 2 rows × 6
  const mainW = divX - 10;
  const portW = 12,
    portH = 8,
    gapX = (mainW - 8) / 6,
    gapY = 12;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 10 + col * gapX;
      const y = 14 + row * gapY;
      const led = (row + col) % 2 === 0 ? t.led : '#facc15';
      parts.push(portWithLed(x, y, portW, portH, t, led));
    }
  }

  // Uplink module: 4 SFP+ in 2x2 (clearly separate)
  const upX = divX + 3,
    upW = W - upX - 6;
  const sfpW = 9,
    sfpH = 13;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const x = upX + col * (sfpW + 1);
      const y = 12 + row * (sfpH + 2);
      parts.push(portWithLed(x, y, sfpW, sfpH, t, t.led));
    }
  }

  // 1 LED per zone
  parts.push(led(8, 6, 1.2, t.led, t));
  parts.push(led(upX + upW / 2 - 1, 6, 1.2, '#facc15', t));

  return parts.join('');
}

// ------------------------------------------------------------------
// Plugin factory
// ------------------------------------------------------------------

interface DepthConfig {
  type: string;
  label: string;
  defaultSize: { width: number; height: number };
  defaultTheme: DepthTheme;
  body: (theme: DepthTheme) => string;
}

const DEFAULTS: DepthTheme = {
  body: '#0ea5e9',
  accent: '#bae6fd',
  screen: '#0c4a6e',
  led: '#22c55e',
  shadow: '#082f49',
};

function makeDepthPlugin(cfg: DepthConfig): ShapePlugin {
  return {
    type: cfg.type,
    category: 'network',
    label: cfg.label,
    defaultStyle: {
      fill: '#ffffff',
      stroke: DEFAULTS.shadow,
      strokeWidth: 1.5,
      theme: { ...cfg.defaultTheme },
    },
    defaultSize: cfg.defaultSize,
    colorSlots: DEPTH_SLOTS,
    defaultTheme: { ...cfg.defaultTheme },
    preview: (color = DEFAULTS.shadow) => {
      const theme: DepthTheme = { ...cfg.defaultTheme };
      if (color && color !== DEFAULTS.shadow) {
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
      const theme: DepthTheme = {
        ...DEFAULTS,
        ...(s.style.theme ?? {}),
      };
      return `<g transform="scale(${sx} ${sy})" opacity="${s.style.opacity}">${cfg.body(theme)}</g>`;
    },
  };
}

// ------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------

export const depthRouterPlugin: ShapePlugin = makeDepthPlugin({
  type: 'router-2d',
  label: 'Router',
  defaultSize: { width: 118, height: 70 },
  defaultTheme: {
    body: '#0ea5e9',
    accent: '#bae6fd',
    screen: '#0c4a6e',
    led: '#22c55e',
    shadow: '#082f49',
  },
  body: routerBody,
});

export const depthCoreRouterPlugin: ShapePlugin = makeDepthPlugin({
  type: 'core-router-2d',
  label: 'Core Router',
  defaultSize: { width: 149, height: 85 },
  defaultTheme: {
    body: '#b91c1c',
    accent: '#fecaca',
    screen: '#7f1d1d',
    led: '#22c55e',
    shadow: '#450a0a',
  },
  body: coreRouterBody,
});

export const depthEdgeRouterPlugin: ShapePlugin = makeDepthPlugin({
  type: 'edge-router-2d',
  label: 'Edge Router',
  defaultSize: { width: 128, height: 74 },
  defaultTheme: {
    body: '#ea580c',
    accent: '#fed7aa',
    screen: '#7c2d12',
    led: '#22c55e',
    shadow: '#431407',
  },
  body: edgeRouterBody,
});

export const depthSwitchPlugin: ShapePlugin = makeDepthPlugin({
  type: 'switch-2d',
  label: 'Switch',
  defaultSize: { width: 138, height: 66 },
  defaultTheme: {
    body: '#1e293b',
    accent: '#94a3b8',
    screen: '#0f172a',
    led: '#22c55e',
    shadow: '#020617',
  },
  body: switchBody,
});

export const depthCoreSwitchPlugin: ShapePlugin = makeDepthPlugin({
  type: 'core-switch-2d',
  label: 'Core Switch',
  defaultSize: { width: 159, height: 87 },
  defaultTheme: {
    body: '#0f172a',
    accent: '#475569',
    screen: '#020617',
    led: '#22c55e',
    shadow: '#000000',
  },
  body: coreSwitchBody,
});

export const depthDistributionSwitchPlugin: ShapePlugin = makeDepthPlugin({
  type: 'distribution-switch-2d',
  label: 'Distribution Switch',
  defaultSize: { width: 139, height: 82 },
  defaultTheme: {
    body: '#0d9488',
    accent: '#5eead4',
    screen: '#134e4a',
    led: '#22c55e',
    shadow: '#042f2e',
  },
  body: distributionSwitchBody,
});

export const depthPlugins: ShapePlugin[] = [
  depthRouterPlugin,
  depthCoreRouterPlugin,
  depthEdgeRouterPlugin,
  depthSwitchPlugin,
  depthCoreSwitchPlugin,
  depthDistributionSwitchPlugin,
];

export const DEPTH_DEFAULT_THEME = DEFAULTS;
