// Seed script: creates 3 demo diagrams (LAN, ISP, Datacenter).
// Run with: node --import tsx scripts/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DemoShape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text?: string;
  style: { fill: string; stroke: string; strokeWidth: number; opacity: number };
}

interface DemoConnector {
  id: string;
  type: 'straight' | 'orthogonal' | 'bezier';
  sourceId: string | null;
  targetId: string | null;
  sourceAnchor: string | null;
  targetAnchor: string | null;
  style: { fill: string; stroke: string; strokeWidth: number; opacity: number };
  arrows: 'none' | 'forward' | 'backward' | 'both';
  label?: string;
}

interface DemoDiagram {
  name: string;
  description: string;
  shapes: DemoShape[];
  connectors: DemoConnector[];
}

function shape(type: string, x: number, y: number, text?: string, fill = '#ffffff'): DemoShape {
  const sizes: Record<string, { width: number; height: number }> = {
    router: { width: 110, height: 70 },
    switch: { width: 130, height: 50 },
    firewall: { width: 100, height: 90 },
    server: { width: 100, height: 110 },
    'access-point': { width: 110, height: 100 },
    workstation: { width: 110, height: 90 },
    laptop: { width: 110, height: 70 },
    phone: { width: 60, height: 100 },
    cloud: { width: 130, height: 80 },
    internet: { width: 130, height: 80 },
    ont: { width: 110, height: 50 },
    olt: { width: 150, height: 70 },
    printer: { width: 110, height: 90 },
  };
  const size = sizes[type] ?? { width: 100, height: 80 };
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    x,
    y,
    width: size.width,
    height: size.height,
    rotation: 0,
    text,
    style: { fill, stroke: '#0f172a', strokeWidth: 1.5, opacity: 1 },
  };
}

function conn(
  sourceId: string,
  targetId: string,
  sourceAnchor: string,
  targetAnchor: string,
  type: 'straight' | 'orthogonal' | 'bezier' = 'orthogonal',
  label?: string
): DemoConnector {
  return {
    id: `c-${Math.random().toString(36).slice(2, 8)}`,
    type,
    sourceId,
    targetId,
    sourceAnchor,
    targetAnchor,
    style: { fill: 'transparent', stroke: '#0f172a', strokeWidth: 1.5, opacity: 1 },
    arrows: 'forward',
    label,
  };
}

const enterprise: DemoDiagram = {
  name: 'Enterprise LAN',
  description:
    'Typical corporate LAN with a firewall, core/distribution switches and access points.',
  shapes: [
    shape('internet', 60, 60, 'ISP'),
    shape('firewall', 260, 50, 'Edge FW'),
    shape('router', 460, 60, 'Core Router'),
    shape('switch', 660, 70, 'Core Switch', '#f8fafc'),
    shape('switch', 660, 200, 'Distro SW A', '#f8fafc'),
    shape('switch', 660, 320, 'Distro SW B', '#f8fafc'),
    shape('access-point', 880, 200, 'AP-Floor1'),
    shape('access-point', 880, 320, 'AP-Floor2'),
    shape('server', 460, 240, 'Auth/DNS'),
    shape('server', 460, 380, 'Files'),
    shape('printer', 880, 470, 'Printer'),
    shape('workstation', 1080, 220, 'WS-01'),
    shape('workstation', 1080, 360, 'WS-02'),
  ],
  connectors: [
    conn('internet-internet-77a', 'firewall-firewall-77a', 'e', 'w'),
    conn('firewall-firewall-77a', 'router-router-77a', 'e', 'w'),
    conn('router-router-77a', 'switch-switch-77a', 'e', 'w'),
    conn('switch-switch-77a', 'switch-switch-77a', 's', 'n', 'orthogonal', 'Trunk A'),
    conn('switch-switch-77a', 'switch-switch-77a', 's', 'n', 'orthogonal', 'Trunk B'),
    conn('switch-switch-77a', 'access-point-access-point-77a', 'e', 'w'),
    conn('switch-switch-77a', 'access-point-access-point-77a', 'e', 'w'),
    conn('router-router-77a', 'server-server-77a', 's', 'n'),
    conn('router-router-77a', 'server-server-77a', 's', 'n'),
    conn('switch-switch-77a', 'printer-printer-77a', 'e', 'w'),
    conn('access-point-access-point-77a', 'workstation-workstation-77a', 'e', 'w'),
    conn('access-point-access-point-77a', 'workstation-workstation-77a', 'e', 'w'),
  ],
};
// Above random IDs are placeholders; reset to deterministic IDs:
function reid(d: DemoDiagram): DemoDiagram {
  const map = new Map<string, string>();
  const next = (p: string): string => `${p}-${Math.random().toString(36).slice(2, 8)}`;
  for (const s of d.shapes) {
    map.set(s.id, next(s.type));
    s.id = map.get(s.id)!;
  }
  for (const c of d.connectors) {
    if (c.sourceId) c.sourceId = map.get(c.sourceId) ?? c.sourceId;
    if (c.targetId) c.targetId = map.get(c.targetId) ?? c.targetId;
    c.id = next('c');
  }
  return d;
}
reid(enterprise);

// ISP diagram
const isp: DemoDiagram = {
  name: 'ISP — FTTH architecture',
  description: 'Simplified FTTH architecture: backbone, OLT, splitters, ONTs.',
  shapes: [
    shape('internet', 60, 60, 'Internet'),
    shape('router', 260, 60, 'BRAS'),
    shape('olt', 460, 50, 'OLT-01', '#fff7ed'),
    shape('server', 460, 160, 'AAA / DHCP'),
    shape('cloud', 700, 60, 'PON cloud'),
    shape('ont', 880, 60, 'ONT-Cust-1'),
    shape('ont', 880, 160, 'ONT-Cust-2'),
    shape('router', 1080, 60, 'Home Router'),
    shape('router', 1080, 160, 'Home Router'),
    shape('workstation', 1240, 60, 'PC'),
    shape('laptop', 1240, 160, 'Laptop'),
  ],
  connectors: [
    conn('internet-internet-aaa', 'router-router-aaa', 'e', 'w'),
    conn('router-router-aaa', 'olt-olt-aaa', 'e', 'w'),
    conn('olt-olt-aaa', 'server-server-aaa', 's', 'n'),
    conn('olt-olt-aaa', 'cloud-cloud-aaa', 'e', 'w'),
    conn('cloud-cloud-aaa', 'ont-ont-aaa', 'e', 'w'),
    conn('cloud-cloud-aaa', 'ont-ont-aaa', 'e', 'w'),
    conn('ont-ont-aaa', 'router-router-aaa', 'e', 'w'),
    conn('ont-ont-aaa', 'router-router-aaa', 'e', 'w'),
    conn('router-router-aaa', 'workstation-workstation-aaa', 'e', 'w'),
    conn('router-router-aaa', 'laptop-laptop-aaa', 'e', 'w'),
  ],
};
reid(isp);

// Datacenter rack
const dc: DemoDiagram = {
  name: 'Datacenter rack',
  description: '42U rack with ToR switches, servers and PDU.',
  shapes: [
    shape('rack', 60, 40, 'R42U-01', '#0f172a'),
    shape('switch', 280, 60, 'ToR-SW-1', '#f8fafc'),
    shape('switch', 280, 160, 'ToR-SW-2', '#f8fafc'),
    shape('server', 280, 260, 'srv-web-01'),
    shape('server', 280, 400, 'srv-db-01'),
    shape('database', 500, 260, 'PG-primary'),
    shape('database', 500, 400, 'PG-replica'),
    shape('firewall', 720, 160, 'FW-DC'),
    shape('router', 720, 320, 'Edge Router'),
    shape('cloud', 920, 220, 'Cloud VPC'),
  ],
  connectors: [
    conn('rack-rack-bbb', 'switch-switch-bbb', 'e', 'w'),
    conn('rack-rack-bbb', 'switch-switch-bbb', 'e', 'w'),
    conn('rack-rack-bbb', 'server-server-bbb', 'e', 'w'),
    conn('rack-rack-bbb', 'server-server-bbb', 'e', 'w'),
    conn('switch-switch-bbb', 'database-database-bbb', 'e', 'w'),
    conn('switch-switch-bbb', 'database-database-bbb', 'e', 'w'),
    conn('switch-switch-bbb', 'firewall-firewall-bbb', 'e', 'w'),
    conn('firewall-firewall-bbb', 'router-router-bbb', 's', 'n'),
    conn('router-router-bbb', 'cloud-cloud-bbb', 'e', 'w'),
  ],
};
reid(dc);

async function main(): Promise<void> {
  for (const demo of [enterprise, isp, dc]) {
    const diagram = {
      schema: 1,
      layers: [
        { id: 'layer-bg', name: 'Background', visible: true, locked: true, opacity: 1, zIndex: 0 },
        {
          id: 'layer-default',
          name: 'Layer 1',
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: 1,
        },
      ],
      shapes: demo.shapes,
      connectors: demo.connectors,
      page: {
        width: 1600,
        height: 1000,
        background: '#ffffff',
        gridSize: 10,
        gridVisible: true,
        snapToGrid: true,
      },
    };
    await prisma.project.upsert({
      where: { id: `demo-${demo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
      update: {},
      create: {
        id: `demo-${demo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: `[Demo] ${demo.name}`,
        description: demo.description,
        data: JSON.stringify(diagram),
      },
    });
    console.log(`Seeded: ${demo.name}`);
  }
  await prisma.$disconnect();
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
