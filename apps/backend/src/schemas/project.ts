import { z } from 'zod';

// Schemas for project payloads
// The `data` field stores a JSON-encoded diagram (shapes, connectors, layers...)
// plus metadata. We intentionally keep it permissive at the schema level
// because diagram structure evolves independently from the API contract.

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const BoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
});

export const ShapeStyleSchema = z.object({
  fill: z.string().default('#ffffff'),
  stroke: z.string().default('#1f2937'),
  strokeWidth: z.number().nonnegative().default(1),
  strokeDasharray: z.string().optional(),
  opacity: z.number().min(0).max(1).default(1),
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.number().int().nonnegative().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  pathData: z.string().optional(),
});

export const ShapePortSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  mediaType: z.enum(['copper', 'fiber', 'sfp', 'console', 'usb', 'radio', 'logical']).optional(),
  speed: z.string().optional(),
  connected: z.boolean().optional(),
  ipAddress: z.string().optional(),
  vlan: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['up', 'down', 'disabled']).optional(),
  visibleOnDiagram: z.boolean().optional(),
});

export const DeviceModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  slotNumber: z.string(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.string().optional(),
});

export const StackMemberSchema = z.object({
  id: z.string(),
  hostname: z.string(),
  memberId: z.number(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  role: z.enum(['master', 'backup', 'member']).optional(),
});

export const DeviceMetadataSchema = z.object({
  hostname: z.string().optional(),
  role: z
    .enum([
      'core',
      'distribution',
      'access',
      'edge',
      'pe',
      'ce',
      'spine',
      'leaf',
      'border',
      'transit',
      'management',
      'generic',
    ])
    .optional(),
  vendor: z.string().optional(),
  model: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(['planned', 'active', 'staging', 'deprecated', 'retired', 'unknown']).optional(),
  owner: z.string().optional(),
  tags: z.array(z.string()).optional(),
  modules: z.array(DeviceModuleSchema).optional(),
  stackMembers: z.array(StackMemberSchema).optional(),
  isHACluster: z.boolean().optional(),
  haMode: z.enum(['active-passive', 'active-active']).optional(),
});

export const ShapeSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  layerId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  zIndex: z.number().int().optional(),
  style: ShapeStyleSchema.optional(),
  text: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  ports: z.array(ShapePortSchema).optional(),
  device: DeviceMetadataSchema.optional(),
});

export const ConnectorLabelSchema = z.object({
  id: z.string(),
  text: z.string(),
  position: z.number(),
  offset: PointSchema.optional(),
  role: z.string().optional(),
});

export const ConnectorSchema = z.object({
  id: z.string(),
  type: z
    .enum(['straight', 'orthogonal', 'bezier', 'bus', 'bundle', 'radio', 'logical'])
    .default('straight'),
  sourceId: z.string().nullable(),
  targetId: z.string().nullable(),
  sourceAnchor: z.string().nullable().optional(),
  targetAnchor: z.string().nullable().optional(),
  sourcePoint: PointSchema.optional(),
  targetPoint: PointSchema.optional(),
  style: ShapeStyleSchema.optional(),
  label: z.string().optional(),
  labelOffset: PointSchema.optional(),
  arrows: z.enum(['none', 'forward', 'backward', 'both']).default('forward'),
  zIndex: z.number().int().optional(),
  waypoints: z.array(PointSchema).optional(),
  sourcePort: z.string().optional(),
  sourcePortOffset: PointSchema.optional(),
  targetPort: z.string().optional(),
  targetPortOffset: PointSchema.optional(),
  technology: z
    .enum([
      'ethernet',
      'fiber',
      'copper',
      'coaxial',
      'radio',
      'wifi',
      'vpn',
      'mpls',
      'sd-wan',
      'ipsec',
      'gre',
      'vxlan',
      'evpn',
      'internet',
      'generic',
    ])
    .optional(),
  layer: z.enum(['physical', 'logical']).optional(),
  state: z.enum(['active', 'backup', 'down', 'planned', 'deprecated', 'unknown']).optional(),
  labels: z.array(ConnectorLabelSchema).optional(),
  capacity: z
    .object({
      bandwidth: z.string().optional(),
      utilization: z.number().optional(),
      peakUtilization: z.number().optional(),
      errorRate: z.number().optional(),
      media: z.string().optional(),
      vlan: z.string().optional(),
      subnet: z.string().optional(),
      circuitId: z.string().optional(),
      length: z.string().optional(),
    })
    .optional(),
  bundle: z
    .object({
      type: z.enum([
        'lag',
        'lacp',
        'port-channel',
        'mlag',
        'vpc',
        'stack',
        'trunk',
        'cable-bundle',
      ]),
      memberCount: z.number().optional(),
      memberLabels: z.array(z.string()).optional(),
    })
    .optional(),
  parallelIndex: z.number().optional(),
  parallelTotal: z.number().optional(),
  crossingBridge: z.boolean().optional(),
});

export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  zIndex: z.number().int().default(0),
});

export const VRFSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const SubnetPrefixSchema = z.object({
  id: z.string(),
  prefix: z.string(),
  name: z.string(),
  vrfId: z.string().optional(),
  vlanId: z.string().optional(),
  zone: z.string().optional(),
  gateway: z.string().optional(),
  site: z.string().optional(),
});

export const DiagramSchema = z.object({
  schema: z.literal(1),
  layers: z.array(LayerSchema),
  shapes: z.array(ShapeSchema),
  connectors: z.array(ConnectorSchema),
  page: z
    .object({
      width: z.number().positive().default(1280),
      height: z.number().positive().default(720),
      background: z.string().default('#ffffff'),
      gridSize: z.number().positive().default(10),
      gridVisible: z.boolean().default(true),
      snapToGrid: z.boolean().default(true),
    })
    .default({
      width: 1280,
      height: 720,
      background: '#ffffff',
      gridSize: 10,
      gridVisible: true,
      snapToGrid: true,
    }),
  vrfs: z.array(VRFSchema).optional(),
  subnets: z.array(SubnetPrefixSchema).optional(),
});

export type Diagram = z.infer<typeof DiagramSchema>;
export type ShapeInput = z.infer<typeof ShapeSchema>;
export type ConnectorInput = z.infer<typeof ConnectorSchema>;
export type LayerInput = z.infer<typeof LayerSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().max(500_000).optional(),
  data: z.union([z.string(), DiagramSchema]),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  thumbnail: z.string().max(500_000).optional(),
  data: z.union([z.string(), DiagramSchema]).optional(),
  lastLoadedAt: z.string().optional(),
});

export const CreateCommentSchema = z.object({
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite(),
  shapeId: z.string().max(120).optional().nullable(),
  author: z.string().min(1).max(120).optional(),
  text: z.string().min(0).max(10_000).optional(),
  status: z.enum(['open', 'resolved']).optional(),
  replies: z.array(z.record(z.unknown())).optional(),
});

export const UpdateCommentSchema = z.object({
  text: z.string().max(10_000).optional(),
  status: z.enum(['open', 'resolved']).optional(),
  replies: z.array(z.record(z.unknown())).optional(),
});

export const CreateSnapshotSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  diagram: z.union([z.string(), DiagramSchema, z.record(z.unknown())]),
});

export const UpsertBranchSchema = z.object({
  name: z.string().min(1).max(120),
  diagram: z.union([z.string(), DiagramSchema, z.record(z.unknown())]),
});

export const UpsertWorkflowSchema = z.object({
  status: z.enum(['draft', 'review', 'approved', 'rejected', 'archived']),
  signatures: z
    .array(
      z.object({
        user: z.string().max(120),
        role: z.string().max(60).optional(),
        signedAt: z.union([z.string(), z.number()]).optional(),
        comment: z.string().max(2000).optional(),
      })
    )
    .optional(),
});

export const CreateAuditLogSchema = z.object({
  user: z.string().min(1).max(120).optional(),
  action: z.string().min(1).max(120),
  details: z.string().max(4000).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
export type CreateSnapshotInput = z.infer<typeof CreateSnapshotSchema>;
export type UpsertBranchInput = z.infer<typeof UpsertBranchSchema>;
export type UpsertWorkflowInput = z.infer<typeof UpsertWorkflowSchema>;
export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;
