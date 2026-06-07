// Specialized network, telecom, cloud, security, IoT, storage, and patch panel shapes.
// Follows the same modular body-rendering pattern as network.ts.

import type { ShapePlugin } from './types';
import { NETWORK_SLOTS } from './network';

interface SpecIconConfig {
  type: string;
  label: string;
  defaultSize: { width: number; height: number };
  defaultStyle: { fill: string; stroke: string; strokeWidth: number };
  body: (color: string, theme?: Record<string, string>) => string;
}

const specIcons: SpecIconConfig[] = [
  // --- PATCH PANELS & BRASSAGE ---
  {
    type: 'patch-panel-cu',
    label: 'Copper Patch Panel',
    defaultSize: { width: 140, height: 40 },
    defaultStyle: { fill: '#1e293b', stroke: '#cbd5e1', strokeWidth: 1.2 },
    body: (color) => `
      <rect x="2" y="4" width="136" height="32" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>
      <rect x="10" y="10" width="12" height="10" fill="#0f172a" stroke="${color}" stroke-width="0.8"/>
      <rect x="30" y="10" width="12" height="10" fill="#0f172a" stroke="${color}" stroke-width="0.8"/>
      <rect x="50" y="10" width="12" height="10" fill="#0f172a" stroke="${color}" stroke-width="0.8"/>
      <rect x="70" y="10" width="12" height="10" fill="#0f172a" stroke="${color}" stroke-width="0.8"/>
      <rect x="90" y="10" width="12" height="10" fill="#0f172a" stroke="${color}" stroke-width="0.8"/>
      <rect x="110" y="10" width="12" height="10" fill="#0f172a" stroke="${color}" stroke-width="0.8"/>
      <line x1="16" y1="20" x2="16" y2="24" stroke="#64748b" stroke-width="1"/>
      <line x1="36" y1="20" x2="36" y2="24" stroke="#64748b" stroke-width="1"/>
      <line x1="56" y1="20" x2="56" y2="24" stroke="#64748b" stroke-width="1"/>
      <line x1="76" y1="20" x2="76" y2="24" stroke="#64748b" stroke-width="1"/>
      <line x1="96" y1="20" x2="96" y2="24" stroke="#64748b" stroke-width="1"/>
      <line x1="116" y1="20" x2="116" y2="24" stroke="#64748b" stroke-width="1"/>
    `,
  },
  {
    type: 'odf-fiber',
    label: 'Fiber ODF Panel',
    defaultSize: { width: 140, height: 40 },
    defaultStyle: { fill: '#0f172a', stroke: '#ea580c', strokeWidth: 1.2 },
    body: (color) => `
      <rect x="2" y="4" width="136" height="32" rx="1" fill="#0f172a" stroke="${color}" stroke-width="1.5"/>
      ${[0, 1, 2, 3, 4, 5]
        .map(
          (i) => `
        <circle cx="${14 + i * 22}" cy="20" r="4" fill="#3b82f6" stroke="${color}" stroke-width="0.8"/>
        <circle cx="${22 + i * 22}" cy="20" r="4" fill="#ea580c" stroke="${color}" stroke-width="0.8"/>
      `
        )
        .join('')}
    `,
  },
  {
    type: 'sfp-module',
    label: 'SFP Transceiver',
    defaultSize: { width: 90, height: 40 },
    defaultStyle: { fill: '#f1f5f9', stroke: '#475569', strokeWidth: 1.2 },
    body: (color) => `
      <rect x="4" y="10" width="82" height="20" rx="2" fill="#e2e8f0" stroke="${color}" stroke-width="1.5"/>
      <rect x="8" y="14" width="16" height="12" fill="#94a3b8" stroke="${color}" stroke-width="0.8"/>
      <circle cx="12" cy="20" r="2" fill="#000"/>
      <circle cx="20" cy="20" r="2" fill="#000"/>
      <line x1="30" y1="14" x2="30" y2="26" stroke="${color}" stroke-width="1"/>
      <line x1="36" y1="14" x2="36" y2="26" stroke="${color}" stroke-width="1"/>
      <path d="M50 15 H78 V25 H50 Z" fill="none" stroke="${color}" stroke-width="1"/>
      <text x="64" y="22" font-family="sans-serif" font-size="6" font-weight="bold" fill="#475569" text-anchor="middle">SFP</text>
    `,
  },

  // --- TELECOM OPERATOR & FTTH ---
  {
    type: 'pop',
    label: 'Point of Presence (POP)',
    defaultSize: { width: 100, height: 90 },
    defaultStyle: { fill: '#eff6ff', stroke: '#1d4ed8', strokeWidth: 1.5 },
    body: (color) => `
      <path d="M10 40 L50 15 L90 40 L90 80 L10 80 Z" fill="#eff6ff" stroke="${color}" stroke-width="1.8"/>
      <rect x="25" y="45" width="50" height="28" rx="2" fill="#fff" stroke="${color}" stroke-width="1.2"/>
      <circle cx="38" cy="59" r="6" fill="none" stroke="${color}" stroke-width="1"/>
      <line x1="32" y1="59" x2="44" y2="59" stroke="${color}" stroke-width="1"/>
      <line x1="38" y1="53" x2="38" y2="65" stroke="${color}" stroke-width="1"/>
      <circle cx="62" cy="59" r="6" fill="none" stroke="${color}" stroke-width="1"/>
      <line x1="56" y1="59" x2="68" y2="59" stroke="${color}" stroke-width="1"/>
      <line x1="62" y1="53" x2="62" y2="65" stroke="${color}" stroke-width="1"/>
    `,
  },
  {
    type: 'nro',
    label: 'NRO / Central Exchange',
    defaultSize: { width: 110, height: 90 },
    defaultStyle: { fill: '#fff7ed', stroke: '#c2410c', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="20" width="90" height="60" rx="4" fill="#fff7ed" stroke="${color}" stroke-width="2"/>
      <path d="M5 20 L55 5 L105 20 Z" fill="#ffedd5" stroke="${color}" stroke-width="2"/>
      <rect x="25" y="45" width="20" height="35" fill="none" stroke="${color}" stroke-width="1.2"/>
      <rect x="55" y="50" width="12" height="12" rx="1" fill="#fed7aa" stroke="${color}" stroke-width="1"/>
      <rect x="73" y="50" width="12" height="12" rx="1" fill="#fed7aa" stroke="${color}" stroke-width="1"/>
      <text x="55" y="40" font-family="sans-serif" font-size="9" font-weight="bold" fill="${color}" text-anchor="middle">NRO</text>
    `,
  },
  {
    type: 'dslam',
    label: 'DSLAM Rack',
    defaultSize: { width: 100, height: 110 },
    defaultStyle: { fill: '#f8fafc', stroke: '#475569', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="10" width="80" height="90" rx="3" fill="#cbd5e1" stroke="${color}" stroke-width="2"/>
      <rect x="16" y="18" width="68" height="10" fill="#334155" stroke="${color}" stroke-width="1"/>
      <rect x="16" y="32" width="68" height="10" fill="#334155" stroke="${color}" stroke-width="1"/>
      <rect x="16" y="46" width="68" height="10" fill="#334155" stroke="${color}" stroke-width="1"/>
      <rect x="16" y="60" width="68" height="10" fill="#334155" stroke="${color}" stroke-width="1"/>
      <rect x="16" y="74" width="68" height="18" fill="#1e293b" stroke="${color}" stroke-width="1"/>
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${24 + i * 13}" cy="83" r="2.5" fill="#10b981"/>`).join('')}
    `,
  },
  {
    type: 'pto',
    label: 'FTTH PTO Box',
    defaultSize: { width: 70, height: 70 },
    defaultStyle: { fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="8" y="8" width="54" height="54" rx="4" fill="#ffffff" stroke="${color}" stroke-width="2"/>
      <rect x="20" y="45" width="12" height="17" fill="#e2e8f0" stroke="${color}" stroke-width="1"/>
      <rect x="38" y="45" width="12" height="17" fill="#e2e8f0" stroke="${color}" stroke-width="1"/>
      <circle cx="26" cy="50" r="2" fill="#ea580c"/>
      <circle cx="44" cy="50" r="2" fill="#ea580c"/>
      <path d="M15 20 Q35 10 55 20" fill="none" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="2 2"/>
    `,
  },
  {
    type: 'pbo',
    label: 'FTTH PBO Splice Box',
    defaultSize: { width: 90, height: 70 },
    defaultStyle: { fill: '#1e293b', stroke: '#0f172a', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="6" y="10" width="78" height="50" rx="6" fill="#1e293b" stroke="${color}" stroke-width="2"/>
      <line x1="20" y1="60" x2="20" y2="65" stroke="${color}" stroke-width="3"/>
      <line x1="45" y1="60" x2="45" y2="65" stroke="${color}" stroke-width="3"/>
      <line x1="70" y1="60" x2="70" y2="65" stroke="${color}" stroke-width="3"/>
      <circle cx="45" cy="35" r="10" fill="none" stroke="#ea580c" stroke-width="1.5"/>
      <path d="M38 35 H52" stroke="#ea580c" stroke-width="1.5"/>
    `,
  },
  {
    type: 'pm',
    label: 'FTTH PM Street Cabinet',
    defaultSize: { width: 80, height: 100 },
    defaultStyle: { fill: '#cbd5e1', stroke: '#475569', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="10" width="60" height="84" rx="2" fill="#e2e8f0" stroke="${color}" stroke-width="2"/>
      <line x1="40" y1="10" x2="40" y2="94" stroke="${color}" stroke-width="1.2"/>
      <rect x="20" y="45" width="8" height="12" fill="#94a3b8" stroke="${color}" stroke-width="1"/>
      <rect x="52" y="45" width="8" height="12" fill="#94a3b8" stroke="${color}" stroke-width="1"/>
      <line x1="10" y1="82" x2="70" y2="82" stroke="${color}" stroke-width="1"/>
    `,
  },

  // --- DWDM & OPTICAL TRANSPORT ---
  {
    type: 'dwdm-mux',
    label: 'DWDM Mux/Demux',
    defaultSize: { width: 120, height: 70 },
    defaultStyle: { fill: '#faf5ff', stroke: '#86198f', strokeWidth: 1.5 },
    body: (color) => `
      <polygon points="10,10 75,10 110,60 10,60" fill="#faf5ff" stroke="${color}" stroke-width="2"/>
      <path d="M20 20 H50 L65 50 H20" fill="none" stroke="${color}" stroke-width="1.2"/>
      <line x1="80" y1="20" x2="90" y2="35" stroke="#ef4444" stroke-width="2"/>
      <line x1="85" y1="20" x2="95" y2="35" stroke="#3b82f6" stroke-width="2"/>
      <line x1="90" y1="20" x2="100" y2="35" stroke="#10b981" stroke-width="2"/>
    `,
  },
  {
    type: 'roadm',
    label: 'ROADM Add-Drop Mux',
    defaultSize: { width: 130, height: 75 },
    defaultStyle: { fill: '#fff1f2', stroke: '#be123c', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="10" width="110" height="55" rx="3" fill="#fff1f2" stroke="${color}" stroke-width="2"/>
      <circle cx="40" cy="37" r="14" fill="#fecdd3" stroke="${color}" stroke-width="1.2"/>
      <circle cx="90" cy="37" r="14" fill="#fecdd3" stroke="${color}" stroke-width="1.2"/>
      <path d="M20 37 H110" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <path d="M65 10 V65" stroke="#be123c" stroke-width="1.5"/>
    `,
  },
  {
    type: 'optical-amp',
    label: 'Optical Amplifier (EDFA)',
    defaultSize: { width: 100, height: 60 },
    defaultStyle: { fill: '#ffffff', stroke: '#be123c', strokeWidth: 1.5 },
    body: (color) => `
      <polygon points="20,10 80,30 20,50" fill="#fff1f2" stroke="${color}" stroke-width="2"/>
      <path d="M30 30 C30 20, 50 20, 50 30 S70 40, 70 30" fill="none" stroke="#e11d48" stroke-width="1.5"/>
    `,
  },

  // --- RADIO, MOBILE & WIRELESS ---
  {
    type: 'enodeb',
    label: '4G eNodeB Tower',
    defaultSize: { width: 80, height: 110 },
    defaultStyle: { fill: '#fafaf9', stroke: '#44403c', strokeWidth: 1.5 },
    body: (color) => `
      <line x1="40" y1="100" x2="40" y2="30" stroke="${color}" stroke-width="3"/>
      <line x1="40" y1="100" x2="20" y2="105" stroke="${color}" stroke-width="1.5"/>
      <line x1="40" y1="100" x2="60" y2="105" stroke="${color}" stroke-width="1.5"/>
      <rect x="35" y="20" width="10" height="24" rx="1" fill="#78716c" stroke="${color}" stroke-width="1.2"/>
      <path d="M30 25 Q15 20 40 5 Q65 20 50 25" fill="none" stroke="${color}" stroke-width="1"/>
      <circle cx="40" cy="15" r="3" fill="#e11d48"/>
    `,
  },
  {
    type: 'gnodeb',
    label: '5G gNodeB Active Tower',
    defaultSize: { width: 80, height: 110 },
    defaultStyle: { fill: '#f5f3ff', stroke: '#6d28d9', strokeWidth: 1.5 },
    body: (color) => `
      <line x1="40" y1="100" x2="40" y2="25" stroke="${color}" stroke-width="3"/>
      <polygon points="32,25 48,25 54,50 26,50" fill="#ddd6fe" stroke="${color}" stroke-width="1.5"/>
      <circle cx="40" cy="15" r="4" fill="#a78bfa" stroke="${color}" stroke-width="1"/>
      <path d="M20 20 Q40 -2 60 20" fill="none" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="2 2"/>
    `,
  },
  {
    type: 'microwave-link',
    label: 'Microwave Link Dish',
    defaultSize: { width: 80, height: 80 },
    defaultStyle: { fill: '#ffffff', stroke: '#334155', strokeWidth: 1.5 },
    body: (color) => `
      <circle cx="40" cy="40" r="24" fill="#f1f5f9" stroke="${color}" stroke-width="2"/>
      <circle cx="40" cy="40" r="6" fill="#64748b" stroke="${color}" stroke-width="1"/>
      <line x1="40" y1="40" x2="40" y2="76" stroke="${color}" stroke-width="2"/>
      <polygon points="35,16 45,16 40,40" fill="#94a3b8" stroke="${color}" stroke-width="1"/>
    `,
  },

  // --- TELECOM VOICE & UNIFIED COMMS ---
  {
    type: 'ipbx',
    label: 'IP-PBX Voice Server',
    defaultSize: { width: 110, height: 75 },
    defaultStyle: { fill: '#f0fdf4', stroke: '#15803d', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="15" width="90" height="50" rx="3" fill="#f0fdf4" stroke="${color}" stroke-width="2"/>
      <rect x="20" y="25" width="22" height="30" rx="1" fill="#bbf7d0" stroke="${color}" stroke-width="1"/>
      <path d="M24 45 C24 35 38 35 38 45" fill="none" stroke="${color}" stroke-width="1.2"/>
      <rect x="30" y="47" width="4" height="4" fill="${color}"/>
      <line x1="55" y1="30" x2="85" y2="30" stroke="${color}" stroke-width="2"/>
      <line x1="55" y1="40" x2="80" y2="40" stroke="${color}" stroke-width="2"/>
      <line x1="55" y1="50" x2="70" y2="50" stroke="${color}" stroke-width="2"/>
    `,
  },
  {
    type: 'sbc',
    label: 'Session Border Controller (SBC)',
    defaultSize: { width: 110, height: 75 },
    defaultStyle: { fill: '#fffbeb', stroke: '#d97706', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="15" width="90" height="50" rx="3" fill="#fffbeb" stroke="${color}" stroke-width="2"/>
      <path d="M30 22 L65 22 L80 40 L45 40 Z" fill="#fde68a" stroke="${color}" stroke-width="1.2"/>
      <line x1="20" y1="50" x2="90" y2="50" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="55" y="46" font-family="sans-serif" font-size="7" font-weight="bold" fill="${color}" text-anchor="middle">SBC</text>
    `,
  },
  {
    type: 'voice-gateway',
    label: 'Voice / PSTN Gateway',
    defaultSize: { width: 110, height: 70 },
    defaultStyle: { fill: '#fafaf9', stroke: '#44403c', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="15" width="90" height="44" rx="2" fill="#fafaf9" stroke="${color}" stroke-width="2"/>
      <circle cx="28" cy="37" r="10" fill="#e7e5e4" stroke="${color}" stroke-width="1"/>
      <path d="M22 37 Q28 29 34 37" fill="none" stroke="${color}" stroke-width="1.5"/>
      <line x1="55" y1="30" x2="85" y2="30" stroke="${color}" stroke-width="1.5"/>
      <line x1="55" y1="44" x2="85" y2="44" stroke="${color}" stroke-width="1.5"/>
    `,
  },
  {
    type: 'sip-trunk',
    label: 'SIP Trunk Provider',
    defaultSize: { width: 120, height: 80 },
    defaultStyle: { fill: '#f0f9ff', stroke: '#0284c7', strokeWidth: 1.5 },
    body: (color) => `
      <path d="M20 50 C15 35, 35 25, 50 35 C60 20, 85 25, 90 40 C105 40, 105 60, 95 65 C95 70, 25 70, 20 50 Z" fill="#e0f2fe" stroke="${color}" stroke-width="2"/>
      <text x="58" y="54" font-family="sans-serif" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">SIP TRUNK</text>
    `,
  },

  // --- SECURITY & BASTION ---
  {
    type: 'ids-ips',
    label: 'IDS / IPS Shield',
    defaultSize: { width: 90, height: 95 },
    defaultStyle: { fill: '#fff5f5', stroke: '#e53e3e', strokeWidth: 1.5 },
    body: (color) => `
      <path d="M15 15 H75 V45 C75 65, 45 85, 45 85 C45 85, 15 65, 15 45 Z" fill="#fee2e2" stroke="${color}" stroke-width="2.2"/>
      <path d="M30 40 H60" stroke="${color}" stroke-width="1.5"/>
      <path d="M35 30 L45 50 L55 30" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="45" cy="30" r="3" fill="#e53e3e"/>
    `,
  },
  {
    type: 'siem',
    label: 'SIEM Log Analyzer',
    defaultSize: { width: 90, height: 90 },
    defaultStyle: { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="15" y="15" width="60" height="60" rx="6" fill="#dcfce7" stroke="${color}" stroke-width="2"/>
      <circle cx="45" cy="45" r="16" fill="none" stroke="${color}" stroke-width="1.5"/>
      <line x1="45" y1="45" x2="57" y2="57" stroke="${color}" stroke-width="2"/>
      <rect x="25" y="25" width="6" height="6" fill="${color}"/>
      <rect x="59" y="25" width="6" height="6" fill="${color}"/>
    `,
  },
  {
    type: 'bastion',
    label: 'Bastion / Jump Server',
    defaultSize: { width: 90, height: 90 },
    defaultStyle: { fill: '#f8fafc', stroke: '#334155', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="15" y="25" width="60" height="50" rx="3" fill="#e2e8f0" stroke="${color}" stroke-width="2"/>
      <circle cx="45" cy="50" r="10" fill="none" stroke="${color}" stroke-width="1.5"/>
      <path d="M45 40 V50 H52" fill="none" stroke="${color}" stroke-width="1.5"/>
      <path d="M30 15 H60 V25 H30 Z" fill="#94a3b8" stroke="${color}" stroke-width="1.2"/>
    `,
  },
  {
    type: 'vpn-concentrator',
    label: 'VPN Concentrator',
    defaultSize: { width: 110, height: 70 },
    defaultStyle: { fill: '#e0f2fe', stroke: '#0369a1', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="15" width="90" height="40" rx="2" fill="#e0f2fe" stroke="${color}" stroke-width="2"/>
      <path d="M25 35 Q40 20 55 35 T85 35" fill="none" stroke="${color}" stroke-width="2"/>
      <circle cx="25" cy="35" r="4" fill="#0369a1"/>
      <circle cx="85" cy="35" r="4" fill="#0369a1"/>
    `,
  },

  // --- SUPERVISION & MONITORING ---
  {
    type: 'prometheus',
    label: 'Prometheus Server',
    defaultSize: { width: 90, height: 90 },
    defaultStyle: { fill: '#fff7ed', stroke: '#ea580c', strokeWidth: 1.5 },
    body: (color) => `
      <circle cx="45" cy="45" r="30" fill="#ffedd5" stroke="${color}" stroke-width="2"/>
      <path d="M45 25 C35 38, 55 42, 45 65 C55 50, 35 48, 45 25 Z" fill="#ea580c" stroke="${color}" stroke-width="1"/>
    `,
  },
  {
    type: 'grafana',
    label: 'Grafana Dashboard',
    defaultSize: { width: 95, height: 90 },
    defaultStyle: { fill: '#faf5ff', stroke: '#d946ef', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="15" width="75" height="60" rx="4" fill="#faf5ff" stroke="${color}" stroke-width="2"/>
      <path d="M20 60 L35 35 L55 45 L70 25" fill="none" stroke="#d946ef" stroke-width="2.5"/>
      <circle cx="20" cy="60" r="3" fill="${color}"/>
      <circle cx="35" cy="35" r="3" fill="${color}"/>
      <circle cx="55" cy="45" r="3" fill="${color}"/>
      <circle cx="70" cy="25" r="3" fill="${color}"/>
    `,
  },
  {
    type: 'zabbix',
    label: 'Zabbix Host Monitor',
    defaultSize: { width: 100, height: 80 },
    defaultStyle: { fill: '#f8fafc', stroke: '#dc2626', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="15" width="80" height="50" rx="3" fill="#fee2e2" stroke="${color}" stroke-width="2"/>
      <text x="50" y="44" font-family="sans-serif" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">Z</text>
      <circle cx="20" cy="25" r="4" fill="#22c55e"/>
      <circle cx="80" cy="25" r="4" fill="#dc2626"/>
    `,
  },

  // --- KUBERNETES ---
  {
    type: 'k8s-pod',
    label: 'Kubernetes Pod',
    defaultSize: { width: 90, height: 90 },
    defaultStyle: { fill: '#f0f9ff', stroke: '#326ce5', strokeWidth: 1.5 },
    body: (color) => `
      <polygon points="45,10 80,30 80,70 45,90 10,70 10,30" fill="#e0f2fe" stroke="${color}" stroke-width="2"/>
      <circle cx="33" cy="40" r="8" fill="#93c5fd" stroke="${color}" stroke-width="1.2"/>
      <circle cx="57" cy="40" r="8" fill="#93c5fd" stroke="${color}" stroke-width="1.2"/>
      <circle cx="45" cy="64" r="8" fill="#93c5fd" stroke="${color}" stroke-width="1.2"/>
    `,
  },
  {
    type: 'k8s-service',
    label: 'Kubernetes Service',
    defaultSize: { width: 90, height: 90 },
    defaultStyle: { fill: '#f0f9ff', stroke: '#326ce5', strokeWidth: 1.5 },
    body: (color) => `
      <polygon points="45,10 80,30 80,70 45,90 10,70 10,30" fill="#326ce5" stroke="${color}" stroke-width="1.5"/>
      <circle cx="45" cy="50" r="14" fill="#fff" stroke="${color}" stroke-width="1.5"/>
      <path d="M45 42 V58 M37 50 H53" stroke="#326ce5" stroke-width="2.5"/>
    `,
  },
  {
    type: 'k8s-ingress',
    label: 'Kubernetes Ingress',
    defaultSize: { width: 95, height: 90 },
    defaultStyle: { fill: '#ffffff', stroke: '#326ce5', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="15" width="75" height="60" rx="6" fill="#e0f2fe" stroke="${color}" stroke-width="2"/>
      <path d="M20 45 H45 M45 45 L60 30 M45 45 L60 60" fill="none" stroke="${color}" stroke-width="2"/>
      <polygon points="60,30 54,32 58,26" fill="${color}"/>
      <polygon points="60,60 58,64 54,58" fill="${color}"/>
    `,
  },

  // --- PUBLIC CLOUD GENERIC ---
  {
    type: 'aws-cloud',
    label: 'AWS Virtual Cloud',
    defaultSize: { width: 120, height: 80 },
    defaultStyle: { fill: '#fff7ed', stroke: '#ff9900', strokeWidth: 1.5 },
    body: (color) => `
      <path d="M20 55 C15 40, 32 30, 48 38 C58 24, 82 28, 88 42 C102 42, 104 60, 92 65 C92 70, 25 70, 20 55 Z" fill="#ffedd5" stroke="${color}" stroke-width="2"/>
      <text x="56" y="56" font-family="sans-serif" font-size="8" font-weight="bold" fill="#ff9900" text-anchor="middle">AWS</text>
    `,
  },
  {
    type: 'azure-cloud',
    label: 'Azure Virtual Cloud',
    defaultSize: { width: 120, height: 80 },
    defaultStyle: { fill: '#f0f9ff', stroke: '#0078d4', strokeWidth: 1.5 },
    body: (color) => `
      <path d="M20 55 C15 40, 32 30, 48 38 C58 24, 82 28, 88 42 C102 42, 104 60, 92 65 C92 70, 25 70, 20 55 Z" fill="#e0f2fe" stroke="${color}" stroke-width="2"/>
      <text x="56" y="56" font-family="sans-serif" font-size="8" font-weight="bold" fill="#0078d4" text-anchor="middle">AZURE</text>
    `,
  },

  // --- DATABASE & STORAGE ---
  {
    type: 'sql-db',
    label: 'SQL Database',
    defaultSize: { width: 80, height: 95 },
    defaultStyle: { fill: '#f8fafc', stroke: '#0284c7', strokeWidth: 1.5 },
    body: (color) => `
      <path d="M10 25 C10 15, 70 15, 70 25 V75 C70 85, 10 85, 10 75 Z" fill="#e0f2fe" stroke="${color}" stroke-width="2"/>
      <ellipse cx="40" cy="25" rx="30" ry="10" fill="#bae6fd" stroke="${color}" stroke-width="1.5"/>
      <ellipse cx="40" cy="42" rx="30" ry="10" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2 2"/>
      <ellipse cx="40" cy="58" rx="30" ry="10" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2 2"/>
      <text x="40" y="52" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0284c7" text-anchor="middle">SQL</text>
    `,
  },
  {
    type: 'nosql-db',
    label: 'NoSQL Document Store',
    defaultSize: { width: 80, height: 95 },
    defaultStyle: { fill: '#fdf2f8', stroke: '#db2777', strokeWidth: 1.5 },
    body: (color) => `
      <path d="M10 25 C10 15, 70 15, 70 25 V75 C70 85, 10 85, 10 75 Z" fill="#fbcfe8" stroke="${color}" stroke-width="2"/>
      <ellipse cx="40" cy="25" rx="30" ry="10" fill="#f9a8d4" stroke="${color}" stroke-width="1.5"/>
      <ellipse cx="40" cy="42" rx="30" ry="10" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2 2"/>
      <ellipse cx="40" cy="58" rx="30" ry="10" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2 2"/>
      <text x="40" y="52" font-family="sans-serif" font-size="8" font-weight="bold" fill="#db2777" text-anchor="middle">NoSQL</text>
    `,
  },
  {
    type: 'san-storage',
    label: 'SAN Storage Array',
    defaultSize: { width: 110, height: 90 },
    defaultStyle: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="10" width="90" height="70" rx="3" fill="#cbd5e1" stroke="${color}" stroke-width="2"/>
      <rect x="16" y="18" width="78" height="12" fill="#475569" stroke="${color}" stroke-width="1"/>
      <rect x="16" y="36" width="78" height="12" fill="#475569" stroke="${color}" stroke-width="1"/>
      <rect x="16" y="54" width="78" height="12" fill="#475569" stroke="${color}" stroke-width="1"/>
      ${[0, 1, 2, 3].map((i) => `<circle cx="${24 + i * 20}" cy="24" r="2" fill="#10b981"/>`).join('')}
      ${[0, 1, 2, 3].map((i) => `<circle cx="${24 + i * 20}" cy="42" r="2" fill="#10b981"/>`).join('')}
      ${[0, 1, 2, 3].map((i) => `<circle cx="${24 + i * 20}" cy="60" r="2" fill="#10b981"/>`).join('')}
    `,
  },
  {
    type: 'nas-storage',
    label: 'NAS Storage Appliance',
    defaultSize: { width: 100, height: 90 },
    defaultStyle: { fill: '#f8fafc', stroke: '#0f172a', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="15" y="10" width="70" height="70" rx="4" fill="#cbd5e1" stroke="${color}" stroke-width="2"/>
      <rect x="25" y="18" width="10" height="54" fill="#475569" stroke="${color}" stroke-width="1"/>
      <rect x="41" y="18" width="10" height="54" fill="#475569" stroke="${color}" stroke-width="1"/>
      <rect x="57" y="18" width="10" height="54" fill="#475569" stroke="${color}" stroke-width="1"/>
      <circle cx="30" cy="25" r="1.5" fill="#22c55e"/>
      <circle cx="46" cy="25" r="1.5" fill="#22c55e"/>
      <circle cx="62" cy="25" r="1.5" fill="#22c55e"/>
    `,
  },

  // --- IOT & INDUSTRIAL SCADA / OT ---
  {
    type: 'plc',
    label: 'PLC Controller',
    defaultSize: { width: 90, height: 90 },
    defaultStyle: { fill: '#fafaf9', stroke: '#44403c', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="10" y="10" width="70" height="70" rx="2" fill="#e7e5e4" stroke="${color}" stroke-width="2"/>
      <rect x="18" y="18" width="22" height="25" fill="#78716c" stroke="${color}" stroke-width="1"/>
      <rect x="46" y="18" width="26" height="54" fill="#a8a29e" stroke="${color}" stroke-width="1"/>
      <circle cx="24" cy="26" r="2" fill="#22c55e"/>
      <circle cx="34" cy="26" r="2" fill="#ea580c"/>
      ${[0, 1, 2, 3, 5].map((i) => `<line x1="52" y1="${24 + i * 8}" x2="66" y2="${24 + i * 8}" stroke="#fff" stroke-width="1"/>`).join('')}
    `,
  },
  {
    type: 'sensor',
    label: 'IoT Analog Sensor',
    defaultSize: { width: 70, height: 75 },
    defaultStyle: { fill: '#f0fdf4', stroke: '#166534', strokeWidth: 1.5 },
    body: (color) => `
      <circle cx="35" cy="35" r="25" fill="#dcfce7" stroke="${color}" stroke-width="2"/>
      <path d="M35 15 V35 L48 43" fill="none" stroke="${color}" stroke-width="2"/>
      <circle cx="35" cy="35" r="3" fill="${color}"/>
      <line x1="35" y1="60" x2="35" y2="70" stroke="${color}" stroke-width="2"/>
    `,
  },
  {
    type: 'lorawan-gw',
    label: 'LoRaWAN Gateway',
    defaultSize: { width: 85, height: 85 },
    defaultStyle: { fill: '#fafaf9', stroke: '#292524', strokeWidth: 1.5 },
    body: (color) => `
      <rect x="15" y="25" width="55" height="50" rx="4" fill="#e7e5e4" stroke="${color}" stroke-width="2"/>
      <line x1="55" y1="25" x2="55" y2="8" stroke="${color}" stroke-width="2"/>
      <circle cx="55" cy="8" r="2.5" fill="#e11d48"/>
      <path d="M25 40 H45 M25 52 H45 M25 64 H45" stroke="${color}" stroke-width="1.5"/>
    `,
  },
  {
    type: 'optical-splitter',
    label: 'Optical Splitter (GPON)',
    defaultSize: { width: 100, height: 75 },
    defaultStyle: { fill: '#faf5ff', stroke: '#ea580c', strokeWidth: 1.5 },
    body: (color, theme) => {
      const b = theme?.body ?? color;
      const a = theme?.accent ?? '#ffffff';
      const s = theme?.screen ?? '#0f172a';
      const l = theme?.led ?? '#22c55e';
      const sh = theme?.shadow ?? '#475569';
      return `
        <!-- Main splitter enclosure -->
        <rect x="6" y="6" width="88" height="63" rx="4" fill="${s}" stroke="${b}" stroke-width="2"/>
        
        <!-- Input Port on the Left -->
        <rect x="2" y="32" width="10" height="10" rx="1" fill="${sh}" stroke="${b}" stroke-width="1"/>
        <line x1="0" y1="37" x2="20" y2="37" stroke="${l}" stroke-width="1.8"/>
        <circle cx="12" cy="37" r="2.5" fill="${a}" stroke="${b}" stroke-width="0.8"/>
        
        <!-- Internal Prism/Splitting Chamber -->
        <polygon points="30,37 50,22 50,52" fill="${sh}" fill-opacity="0.3" stroke="${b}" stroke-width="1.2"/>
        <circle cx="35" cy="37" r="3" fill="${l}"/>
        
        <!-- Branching laser guides -->
        <path d="M 35,37 L 50,25 L 75,18" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 1"/>
        <path d="M 35,37 L 50,33 L 75,30" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 1"/>
        <path d="M 35,37 L 50,41 L 75,44" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 1"/>
        <path d="M 35,37 L 50,49 L 75,56" fill="none" stroke="${l}" stroke-width="1.2" stroke-dasharray="2 1"/>
        
        <!-- Output coupling modules -->
        <rect x="70" y="12" width="12" height="10" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.8"/>
        <rect x="70" y="25" width="12" height="10" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.8"/>
        <rect x="70" y="39" width="12" height="10" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.8"/>
        <rect x="70" y="52" width="12" height="10" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.8"/>
        
        <!-- Output Fibers -->
        <line x1="82" y1="17" x2="100" y2="17" stroke="${l}" stroke-width="1.2"/>
        <line x1="82" y1="30" x2="100" y2="30" stroke="${l}" stroke-width="1.2"/>
        <line x1="82" y1="44" x2="100" y2="44" stroke="${l}" stroke-width="1.2"/>
        <line x1="82" y1="57" x2="100" y2="57" stroke="${l}" stroke-width="1.2"/>
        
        <!-- Labels / Standard Text inside the box -->
        <text x="56" y="39" font-family="monospace" font-size="7" font-weight="bold" fill="${a}" text-anchor="middle">1:4</text>
      `;
    },
  },
  {
    type: 'optical-splice-closure',
    label: 'Optical Splice Closure (BPE)',
    defaultSize: { width: 100, height: 60 },
    defaultStyle: { fill: '#1e293b', stroke: '#64748b', strokeWidth: 1.5 },
    body: (color, theme) => {
      const b = theme?.body ?? color;
      const a = theme?.accent ?? '#ffffff';
      const s = theme?.screen ?? '#0f172a';
      const l = theme?.led ?? '#22c55e';
      const sh = theme?.shadow ?? '#475569';
      return `
        <!-- Closure cylindrical body -->
        <rect x="15" y="10" width="70" height="40" rx="10" fill="${s}" stroke="${b}" stroke-width="2.5"/>
        
        <!-- Structural ribbed reinforcement -->
        <line x1="28" y1="10" x2="28" y2="50" stroke="${b}" stroke-width="2"/>
        <line x1="40" y1="10" x2="40" y2="50" stroke="${b}" stroke-width="2"/>
        <line x1="50" y1="10" x2="50" y2="50" stroke="${b}" stroke-width="2"/>
        <line x1="60" y1="10" x2="60" y2="50" stroke="${b}" stroke-width="2"/>
        <line x1="72" y1="10" x2="72" y2="50" stroke="${b}" stroke-width="2"/>
        
        <!-- Cable entry ports/glands on left and right -->
        <rect x="5" y="16" width="10" height="10" rx="1" fill="${sh}" stroke="${b}" stroke-width="1"/>
        <rect x="5" y="34" width="10" height="10" rx="1" fill="${sh}" stroke="${b}" stroke-width="1"/>
        <rect x="85" y="25" width="10" height="10" rx="1" fill="${sh}" stroke="${b}" stroke-width="1"/>
        
        <!-- Fibers entering and exiting -->
        <path d="M 0,21 H 10 Q 15,21 20,25" fill="none" stroke="#ea580c" stroke-width="1.5"/>
        <path d="M 0,39 H 10 Q 15,39 20,35" fill="none" stroke="#3b82f6" stroke-width="1.5"/>
        <path d="M 90,30 H 100" fill="none" stroke="#22c55e" stroke-width="1.5"/>
        
        <!-- Splice Organizer tray visualization inside the closure (transparent cutout) -->
        <rect x="32" y="20" width="36" height="20" rx="2" fill="${b}" fill-opacity="0.15" stroke="${a}" stroke-width="0.8" stroke-dasharray="2 2"/>
        
        <!-- Fiber fusion splices -->
        <path d="M 20,25 Q 30,22 45,22 Q 55,22 65,30" fill="none" stroke="#ea580c" stroke-width="1"/>
        <path d="M 20,35 Q 30,38 45,38 Q 55,38 65,30" fill="none" stroke="#3b82f6" stroke-width="1"/>
        <rect x="40" y="20" width="10" height="4" rx="0.5" fill="${l}"/>
        <rect x="40" y="36" width="10" height="4" rx="0.5" fill="${l}"/>
        
        <!-- Mounting brackets -->
        <path d="M 15,14 L 10,14" stroke="${b}" stroke-width="2"/>
        <path d="M 15,46 L 10,46" stroke="${b}" stroke-width="2"/>
        <path d="M 85,14 L 90,14" stroke="${b}" stroke-width="2"/>
        <path d="M 85,46 L 90,46" stroke="${b}" stroke-width="2"/>
      `;
    },
  },
  {
    type: 'underground-manhole',
    label: 'Underground Manhole',
    defaultSize: { width: 80, height: 80 },
    defaultStyle: { fill: '#475569', stroke: '#1e293b', strokeWidth: 2 },
    body: (color, theme) => {
      const b = theme?.body ?? color;
      const a = theme?.accent ?? '#ffffff';
      const s = theme?.screen ?? '#0f172a';
      const sh = theme?.shadow ?? '#475569';
      return `
        <!-- Outer concrete frame -->
        <rect x="4" y="4" width="72" height="72" rx="4" fill="${sh}" fill-opacity="0.2" stroke="${b}" stroke-width="2"/>
        <rect x="8" y="8" width="64" height="64" rx="2" fill="none" stroke="${b}" stroke-width="1" stroke-dasharray="3 3"/>
        
        <!-- Circular iron cover frame -->
        <circle cx="40" cy="40" r="28" fill="${s}" stroke="${b}" stroke-width="2.5"/>
        <circle cx="40" cy="40" r="23" fill="none" stroke="${b}" stroke-width="1"/>
        
        <!-- Checkerboard / anti-slip pattern lines -->
        <line x1="20" y1="40" x2="60" y2="40" stroke="${b}" stroke-width="1.2"/>
        <line x1="40" y1="20" x2="40" y2="60" stroke="${b}" stroke-width="1.2"/>
        <line x1="26" y1="26" x2="54" y2="54" stroke="${b}" stroke-width="1"/>
        <line x1="26" y1="54" x2="54" y2="26" stroke="${b}" stroke-width="1"/>
        
        <!-- Inner core plate -->
        <circle cx="40" cy="40" r="12" fill="${sh}" stroke="${b}" stroke-width="1"/>
        
        <!-- Handholes / lifting slots -->
        <rect x="36" y="21" width="8" height="3" rx="1" fill="${s}" stroke="${b}" stroke-width="0.8"/>
        <rect x="36" y="56" width="8" height="3" rx="1" fill="${s}" stroke="${b}" stroke-width="0.8"/>
        
        <!-- Telecom symbol (T-shape or text) in center -->
        <text x="40" y="43" font-family="sans-serif" font-size="7" font-weight="extrabold" fill="${a}" text-anchor="middle">TEL</text>
      `;
    },
  },
  {
    type: 'media-converter',
    label: 'Media Converter',
    defaultSize: { width: 95, height: 50 },
    defaultStyle: { fill: '#f1f5f9', stroke: '#475569', strokeWidth: 1.5 },
    body: (color, theme) => {
      const b = theme?.body ?? color;
      const a = theme?.accent ?? '#ffffff';
      const s = theme?.screen ?? '#0f172a';
      const l = theme?.led ?? '#22c55e';
      const sh = theme?.shadow ?? '#475569';
      return `
        <!-- Main box body -->
        <rect x="5" y="8" width="85" height="34" rx="3" fill="${s}" stroke="${b}" stroke-width="2"/>
        
        <!-- Left side: RJ45 Copper Port -->
        <rect x="10" y="15" width="16" height="20" rx="1.5" fill="${sh}" stroke="${b}" stroke-width="1"/>
        <!-- RJ45 Pin contacts and lock notch -->
        <rect x="13" y="29" width="10" height="6" fill="${s}"/>
        <line x1="13" y1="20" x2="13" y2="26" stroke="${a}" stroke-width="0.8"/>
        <line x1="16" y1="20" x2="16" y2="26" stroke="${a}" stroke-width="0.8"/>
        <line x1="19" y1="20" x2="19" y2="26" stroke="${a}" stroke-width="0.8"/>
        <line x1="22" y1="20" x2="22" y2="26" stroke="${a}" stroke-width="0.8"/>
        <text x="18" y="13" font-family="sans-serif" font-size="5" fill="${b}">TX</text>
        
        <!-- Right side: Dual Fiber LC/SC Port -->
        <rect x="68" y="17" width="16" height="16" rx="1" fill="${sh}" stroke="${b}" stroke-width="1"/>
        <circle cx="73" cy="25" r="2.5" fill="#ea580c" stroke="${b}" stroke-width="0.6"/>
        <circle cx="79" cy="25" r="2.5" fill="#3b82f6" stroke="${b}" stroke-width="0.6"/>
        <text x="76" y="13" font-family="sans-serif" font-size="5" fill="${b}">FX</text>
        
        <!-- Center conversion arrow icons (Copper <-> Fiber symbol) -->
        <path d="M 36,20 H 52 L 48,16" fill="none" stroke="${a}" stroke-width="1" stroke-linecap="round"/>
        <path d="M 52,28 H 36 L 40,32" fill="none" stroke="${a}" stroke-width="1" stroke-linecap="round"/>
        
        <!-- LEDs panel (Link, Act, FDX, PWR) -->
        <circle cx="34" cy="14" r="1.5" fill="${l}"/>
        <circle cx="44" cy="14" r="1.5" fill="${l}"/>
        <circle cx="54" cy="14" r="1.5" fill="${l}"/>
        
        <!-- Small cooling vents -->
        <line x1="33" y1="34" x2="35" y2="34" stroke="${b}" stroke-width="1"/>
        <line x1="39" y1="34" x2="41" y2="34" stroke="${b}" stroke-width="1"/>
        <line x1="45" y1="34" x2="47" y2="34" stroke="${b}" stroke-width="1"/>
        <line x1="51" y1="34" x2="53" y2="34" stroke="${b}" stroke-width="1"/>
        <line x1="57" y1="34" x2="59" y2="34" stroke="${b}" stroke-width="1"/>
      `;
    },
  },
  {
    type: 'ups',
    label: 'UPS (Onduleur)',
    defaultSize: { width: 110, height: 50 },
    defaultStyle: { fill: '#1e293b', stroke: '#cbd5e1', strokeWidth: 1.5 },
    body: (color, theme) => {
      const b = theme?.body ?? color;
      const a = theme?.accent ?? '#ffffff';
      const s = theme?.screen ?? '#0f172a';
      const l = theme?.led ?? '#22c55e';
      const sh = theme?.shadow ?? '#475569';
      return `
        <!-- Main rack unit body -->
        <rect x="4" y="6" width="102" height="38" rx="2" fill="${s}" stroke="${b}" stroke-width="2"/>
        
        <!-- Left & Right Rack Ears -->
        <rect x="0" y="6" width="4" height="38" fill="${b}"/>
        <rect x="106" y="6" width="4" height="38" fill="${b}"/>
        <circle cx="2" cy="12" r="1" fill="${a}"/>
        <circle cx="2" cy="38" r="1" fill="${a}"/>
        <circle cx="108" cy="12" r="1" fill="${a}"/>
        <circle cx="108" cy="38" r="1" fill="${a}"/>
        
        <!-- LCD Display screen -->
        <rect x="30" y="12" width="50" height="26" rx="1.5" fill="${b}" fill-opacity="0.1" stroke="${b}" stroke-width="1.2"/>
        
        <!-- Battery status graph (bar segments) inside LCD -->
        <rect x="35" y="16" width="6" height="18" fill="none" stroke="${a}" stroke-width="0.8"/>
        <rect x="37" y="18" width="2" height="14" fill="${l}"/>
        
        <!-- Sine wave symbol inside LCD -->
        <path d="M 46,25 Q 52,15 58,25 T 70,25" fill="none" stroke="${a}" stroke-width="1.2"/>
        <!-- Sine wave text or digital metrics -->
        <text x="65" y="32" font-family="monospace" font-size="6" font-weight="bold" fill="${a}">230V</text>
        
        <!-- Left venting grilles -->
        <line x1="10" y1="16" x2="22" y2="16" stroke="${sh}" stroke-width="1"/>
        <line x1="10" y1="20" x2="22" y2="20" stroke="${sh}" stroke-width="1"/>
        <line x1="10" y1="24" x2="22" y2="24" stroke="${sh}" stroke-width="1"/>
        <line x1="10" y1="28" x2="22" y2="28" stroke="${sh}" stroke-width="1"/>
        <line x1="10" y1="32" x2="22" y2="32" stroke="${sh}" stroke-width="1"/>
        
        <!-- Right controls (power switch, status LEDs) -->
        <!-- Power Switch -->
        <rect x="88" y="18" width="10" height="14" rx="1" fill="${sh}" stroke="${b}" stroke-width="0.8"/>
        <circle cx="93" cy="25" r="2.5" fill="${l}"/>
        
        <!-- Alarm Status LED -->
        <circle cx="93" cy="12" r="2" fill="#ef4444" fill-opacity="0.2" stroke="${b}" stroke-width="0.5"/>
      `;
    },
  },
  {
    type: 'pdu',
    label: 'Power Distribution Unit (PDU)',
    defaultSize: { width: 140, height: 35 },
    defaultStyle: { fill: '#1e293b', stroke: '#cbd5e1', strokeWidth: 1.2 },
    body: (color, theme) => {
      const b = theme?.body ?? color;
      const a = theme?.accent ?? '#ffffff';
      const s = theme?.screen ?? '#0f172a';
      const l = theme?.led ?? '#22c55e';
      const sh = theme?.shadow ?? '#475569';
      return `
        <!-- Main PDU strip -->
        <rect x="4" y="4" width="132" height="27" rx="2" fill="${s}" stroke="${b}" stroke-width="1.8"/>
        
        <!-- Left Mounting ear -->
        <rect x="0" y="4" width="4" height="27" fill="${b}"/>
        <circle cx="2" cy="17" r="1.2" fill="${a}"/>
        <!-- Right Mounting ear -->
        <rect x="136" y="4" width="4" height="27" fill="${b}"/>
        <circle cx="138" cy="17" r="1.2" fill="${a}"/>
        
        <!-- Amperage / Voltage digital display screen -->
        <rect x="10" y="9" width="22" height="17" rx="1" fill="${b}" fill-opacity="0.1" stroke="${b}" stroke-width="0.8"/>
        <text x="21" y="20" font-family="monospace" font-size="7" font-weight="bold" fill="${a}" text-anchor="middle">16.0A</text>
        
        <!-- Sockets array (C13/C14 style outlets) -->
        ${[0, 1, 2, 3, 4]
          .map(
            (i) => `
          <g transform="translate(${38 + i * 16}, 9)">
            <!-- Outer hexagonal / rounded C13 socket shape -->
            <polygon points="1,2 11,2 12,6 12,12 11,16 1,16 0,12 0,6" fill="${sh}" stroke="${b}" stroke-width="0.6"/>
            <!-- Plug pin slots -->
            <rect x="2" y="6" width="2" height="4" rx="0.3" fill="${s}"/>
            <rect x="8" y="6" width="2" height="4" rx="0.3" fill="${s}"/>
            <rect x="5" y="11" width="2" height="3" rx="0.3" fill="${s}"/>
          </g>
        `
          )
          .join('')}
          
        <!-- Surge protector / rocker power switch -->
        <rect x="118" y="9" width="12" height="17" rx="1.5" fill="${sh}" stroke="${b}" stroke-width="0.8"/>
        <rect x="121" y="11" width="6" height="6" fill="#ef4444" stroke="${b}" stroke-width="0.5"/>
        <circle cx="124" cy="21" r="1.2" fill="${l}"/>
      `;
    },
  },
];

function makeSpecNetworkPlugin(cfg: SpecIconConfig): ShapePlugin {
  return {
    type: cfg.type,
    category: 'network',
    label: cfg.label,
    defaultStyle: {
      ...cfg.defaultStyle,
      theme: {
        body: cfg.defaultStyle.stroke,
        accent: '#ffffff',
        screen: '#0f172a',
        led: '#22c55e',
        shadow: '#475569',
      },
    },
    defaultSize: cfg.defaultSize,
    colorSlots: NETWORK_SLOTS,
    defaultTheme: {
      body: cfg.defaultStyle.stroke,
      accent: '#ffffff',
      screen: '#0f172a',
      led: '#22c55e',
      shadow: '#475569',
    },
    preview: (color = cfg.defaultStyle.stroke) => {
      const scale = 24 / Math.max(cfg.defaultSize.width, cfg.defaultSize.height);
      const w = cfg.defaultSize.width * scale;
      const h = cfg.defaultSize.height * scale;
      const offX = (24 - w) / 2;
      const offY = (24 - h) / 2;
      const theme = {
        body: color,
        accent: '#ffffff',
        screen: '#0f172a',
        led: '#22c55e',
        shadow: '#475569',
      };
      return `<g transform="translate(${offX} ${offY}) scale(${scale})">${cfg.body(color, theme)}</g>`;
    },
    renderBody: (s) => {
      const sx = s.width / cfg.defaultSize.width;
      const sy = s.height / cfg.defaultSize.height;
      const theme = s.style.theme ?? {};
      const color = theme.body ?? s.style.stroke;
      const t = {
        body: color,
        accent: theme.accent ?? '#ffffff',
        screen: theme.screen ?? '#0f172a',
        led: theme.led ?? '#22c55e',
        shadow: theme.shadow ?? '#475569',
      };
      return `<g transform="scale(${sx} ${sy})" opacity="${s.style.opacity}">${cfg.body(color, t)}</g>`;
    },
  };
}

export const specNetworkPlugins: ShapePlugin[] = specIcons.map(makeSpecNetworkPlugin);
