import { config } from '../config.js';

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ level: 'info', msg, ...meta, t: new Date().toISOString() })),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify({ level: 'warn', msg, ...meta, t: new Date().toISOString() })),
  error: (msg: string, meta?: Record<string, unknown>) =>
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: 'error', msg, ...meta, t: new Date().toISOString() })),
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (config.LOG_LEVEL === 'debug' || config.LOG_LEVEL === 'trace') {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ level: 'debug', msg, ...meta, t: new Date().toISOString() }));
    }
  },
};
