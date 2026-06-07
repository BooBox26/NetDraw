// Shape library catalog. Used by the left sidebar to list draggable items.

import type { ShapePlugin } from './types';
import { builtinPlugins } from './builtin';
import { networkPlugins } from './network';
import { extendedBuiltinPlugins } from './extended';
import { monochromePlugins } from './monochrome';
import { extNetworkPlugins } from './extra-network';
import { specNetworkPlugins } from './specialized-network';
import { depthPlugins } from './depth';
import { isometric25dPlugins } from './isometric25d';

export interface LibraryItem {
  plugin: ShapePlugin;
  group: string;
}

const allBasic = [...builtinPlugins, ...extendedBuiltinPlugins];
const allNetwork = [...networkPlugins, ...extNetworkPlugins];

// Organize specialized telecom and IT shapes into semantic groups
const specGroupMapping: Record<string, string> = {
  'patch-panel-cu': 'Patching & Modules',
  'odf-fiber': 'Patching & Modules',
  'sfp-module': 'Patching & Modules',
  'media-converter': 'Patching & Modules',
  ups: 'Patching & Modules',
  pdu: 'Patching & Modules',

  pop: 'FTTH & Operator Telecom',
  nro: 'FTTH & Operator Telecom',
  dslam: 'FTTH & Operator Telecom',
  pto: 'FTTH & Operator Telecom',
  pbo: 'FTTH & Operator Telecom',
  pm: 'FTTH & Operator Telecom',
  'optical-splitter': 'FTTH & Operator Telecom',
  'optical-splice-closure': 'FTTH & Operator Telecom',
  'underground-manhole': 'FTTH & Operator Telecom',

  'dwdm-mux': 'Optical Transport & DWDM',
  roadm: 'Optical Transport & DWDM',
  'optical-amp': 'Optical Transport & DWDM',

  enodeb: 'Radio & Mobile Wireless',
  gnodeb: 'Radio & Mobile Wireless',
  'microwave-link': 'Radio & Mobile Wireless',

  ipbx: 'VoIP & Telephone Voice',
  sbc: 'VoIP & Telephone Voice',
  'voice-gateway': 'VoIP & Telephone Voice',
  'sip-trunk': 'VoIP & Telephone Voice',

  'ids-ips': 'Security & Protection',
  siem: 'Security & Protection',
  bastion: 'Security & Protection',
  'vpn-concentrator': 'Security & Protection',

  prometheus: 'Supervision & Monitoring',
  grafana: 'Supervision & Monitoring',
  zabbix: 'Supervision & Monitoring',

  'k8s-pod': 'Kubernetes & Containers',
  'k8s-service': 'Kubernetes & Containers',
  'k8s-ingress': 'Kubernetes & Containers',

  'aws-cloud': 'Public Cloud Grids',
  'azure-cloud': 'Public Cloud Grids',

  'sql-db': 'Database & Storage',
  'nosql-db': 'Database & Storage',
  'san-storage': 'Database & Storage',
  'nas-storage': 'Database & Storage',

  plc: 'IoT & Industrial OT',
  sensor: 'IoT & Industrial OT',
  'lorawan-gw': 'IoT & Industrial OT',
};

const isometricGroupMapping: Record<string, string> = {
  // Réseau
  'router-25d': '2.5D Réseau',
  'core-router-25d': '2.5D Réseau',
  'edge-router-25d': '2.5D Réseau',
  'switch-25d': '2.5D Réseau',
  'core-switch-25d': '2.5D Réseau',
  'distribution-switch-25d': '2.5D Réseau',
  'access-switch-25d': '2.5D Réseau',
  'l3-switch-25d': '2.5D Réseau',
  'firewall-25d': '2.5D Réseau',
  'vpn-gateway-25d': '2.5D Réseau',
  'load-balancer-25d': '2.5D Réseau',
  'proxy-25d': '2.5D Réseau',
  'ids-25d': '2.5D Réseau',
  'ips-25d': '2.5D Réseau',
  'sdwan-appliance-25d': '2.5D Réseau',

  // Datacenter
  'rack-25d': '2.5D Datacenter',
  'rack-empty-25d': '2.5D Datacenter',
  'rack-full-25d': '2.5D Datacenter',
  'patch-panel-25d': '2.5D Datacenter',
  'odf-25d': '2.5D Datacenter',
  'pdu-25d': '2.5D Datacenter',
  'ups-25d': '2.5D Datacenter',
  'kvm-25d': '2.5D Datacenter',

  // Serveurs
  'server-rack-25d': '2.5D Serveurs',
  'server-tower-25d': '2.5D Serveurs',
  'blade-server-25d': '2.5D Serveurs',
  'hypervisor-25d': '2.5D Serveurs',
  'cluster-25d': '2.5D Serveurs',

  // Stockage
  'nas-25d': '2.5D Stockage',
  'san-25d': '2.5D Stockage',
  'baie-stockage-25d': '2.5D Stockage',
  'backup-appliance-25d': '2.5D Stockage',

  // Télécom
  'pop-25d': '2.5D Télécom',
  'olt-25d': '2.5D Télécom',
  'ont-25d': '2.5D Télécom',
  'dslam-25d': '2.5D Télécom',
  'antenne-25d': '2.5D Télécom',
  'faisceau-hertzien-25d': '2.5D Télécom',
  'cell-tower-25d': '2.5D Télécom',
  'satellite-gateway-25d': '2.5D Télécom',

  // Wifi
  'access-point-25d': '2.5D Wifi',
  'wireless-controller-25d': '2.5D Wifi',
  'antenne-indoor-25d': '2.5D Wifi',
  'antenne-outdoor-25d': '2.5D Wifi',

  // Sécurité
  'firewall-sec-25d': '2.5D Sécurité',
  'bastion-25d': '2.5D Sécurité',
  'waf-25d': '2.5D Sécurité',
  'reverse-proxy-sec-25d': '2.5D Sécurité',
  'siem-25d': '2.5D Sécurité',

  // Utilisateurs
  'pc-25d': '2.5D Utilisateurs',
  'laptop-25d': '2.5D Utilisateurs',
  'workstation-25d': '2.5D Utilisateurs',
  'thin-client-25d': '2.5D Utilisateurs',

  // Périphériques
  'imprimante-25d': '2.5D Périphériques',
  'scanner-25d': '2.5D Périphériques',
  'telephone-ip-25d': '2.5D Périphériques',
  'camera-ip-25d': '2.5D Périphériques',

  // Cloud
  'cloud-generic-25d': '2.5D Cloud',
  'datacenter-cloud-25d': '2.5D Cloud',
  'internet-25d': '2.5D Cloud',
  'saas-25d': '2.5D Cloud',
};

export const library: LibraryItem[] = [
  ...allBasic.map((plugin) => ({ plugin, group: 'Basic shapes' })),
  ...allNetwork.map((plugin) => ({ plugin, group: 'Network Equipment' })),
  ...monochromePlugins.map((plugin) => ({ plugin, group: 'Monochrome Shapes' })),
  ...specNetworkPlugins.map((plugin) => ({
    plugin,
    group: specGroupMapping[plugin.type] ?? 'Specialized Telecom',
  })),
  ...depthPlugins.map((plugin) => ({ plugin, group: 'Network Devices' })),
  ...isometric25dPlugins.map((plugin) => ({
    plugin,
    group: isometricGroupMapping[plugin.type] ?? '2.5D Divers',
  })),
  // Topology shortcuts
  { plugin: allNetwork.find((p) => p.type === 'cloud')!, group: 'Topology Topology' },
  { plugin: allNetwork.find((p) => p.type === 'internet')!, group: 'Topology Topology' },
  { plugin: allNetwork.find((p) => p.type === 'lan')!, group: 'Topology Topology' },
  { plugin: allNetwork.find((p) => p.type === 'wan')!, group: 'Topology Topology' },
];

export const libraryGroups: Array<{ name: string; items: LibraryItem[] }> = (() => {
  const map = new Map<string, LibraryItem[]>();
  for (const item of library) {
    const list = map.get(item.group) ?? [];
    list.push(item);
    map.set(item.group, list);
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
})();

const pluginMap = new Map<string, ShapePlugin>();
for (const { plugin } of library) pluginMap.set(plugin.type, plugin);

export function getPlugin(type: string): ShapePlugin | undefined {
  return pluginMap.get(type);
}
