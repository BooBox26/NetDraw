import { buildApp } from './app.js';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { disconnectPrisma } from './lib/prisma.js';

async function main(): Promise<void> {
  const app = await buildApp();

  try {
    const address = await app.listen({ host: config.HOST, port: config.PORT });
    logger.info(`NETDRAW backend listening on ${address}`);
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down...`);
    try {
      await app.close();
      await disconnectPrisma();
    } catch (err) {
      logger.error('Error during shutdown', { error: (err as Error).message });
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
