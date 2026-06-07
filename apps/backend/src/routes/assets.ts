import type { FastifyInstance } from 'fastify';
import { sanitizeSvg } from '../lib/sanitize.js';
import { config } from '../config.js';

const ALLOWED_MIME = new Set(['image/svg+xml']);

export async function assetRoutes(app: FastifyInstance): Promise<void> {
  app.post('/assets/svg', async (req, reply) => {
    const body = (req.body ?? {}) as { svg?: string; filename?: string; projectId?: string };
    const { svg, filename = 'asset.svg', projectId } = body;

    if (typeof svg !== 'string' || svg.length === 0) {
      return reply.status(400).send({
        error: { code: 'validation_error', message: 'svg is required' },
      });
    }
    if (svg.length > config.MAX_UPLOAD_MB * 1024 * 1024) {
      return reply.status(413).send({
        error: { code: 'payload_too_large', message: 'SVG payload too large' },
      });
    }

    let cleaned = '';
    try {
      cleaned = sanitizeSvg(svg);
    } catch (err) {
      return reply.status(422).send({
        error: { code: 'invalid_svg', message: (err as Error).message },
      });
    }
    if (!cleaned.includes('<svg')) {
      return reply.status(422).send({
        error: { code: 'invalid_svg', message: 'No <svg> element after sanitization' },
      });
    }

    const { prisma } = await import('../lib/prisma.js');
    const asset = await prisma.asset.create({
      data: {
        filename: filename.replace(/[^\w.\-]+/g, '_').slice(0, 120),
        mime: 'image/svg+xml',
        size: cleaned.length,
        data: cleaned,
        projectId: projectId ?? null,
      },
    });
    return reply.status(201).send({
      asset: {
        id: asset.id,
        filename: asset.filename,
        mime: asset.mime,
        size: asset.size,
        createdAt: asset.createdAt,
        svg: cleaned,
      },
    });
  });

  app.get<{ Params: { id: string } }>('/assets/:id', async (req, reply) => {
    const { prisma } = await import('../lib/prisma.js');
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      return reply.status(404).send({
        error: { code: 'not_found', message: 'Asset not found' },
      });
    }
    if (!ALLOWED_MIME.has(asset.mime)) {
      return reply.status(415).send({
        error: { code: 'unsupported_media_type', message: 'Asset mime not supported' },
      });
    }
    reply.header('Content-Type', asset.mime);
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    return reply.send(asset.data);
  });
}
