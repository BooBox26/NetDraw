// Core diagram types — shared between the canvas, the store, the API and
// the import/export pipeline. Keep this file framework-free.

export type ID = string;

export type ConnectorKind =
  | 'straight'
  | 'orthogonal'
  | 'bezier'
  | 'bus' // horizontal/vertical bus bar
  | 'bundle' // cable bundle (multiple sub-links)
  | 'radio' // dotted arc / wireless
  | 'logical'; // dashed with cloud-style midpoint

export type ArrowHead = 'none' | 'forward' | 'backward' | 'both';

/** Operational state of a network link */
export type LinkState = 'active' | 'backup' | 'down' | 'planned' | 'deprecated' | 'unknown';

/** Technology type — drives default visual style */
export type LinkTechnology =
  | 'ethernet'
  | 'fiber'
  | 'copper'
  | 'coaxial'
  | 'radio'
  | 'wifi'
  | 'vpn'
  | 'mpls'
  | 'sd-wan'
  | 'ipsec'
  | 'gre'
  | 'vxlan'
  | 'evpn'
  | 'internet'
  | 'generic';

/** Physical vs logical link distinction */
export type LinkLayer = 'physical' | 'logical';

/** Port media type for validation */
export type PortMediaType = 'copper' | 'fiber' | 'sfp' | 'console' | 'usb' | 'radio' | 'logical';

/** Bundle/aggregation type */
export type BundleType =
  | 'lag'
  | 'lacp'
  | 'port-channel'
  | 'mlag'
  | 'vpc'
  | 'stack'
  | 'trunk'
  | 'cable-bundle';

export type ShapeType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'parallelogram'
  | 'text'
  | 'line'
  | 'image'
  | 'group'
  | 'path' // Network icons
  | 'router'
  | 'switch'
  | 'firewall'
  | 'server'
  | 'rack'
  | 'ont'
  | 'olt'
  | 'cloud'
  | 'internet'
  | 'lan'
  | 'wan'
  | 'wifi'
  | 'workstation'
  | 'laptop'
  | 'phone'
  | 'printer'
  | 'database'
  | 'access-point'
  | 'camera'
  | 'tv';

export interface ShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textColor?: string;
  /**
   * Optional per-vector color slots, used by plugins that expose a `colorSlots`
   * definition. Allows every sub-element of a shape (body, accent, screen, LED)
   * to be recolored independently without changing the shape's main fill/stroke.
   */
  theme?: Record<string, string>;
  /** Optional gradient stops for gradient-based shapes. */
  gradient?: {
    type: 'linear' | 'radial';
    /** Stops in the form { offset: 0..1, color: '#rrggbb' }. */
    stops: Array<{ offset: number; color: string }>;
    angle?: number; // for linear, 0 = left-to-right, 90 = top-to-bottom
  };
  /**
   * For free-drawing tools (pen, pencil, highlighter): the underlying SVG
   * path data, drawn in the shape's local coordinate system.
   */
  pathData?: string;
  /** When true, the shape acts as a translucent highlighter overlay. */
  isHighlighter?: boolean;
}

export interface Shape {
  id: ID;
  type: ShapeType | string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layerId?: ID;
  parentId?: ID | null;
  zIndex?: number;
  style: ShapeStyle;
  text?: string;
  /** Optional hyperlink: URL or `page:<id>` reference. */
  link?: string;
  /** Markdown text, used as a rendering alternative to the plain `text` field. */
  markdown?: string;
  /** Custom metadata (host, IP, vendor, model...) for inventory and export. */
  metadata?: Record<string, string>;
  /** Component master id when this shape is an instance. */
  masterId?: ID;
  /** Per-instance overrides keyed by shape id within the master. */
  overrides?: Record<string, Partial<Shape>>;
  // SVG payload for custom / imported shapes.
  data?: Record<string, unknown> & { svg?: string };
  locked?: boolean;

  /** Named network ports/interfaces for precise link attachment */
  ports?: ShapePort[];
  /** Detailed device modeling for network nodes */
  device?: DeviceMetadata;
}

export interface DeviceModule {
  id: string;
  name: string;
  slotNumber: string;
  model?: string;
  serialNumber?: string;
  status?: string;
}

export interface StackMember {
  id: string;
  hostname: string;
  memberId: number;
  model?: string;
  serialNumber?: string;
  role?: 'master' | 'backup' | 'member';
}

export interface DeviceMetadata {
  hostname?: string;
  role?:
    | 'core'
    | 'distribution'
    | 'access'
    | 'edge'
    | 'pe'
    | 'ce'
    | 'spine'
    | 'leaf'
    | 'border'
    | 'transit'
    | 'management'
    | 'generic';
  vendor?: string;
  model?: string;
  osName?: string;
  osVersion?: string;
  serialNumber?: string;
  status?: 'planned' | 'active' | 'staging' | 'deprecated' | 'retired' | 'unknown';
  owner?: string;
  tags?: string[];
  modules?: DeviceModule[];
  stackMembers?: StackMember[];
  isHACluster?: boolean;
  haMode?: 'active-passive' | 'active-active';
}

export interface VRF {
  id: string;
  name: string;
  description?: string;
}

export interface SubnetPrefix {
  id: string;
  prefix: string;
  name: string;
  vrfId?: string;
  vlanId?: string;
  zone?: string;
  gateway?: string;
  site?: string;
}

/** A named port/interface on a network shape */
export interface ShapePort {
  /** Unique id within this shape (e.g. 'gi0-1', 'eth0') */
  id: string;
  /** Display label (e.g. 'Gi0/1', 'eth0', 'SFP1') */
  label: string;
  /** Position relative to shape (0-1 normalized), 0=left/top, 1=right/bottom */
  x: number;
  y: number;
  /** Port type for validation */
  mediaType?: PortMediaType;
  /** Port speed (e.g. '1G', '10G', '100M') */
  speed?: string;
  /** Whether the port is currently connected — auto-computed at render time */
  connected?: boolean;
  /** IP address associated with this port */
  ipAddress?: string;
  /** VLAN identifier */
  vlan?: string;
  /** Port technical description */
  description?: string;
  /** Port interface operational state */
  status?: 'up' | 'down' | 'disabled';
  /** Port visual persistent display toggle */
  visibleOnDiagram?: boolean;
}

export interface Connector {
  id: ID;
  type: ConnectorKind;
  sourceId: ID | null;
  targetId: ID | null;
  sourceAnchor?: string | null;
  targetAnchor?: string | null;
  sourcePoint?: { x: number; y: number };
  targetPoint?: { x: number; y: number };
  style: ShapeStyle;
  label?: string;
  labelOffset?: Point;
  arrows: ArrowHead;
  zIndex?: number;
  // Routing hint for orthogonal: number of bends (1, 2, 3...).
  bends?: number;

  // --- Network link fields ---

  /** User-defined waypoints for manual routing control */
  waypoints?: Point[];
  /** When true, auto-routing is disabled — user controls the path */
  routingLocked?: boolean;

  /** Source port/interface name (e.g. 'Gi0/1', 'eth0') */
  sourcePort?: string;
  sourcePortOffset?: Point;
  /** Target port/interface name */
  targetPort?: string;
  targetPortOffset?: Point;

  /** Link technology — drives default visual style */
  technology?: LinkTechnology;
  /** Physical or logical link */
  linkLayer?: LinkLayer;
  /** Operational state */
  linkState?: LinkState;

  /** Multi-label system: each label can be positioned independently */
  labels?: ConnectorLabel[];

  /** Capacity and link metadata */
  capacity?: ConnectorCapacity;

  /** For bundle/aggregation links (LAG, LACP, port-channel, etc.) */
  bundle?: ConnectorBundle;

  /** Parallel link offset index (auto-computed at render time) */
  parallelIndex?: number;
  /** Total parallel links between same source/target (auto-computed) */
  parallelTotal?: number;

  /** When true, render visual crossing bridges where this link crosses others */
  crossingBridge?: boolean;
}

/** A positionable label on a connector */
export interface ConnectorLabel {
  /** Unique id within this connector */
  id: string;
  /** Display text */
  text: string;
  /** Position along the path: 0 = start, 0.5 = middle, 1 = end */
  position: number;
  /** Manual offset from the path position (for drag-to-reposition) */
  offset?: Point;
  /** Semantic role of this label — used for auto-generation from metadata */
  role?: ConnectorLabelRole;
}

export type ConnectorLabelRole =
  | 'custom'
  | 'bandwidth'
  | 'media'
  | 'vlan'
  | 'subnet'
  | 'source-port'
  | 'target-port'
  | 'circuit'
  | 'length'
  | 'utilization'
  | 'state';

/** Capacity and network metadata for a link */
export interface ConnectorCapacity {
  /** Bandwidth (e.g. '10G', '1G', '100M') */
  bandwidth?: string;
  /** Current utilization as a percentage 0-100 */
  utilization?: number;
  /** Peak utilization percentage */
  peakUtilization?: number;
  /** Error rate percentage */
  errorRate?: number;
  /** Physical media type (e.g. 'SMF', 'MMF', 'Cat6', 'Cat6a') */
  media?: string;
  /** VLAN assignment */
  vlan?: string;
  /** Subnet assignment */
  subnet?: string;
  /** Circuit identifier */
  circuitId?: string;
  /** Physical cable length */
  length?: string;
}

/** Bundle/aggregation metadata */
export interface ConnectorBundle {
  /** Aggregation type */
  type: BundleType;
  /** Number of member links */
  memberCount?: number;
  /** Labels for individual member links */
  memberLabels?: string[];
}

export interface Layer {
  id: ID;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
}

export interface Page {
  width: number;
  height: number;
  background: string;
  gridSize: number;
  gridVisible: boolean;
  snapToGrid: boolean;
  pageMode?: 'infinite' | 'printable';
  pageSize?: 'A4' | 'A3' | 'A2';
  pageOrientation?: 'portrait' | 'landscape';
}

export interface DiagramPage {
  id: ID;
  name: string;
  shapes: Shape[];
  connectors: Connector[];
  page: Page;
  layers: Layer[];
}

export interface Diagram {
  schema: 1;
  layers: Layer[];
  shapes: Shape[];
  connectors: Connector[];
  page: Page;
  pages?: DiagramPage[];
  activePageId?: ID;
  vrfs?: VRF[];
  subnets?: SubnetPrefix[];
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Project extends ProjectSummary {
  data: string;
}

export const DEFAULT_STYLE: ShapeStyle = {
  fill: '#ffffff',
  stroke: '#1f2937',
  strokeWidth: 1.5,
  opacity: 1,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  textAlign: 'center',
};

export function createDefaultDiagram(): Diagram {
  const defaultPage = {
    width: 1600,
    height: 1000,
    background: '#ffffff',
    gridSize: 10,
    gridVisible: true,
    snapToGrid: true,
    pageMode: 'infinite',
    pageSize: 'A4',
    pageOrientation: 'landscape',
  } as Page;

  const defaultLayers = [
    { id: 'layer-bg', name: 'Background', visible: true, locked: true, opacity: 1, zIndex: 0 },
    { id: 'layer-default', name: 'Layer 1', visible: true, locked: false, opacity: 1, zIndex: 1 },
  ];

  return {
    schema: 1,
    layers: defaultLayers,
    shapes: [],
    connectors: [],
    page: defaultPage,
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        shapes: [],
        connectors: [],
        page: defaultPage,
        layers: defaultLayers,
      },
    ],
    activePageId: 'page-1',
    vrfs: [],
    subnets: [],
  };
}
