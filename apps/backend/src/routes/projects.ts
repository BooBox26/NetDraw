import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateCommentSchema,
  UpdateCommentSchema,
  CreateSnapshotSchema,
  UpsertBranchSchema,
  UpsertWorkflowSchema,
  CreateAuditLogSchema,
  DiagramSchema,
} from '../schemas/project.js';
import { httpErrors, sendError } from '../lib/errors.js';

function serializeData(data: unknown): string {
  if (typeof data === 'string') return data;
  // We accept both validated diagram objects and pre-serialized strings.
  // Strings can come from compressed .ndj payloads; objects come from the editor.
  if (data && typeof data === 'object') {
    const parsed = DiagramSchema.safeParse(data);
    if (parsed.success) return JSON.stringify(parsed.data);
    // Best-effort pass-through: store raw JSON. Client owns canonical schema.
    return JSON.stringify(data);
  }
  return JSON.stringify(data);
}

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  // List projects
  app.get('/projects', async (req, reply) => {
    try {
      const projects = await prisma.project.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          thumbnail: true,
          updatedAt: true,
          createdAt: true,
        },
      });
      return { projects };
    } catch (err) {
      req.log.error({ err }, 'failed to list projects');
      return sendError(reply, err);
    }
  });

  // Create project
  app.post('/projects', async (req, reply) => {
    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid project payload',
          details: parsed.error.flatten(),
        },
      });
    }
    try {
      const project = await prisma.project.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          thumbnail: parsed.data.thumbnail ?? null,
          data: serializeData(parsed.data.data),
        },
      });
      return reply.status(201).send({ project });
    } catch (err) {
      req.log.error({ err }, 'failed to create project');
      return sendError(reply, err);
    }
  });

  // Get project by id
  app.get<{ Params: { id: string } }>('/projects/:id', async (req, reply) => {
    const { id } = req.params;
    try {
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) throw httpErrors.notFound('Project not found');
      return { project };
    } catch (err) {
      if (err instanceof Error && err.message === 'Project not found') {
        return reply.status(404).send({
          error: { code: 'not_found', message: 'Project not found' },
        });
      }
      req.log.error({ err }, 'failed to get project');
      return sendError(reply, err);
    }
  });

  // Update project
  app.put<{ Params: { id: string } }>('/projects/:id', async (req, reply) => {
    const parsed = UpdateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid project payload',
          details: parsed.error.flatten(),
        },
      });
    }
    const { id } = req.params;
    try {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({
          error: { code: 'not_found', message: 'Project not found' },
        });
      }
      if (parsed.data.lastLoadedAt) {
        const clientTime = new Date(parsed.data.lastLoadedAt).getTime();
        const serverTime = new Date(existing.updatedAt).getTime();
        if (serverTime > clientTime + 1500) {
          return reply.status(409).send({
            error: {
              code: 'conflict',
              message: 'Conflict: The project has been modified on the server.',
            },
          });
        }
      }
      const project = await prisma.project.update({
        where: { id },
        data: {
          name: parsed.data.name ?? existing.name,
          description:
            parsed.data.description !== undefined ? parsed.data.description : existing.description,
          thumbnail:
            parsed.data.thumbnail !== undefined ? parsed.data.thumbnail : existing.thumbnail,
          data: parsed.data.data !== undefined ? serializeData(parsed.data.data) : existing.data,
        },
      });
      return { project };
    } catch (err) {
      req.log.error({ err }, 'failed to update project');
      return sendError(reply, err);
    }
  });

  // Save endpoint used by auto-save (alias of PUT).
  app.post<{ Params: { id: string } }>('/projects/:id/save', async (req, reply) => {
    const parsed = UpdateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid project payload',
          details: parsed.error.flatten(),
        },
      });
    }
    const { id } = req.params;
    try {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({
          error: { code: 'not_found', message: 'Project not found' },
        });
      }
      if (parsed.data.lastLoadedAt) {
        const clientTime = new Date(parsed.data.lastLoadedAt).getTime();
        const serverTime = new Date(existing.updatedAt).getTime();
        if (serverTime > clientTime + 1500) {
          return reply.status(409).send({
            error: {
              code: 'conflict',
              message: 'Conflict: The project has been modified on the server.',
            },
          });
        }
      }
      const project = await prisma.project.update({
        where: { id },
        data: {
          name: parsed.data.name ?? existing.name,
          description:
            parsed.data.description !== undefined ? parsed.data.description : existing.description,
          thumbnail:
            parsed.data.thumbnail !== undefined ? parsed.data.thumbnail : existing.thumbnail,
          data: parsed.data.data !== undefined ? serializeData(parsed.data.data) : existing.data,
        },
      });
      return { project, saved: true };
    } catch (err) {
      req.log.error({ err }, 'failed to save project');
      return sendError(reply, err);
    }
  });

  // Duplicate project
  app.post<{ Params: { id: string } }>('/projects/:id/duplicate', async (req, reply) => {
    const { id } = req.params;
    try {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({
          error: { code: 'not_found', message: 'Project not found' },
        });
      }
      const created = await prisma.project.create({
        data: {
          name: `${existing.name} (copy)`,
          description: existing.description,
          thumbnail: existing.thumbnail,
          data: existing.data,
        },
      });
      return reply.status(201).send({ project: created });
    } catch (err) {
      req.log.error({ err }, 'failed to duplicate project');
      return sendError(reply, err);
    }
  });

  // Delete project
  app.delete<{ Params: { id: string } }>('/projects/:id', async (req, reply) => {
    const { id } = req.params;
    try {
      await prisma.project.delete({ where: { id } });
      return { deleted: true };
    } catch (err) {
      req.log.error({ err }, 'failed to delete project');
      return sendError(reply, err);
    }
  });

  // --- Comments routes ---
  app.get<{ Params: { id: string } }>('/projects/:id/comments', async (req, reply) => {
    const { id } = req.params;
    try {
      const comments = await prisma.comment.findMany({ where: { projectId: id } });
      return { comments: comments.map((c) => ({ ...c, replies: JSON.parse(c.replies) })) };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post<{ Params: { id: string } }>('/projects/:id/comments', async (req, reply) => {
    const { id } = req.params;
    const parsed = CreateCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid comment payload',
          details: parsed.error.flatten(),
        },
      });
    }
    const body = parsed.data;
    try {
      const comment = await prisma.comment.create({
        data: {
          projectId: id,
          x: body.x,
          y: body.y,
          shapeId: body.shapeId ?? null,
          author: body.author ?? 'Anonymous',
          text: body.text ?? '',
          status: body.status ?? 'open',
          replies: JSON.stringify(body.replies ?? []),
        },
      });
      return reply
        .status(201)
        .send({ comment: { ...comment, replies: JSON.parse(comment.replies) } });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.put<{ Params: { id: string; commentId: string } }>(
    '/projects/:id/comments/:commentId',
    async (req, reply) => {
      const { commentId } = req.params;
      const parsed = UpdateCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: 'validation_error',
            message: 'Invalid comment update payload',
            details: parsed.error.flatten(),
          },
        });
      }
      const body = parsed.data;
      try {
        const data: { status?: string; text?: string; replies?: string } = {};
        if (body.status !== undefined) data.status = body.status;
        if (body.text !== undefined) data.text = body.text;
        if (body.replies !== undefined) data.replies = JSON.stringify(body.replies);

        const comment = await prisma.comment.update({
          where: { id: commentId },
          data,
        });
        return { comment: { ...comment, replies: JSON.parse(comment.replies) } };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  app.delete<{ Params: { id: string; commentId: string } }>(
    '/projects/:id/comments/:commentId',
    async (req, reply) => {
      const { commentId } = req.params;
      try {
        await prisma.comment.delete({ where: { id: commentId } });
        return { deleted: true };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // --- Version Snapshots routes ---
  app.get<{ Params: { id: string } }>('/projects/:id/snapshots', async (req, reply) => {
    const { id } = req.params;
    try {
      const snapshots = await prisma.versionSnapshot.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
      });
      return {
        snapshots: snapshots.map((s) => ({
          ...s,
          diagram: JSON.parse(s.diagram),
          createdAt: new Date(s.createdAt).getTime(),
        })),
      };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post<{ Params: { id: string } }>('/projects/:id/snapshots', async (req, reply) => {
    const { id } = req.params;
    const parsed = CreateSnapshotSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid snapshot payload',
          details: parsed.error.flatten(),
        },
      });
    }
    const body = parsed.data;
    try {
      const snapshot = await prisma.versionSnapshot.create({
        data: {
          projectId: id,
          label: body.label ?? 'Snapshot',
          diagram: JSON.stringify(body.diagram),
        },
      });
      return reply.status(201).send({
        snapshot: {
          ...snapshot,
          diagram: JSON.parse(snapshot.diagram),
          createdAt: new Date(snapshot.createdAt).getTime(),
        },
      });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.delete<{ Params: { id: string; snapshotId: string } }>(
    '/projects/:id/snapshots/:snapshotId',
    async (req, reply) => {
      const { snapshotId } = req.params;
      try {
        await prisma.versionSnapshot.delete({ where: { id: snapshotId } });
        return { deleted: true };
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  // --- Work Branches routes ---
  app.get<{ Params: { id: string } }>('/projects/:id/branches', async (req, reply) => {
    const { id } = req.params;
    try {
      const branches = await prisma.branch.findMany({ where: { projectId: id } });
      return {
        branches: branches.map((b) => ({
          ...b,
          diagram: JSON.parse(b.diagram),
          createdAt: new Date(b.createdAt).getTime(),
        })),
      };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post<{ Params: { id: string } }>('/projects/:id/branches', async (req, reply) => {
    const { id } = req.params;
    const parsed = UpsertBranchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid branch payload',
          details: parsed.error.flatten(),
        },
      });
    }
    const body = parsed.data;
    try {
      const branch = await prisma.branch.upsert({
        where: { projectId_name: { projectId: id, name: body.name } },
        update: { diagram: JSON.stringify(body.diagram) },
        create: {
          projectId: id,
          name: body.name,
          diagram: JSON.stringify(body.diagram),
        },
      });
      return reply.status(201).send({
        branch: {
          ...branch,
          diagram: JSON.parse(branch.diagram),
          createdAt: new Date(branch.createdAt).getTime(),
        },
      });
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // --- Workflow routes ---
  app.get<{ Params: { id: string } }>('/projects/:id/workflow', async (req, reply) => {
    const { id } = req.params;
    try {
      const workflow = await prisma.workflow.findUnique({ where: { projectId: id } });
      if (!workflow) return { workflow: { status: 'draft', signatures: [] } };
      return { workflow: { ...workflow, signatures: JSON.parse(workflow.signatures) } };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post<{ Params: { id: string } }>('/projects/:id/workflow', async (req, reply) => {
    const { id } = req.params;
    const parsed = UpsertWorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid workflow payload',
          details: parsed.error.flatten(),
        },
      });
    }
    const body = parsed.data;
    try {
      const signatures = body.signatures ?? [];
      const workflow = await prisma.workflow.upsert({
        where: { projectId: id },
        update: { status: body.status, signatures: JSON.stringify(signatures) },
        create: {
          projectId: id,
          status: body.status,
          signatures: JSON.stringify(signatures),
        },
      });
      return { workflow: { ...workflow, signatures: JSON.parse(workflow.signatures) } };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  // --- Audit Logs routes ---
  app.get<{ Params: { id: string } }>('/projects/:id/audit-logs', async (req, reply) => {
    const { id } = req.params;
    try {
      const logs = await prisma.auditLog.findMany({
        where: { projectId: id },
        orderBy: { timestamp: 'desc' },
      });
      return { auditLogs: logs.map((l) => ({ ...l, timestamp: new Date(l.timestamp).getTime() })) };
    } catch (err) {
      return sendError(reply, err);
    }
  });

  app.post<{ Params: { id: string } }>('/projects/:id/audit-logs', async (req, reply) => {
    const { id } = req.params;
    const parsed = CreateAuditLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'validation_error',
          message: 'Invalid audit log payload',
          details: parsed.error.flatten(),
        },
      });
    }
    const body = parsed.data;
    try {
      const log = await prisma.auditLog.create({
        data: {
          projectId: id,
          user: body.user ?? 'Anonymous',
          action: body.action,
          details: body.details ?? '',
        },
      });
      return reply
        .status(201)
        .send({ auditLog: { ...log, timestamp: new Date(log.timestamp).getTime() } });
    } catch (err) {
      return sendError(reply, err);
    }
  });
}
