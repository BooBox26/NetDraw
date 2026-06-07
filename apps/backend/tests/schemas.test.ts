import { describe, it, expect } from 'vitest';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  CreateSnapshotSchema,
  UpsertBranchSchema,
  UpsertWorkflowSchema,
  CreateAuditLogSchema,
} from '../src/schemas/project.js';

describe('Schema validation — comments', () => {
  it('accepts a valid comment payload', () => {
    const result = CreateCommentSchema.safeParse({
      x: 12.5,
      y: -3.14,
      text: 'Hello',
      author: 'Alice',
      shapeId: 'shape-1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-numeric coordinates', () => {
    const result = CreateCommentSchema.safeParse({ x: 'oops', y: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects oversized text', () => {
    const result = CreateCommentSchema.safeParse({ x: 0, y: 0, text: 'x'.repeat(20_000) });
    expect(result.success).toBe(false);
  });

  it('update schema allows partial updates', () => {
    const result = UpdateCommentSchema.safeParse({ status: 'resolved' });
    expect(result.success).toBe(true);
  });
});

describe('Schema validation — snapshots', () => {
  it('accepts a valid snapshot', () => {
    const result = CreateSnapshotSchema.safeParse({
      label: 'Release v1',
      diagram: { schema: 1, layers: [], shapes: [], connectors: [] },
    });
    expect(result.success).toBe(true);
  });

  it('requires the diagram field', () => {
    const result = CreateSnapshotSchema.safeParse({ label: 'X' });
    expect(result.success).toBe(false);
  });
});

describe('Schema validation — branches', () => {
  it('requires a name and diagram', () => {
    const ok = UpsertBranchSchema.safeParse({
      name: 'feature-x',
      diagram: { foo: 'bar' },
    });
    expect(ok.success).toBe(true);

    const missing = UpsertBranchSchema.safeParse({ name: '' });
    expect(missing.success).toBe(false);
  });
});

describe('Schema validation — workflow', () => {
  it('rejects unknown statuses', () => {
    const result = UpsertWorkflowSchema.safeParse({ status: 'invalid' as never });
    expect(result.success).toBe(false);
  });

  it('accepts signatures with bounded length', () => {
    const result = UpsertWorkflowSchema.safeParse({
      status: 'approved',
      signatures: [{ user: 'Alice', role: 'reviewer' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('Schema validation — audit log', () => {
  it('requires an action', () => {
    const missing = CreateAuditLogSchema.safeParse({});
    expect(missing.success).toBe(false);
  });

  it('bounds the action and details length', () => {
    const ok = CreateAuditLogSchema.safeParse({ action: 'create', details: 'x'.repeat(100) });
    expect(ok.success).toBe(true);

    const tooLong = CreateAuditLogSchema.safeParse({
      action: 'x'.repeat(200),
    });
    expect(tooLong.success).toBe(false);
  });
});
