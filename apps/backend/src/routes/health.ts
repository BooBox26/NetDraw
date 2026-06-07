import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'netdraw-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/ready', async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ready: true, database: 'ok' };
    } catch (err) {
      reply.status(503);
      return { ready: false, database: 'unreachable', error: (err as Error).message };
    }
  });

  app.get('/metrics', async (_req, reply) => {
    try {
      const memory = process.memoryUsage();
      const uptime = process.uptime();
      const cpu = process.cpuUsage();
      const projectsCount = await prisma.project.count().catch(() => 0);
      const assetsCount = await prisma.asset.count().catch(() => 0);

      let prometheusString = '';
      prometheusString += `# HELP node_memory_rss Residual set size in bytes\n`;
      prometheusString += `# TYPE node_memory_rss gauge\n`;
      prometheusString += `node_memory_rss ${memory.rss}\n`;

      prometheusString += `# HELP node_memory_heap_total Total heap size in bytes\n`;
      prometheusString += `# TYPE node_memory_heap_total gauge\n`;
      prometheusString += `node_memory_heap_total ${memory.heapTotal}\n`;

      prometheusString += `# HELP node_memory_heap_used Used heap size in bytes\n`;
      prometheusString += `# TYPE node_memory_heap_used gauge\n`;
      prometheusString += `node_memory_heap_used ${memory.heapUsed}\n`;

      prometheusString += `# HELP node_uptime_seconds Uptime of the application in seconds\n`;
      prometheusString += `# TYPE node_uptime_seconds counter\n`;
      prometheusString += `node_uptime_seconds ${uptime}\n`;

      prometheusString += `# HELP node_cpu_user_time_seconds CPU user time in seconds\n`;
      prometheusString += `# TYPE node_cpu_user_time_seconds counter\n`;
      prometheusString += `node_cpu_user_time_seconds ${cpu.user / 1_000_000}\n`;

      prometheusString += `# HELP node_cpu_system_time_seconds CPU system time in seconds\n`;
      prometheusString += `# TYPE node_cpu_system_time_seconds counter\n`;
      prometheusString += `node_cpu_system_time_seconds ${cpu.system / 1_000_000}\n`;

      prometheusString += `# HELP netdraw_projects_total Total projects created in database\n`;
      prometheusString += `# TYPE netdraw_projects_total gauge\n`;
      prometheusString += `netdraw_projects_total ${projectsCount}\n`;

      prometheusString += `# HELP netdraw_assets_total Total SVG assets uploaded in database\n`;
      prometheusString += `# TYPE netdraw_assets_total gauge\n`;
      prometheusString += `netdraw_assets_total ${assetsCount}\n`;

      reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      return reply.send(prometheusString);
    } catch (err) {
      reply.status(500);
      return { error: 'failed to collect metrics', details: (err as Error).message };
    }
  });
}
