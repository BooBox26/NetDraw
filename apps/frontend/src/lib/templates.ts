// Built-in starter templates. Each template returns a complete Diagram
// object that can be loaded into the store to start a new project.

import { DEFAULT_STYLE, type Connector, type Diagram, type Shape } from '../types/diagram';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'Cloud' | 'Network' | 'DevOps' | 'BPMN' | 'ERD' | 'Floorplan' | 'UML';
  build: () => Diagram;
}

let n = 0;
const id = (prefix: string): string => `${prefix}-${++n}`;

function shape(
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  style: Partial<typeof DEFAULT_STYLE> = {}
): Shape {
  return {
    id: id('sh'),
    type,
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    style: { ...DEFAULT_STYLE, ...style },
    text,
  };
}

function conn(s: Shape, t: Shape, label?: string): Connector {
  return {
    id: id('co'),
    type: 'orthogonal',
    sourceId: s.id,
    targetId: t.id,
    style: { ...DEFAULT_STYLE, stroke: '#475569', strokeWidth: 1.5 },
    label,
    arrows: 'forward',
  };
}

const blank = (): Diagram => ({
  schema: 1,
  layers: [
    { id: 'layer-default', name: 'Layer 1', visible: true, locked: false, opacity: 1, zIndex: 0 },
  ],
  shapes: [],
  connectors: [],
  page: {
    width: 1600,
    height: 1000,
    background: '#ffffff',
    gridSize: 10,
    gridVisible: true,
    snapToGrid: true,
  },
});

function cloud3Tier(): Diagram {
  n = 0;
  const user = shape('workstation', 100, 100, 100, 80, 'User');
  const cdn = shape('cloud', 320, 100, 120, 70, 'CloudFront');
  const lb = shape('load-balancer', 540, 100, 120, 70, 'ELB');
  const web1 = shape('web-server', 760, 40, 120, 70, 'Web 1');
  const web2 = shape('web-server', 760, 160, 120, 70, 'Web 2');
  const app1 = shape('app-server', 980, 40, 120, 70, 'App 1');
  const app2 = shape('app-server', 980, 160, 120, 70, 'App 2');
  const db = shape('database', 1200, 100, 140, 80, 'RDS Postgres');
  const cache = shape('database', 980, 280, 120, 70, 'Redis', { fill: '#fef2f2' });
  return {
    ...blank(),
    shapes: [user, cdn, lb, web1, web2, app1, app2, db, cache],
    connectors: [
      conn(user, cdn, 'HTTPS'),
      conn(cdn, lb),
      conn(lb, web1),
      conn(lb, web2),
      conn(web1, app1),
      conn(web2, app2),
      conn(app1, db, 'SQL'),
      conn(app2, db, 'SQL'),
      conn(app1, cache),
      conn(app2, cache),
    ],
  };
}

function k8sCluster(): Diagram {
  n = 0;
  const ingress = shape('cloud', 100, 100, 140, 70, 'Ingress');
  const svc = shape('router', 340, 100, 120, 70, 'Service');
  const pod1 = shape('container', 560, 40, 100, 70, 'pod-a');
  const pod2 = shape('container', 560, 160, 100, 70, 'pod-b');
  const pod3 = shape('container', 560, 280, 100, 70, 'pod-c');
  const config = shape('storage', 760, 100, 120, 70, 'ConfigMap');
  const secret = shape('storage', 760, 220, 120, 70, 'Secret', { fill: '#fef2f2' });
  return {
    ...blank(),
    shapes: [ingress, svc, pod1, pod2, pod3, config, secret],
    connectors: [
      conn(ingress, svc),
      conn(svc, pod1),
      conn(svc, pod2),
      conn(svc, pod3),
      conn(pod1, config),
      conn(pod2, secret),
    ],
  };
}

function bpmnOrder(): Diagram {
  n = 0;
  const start = shape('ellipse', 80, 200, 60, 60, 'Start', { fill: '#16a34a', stroke: '#14532d' });
  const order = shape('rectangle', 200, 180, 120, 100, 'Receive order');
  const validate = shape('decision', 380, 180, 140, 100, 'Valid?');
  const reject = shape('rectangle', 580, 80, 120, 70, 'Reject');
  const fulfill = shape('process', 580, 280, 120, 80, 'Fulfill');
  const ship = shape('document', 760, 280, 120, 80, 'Ship');
  const end = shape('ellipse', 940, 280, 60, 60, 'End', { fill: '#dc2626', stroke: '#7f1d1d' });
  return {
    ...blank(),
    shapes: [start, order, validate, reject, fulfill, ship, end],
    connectors: [
      conn(start, order),
      conn(order, validate),
      conn(validate, reject, 'No'),
      conn(validate, fulfill, 'Yes'),
      conn(fulfill, ship),
      conn(ship, end),
    ],
  };
}

function erdEcommerce(): Diagram {
  n = 0;
  const user = shape('rectangle', 80, 80, 160, 120, 'User\n(id, name, email)', { fill: '#dbeafe' });
  const order = shape('rectangle', 320, 80, 160, 140, 'Order\n(id, user_id, total)', {
    fill: '#dcfce7',
  });
  const product = shape('rectangle', 560, 80, 160, 140, 'Product\n(id, sku, price)', {
    fill: '#fef3c7',
  });
  const lineItem = shape('rectangle', 320, 300, 160, 120, 'LineItem\n(order_id, product_id, qty)', {
    fill: '#fce7f3',
  });
  return {
    ...blank(),
    shapes: [user, order, product, lineItem],
    connectors: [
      conn(user, order, '1..*'),
      conn(order, lineItem, '1..*'),
      conn(lineItem, product, '1..1'),
    ],
  };
}

function gcpVpc(): Diagram {
  n = 0;
  const internet = shape('internet', 100, 200, 100, 80, 'Internet');
  const fw = shape('firewall', 280, 200, 120, 80, 'Firewall');
  const lb = shape('load-balancer', 480, 200, 120, 80, 'HTTPS LB');
  const subnet = shape('rectangle', 680, 100, 260, 280, 'subnet-10.0.0.0/24', {
    fill: '#f1f5f9',
    strokeDasharray: '4 3',
  });
  const vm1 = shape('server', 720, 140, 100, 70, 'vm-app-1');
  const vm2 = shape('server', 720, 240, 100, 70, 'vm-app-2');
  const db = shape('database', 880, 200, 100, 80, 'Cloud SQL');
  return {
    ...blank(),
    shapes: [internet, fw, lb, subnet, vm1, vm2, db],
    connectors: [
      conn(internet, fw),
      conn(fw, lb),
      conn(lb, vm1),
      conn(lb, vm2),
      conn(vm1, db, 'private'),
      conn(vm2, db, 'private'),
    ],
  };
}

function ciscoRack(): Diagram {
  n = 0;
  const rack = shape('rack', 200, 60, 200, 380, '42U Rack', { fill: '#0f172a' });
  const sw1 = shape('switch', 240, 100, 120, 60, 'Switch 1', { fill: '#1e293b' });
  const sw2 = shape('switch', 240, 180, 120, 60, 'Switch 2', { fill: '#1e293b' });
  const fw = shape('firewall', 240, 260, 120, 60, 'ASA Firewall', { fill: '#7f1d1d' });
  const srv1 = shape('server', 240, 340, 120, 60, 'ESXi 1', { fill: '#1e293b' });
  const srv2 = shape('server', 240, 400, 120, 60, 'ESXi 2', { fill: '#1e293b' });
  return {
    ...blank(),
    page: {
      width: 1600,
      height: 1000,
      background: '#ffffff',
      gridSize: 10,
      gridVisible: true,
      snapToGrid: true,
    },
    shapes: [rack, sw1, sw2, fw, srv1, srv2],
    connectors: [conn(sw1, sw2, 'LACP'), conn(sw1, fw), conn(fw, srv1), conn(fw, srv2)],
  };
}

function activeDirectory(): Diagram {
  n = 0;
  const user = shape('user', 80, 100, 100, 80, 'User');
  const dc = shape('server', 280, 100, 120, 80, 'Domain Controller', { fill: '#1e40af' });
  const dns = shape('dns', 280, 240, 120, 80, 'DNS', { fill: '#0891b2' });
  const fs1 = shape('storage', 480, 60, 120, 80, 'File Server 1');
  const fs2 = shape('storage', 480, 180, 120, 80, 'File Server 2');
  const exchange = shape('mail-server', 480, 300, 140, 80, 'Exchange', { fill: '#0891b2' });
  return {
    ...blank(),
    shapes: [user, dc, dns, fs1, fs2, exchange],
    connectors: [
      conn(user, dc, 'LDAP/Kerberos'),
      conn(dc, dns),
      conn(dc, fs1, 'SMB'),
      conn(dc, fs2, 'SMB'),
      conn(dc, exchange, 'MAPI'),
    ],
  };
}

function officeFloorplan(): Diagram {
  n = 0;
  const wall1 = shape('rectangle', 60, 60, 600, 10, '', { fill: '#475569', strokeWidth: 0 });
  const wall2 = shape('rectangle', 60, 60, 10, 360, '', { fill: '#475569', strokeWidth: 0 });
  const wall3 = shape('rectangle', 60, 410, 600, 10, '', { fill: '#475569', strokeWidth: 0 });
  const wall4 = shape('rectangle', 650, 60, 10, 360, '', { fill: '#475569', strokeWidth: 0 });
  const desk1 = shape('rectangle', 120, 120, 100, 60, 'Desk 1', { fill: '#dbeafe' });
  const desk2 = shape('rectangle', 280, 120, 100, 60, 'Desk 2', { fill: '#dbeafe' });
  const desk3 = shape('rectangle', 440, 120, 100, 60, 'Desk 3', { fill: '#dbeafe' });
  const meeting = shape('rectangle', 350, 260, 240, 120, 'Meeting Room', { fill: '#fef3c7' });
  return {
    ...blank(),
    shapes: [wall1, wall2, wall3, wall4, desk1, desk2, desk3, meeting],
    connectors: [],
  };
}

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from a clean page',
    category: 'Cloud',
    build: blank,
  },
  {
    id: 'aws-3tier',
    name: 'AWS 3-tier',
    description: 'CloudFront → ELB → EC2 → RDS',
    category: 'Cloud',
    build: cloud3Tier,
  },
  {
    id: 'gcp-vpc',
    name: 'GCP VPC',
    description: 'Firewall, load balancer, subnet, Cloud SQL',
    category: 'Cloud',
    build: gcpVpc,
  },
  {
    id: 'k8s',
    name: 'Kubernetes cluster',
    description: 'Ingress, Service, Pods, ConfigMap, Secret',
    category: 'DevOps',
    build: k8sCluster,
  },
  {
    id: 'cisco',
    name: 'Cisco rack',
    description: 'Switches, firewall, ESXi servers',
    category: 'Network',
    build: ciscoRack,
  },
  {
    id: 'ad',
    name: 'Active Directory',
    description: 'Domain controller, DNS, file servers, Exchange',
    category: 'Network',
    build: activeDirectory,
  },
  {
    id: 'bpmn-order',
    name: 'Order workflow (BPMN)',
    description: 'Receive → validate → fulfill → ship',
    category: 'BPMN',
    build: bpmnOrder,
  },
  {
    id: 'erd-ecom',
    name: 'E-commerce ERD',
    description: 'User, Order, Product, LineItem',
    category: 'ERD',
    build: erdEcommerce,
  },
  {
    id: 'office',
    name: 'Office floor plan',
    description: 'Three desks and a meeting room',
    category: 'Floorplan',
    build: officeFloorplan,
  },
];
