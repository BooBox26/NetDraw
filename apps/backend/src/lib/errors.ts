import type { FastifyReply } from 'fastify';

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'HttpError';
  }
}

export const httpErrors = {
  badRequest: (message = 'Bad request', code = 'bad_request') => new HttpError(400, code, message),
  unauthorized: (message = 'Unauthorized', code = 'unauthorized') =>
    new HttpError(401, code, message),
  forbidden: (message = 'Forbidden', code = 'forbidden') => new HttpError(403, code, message),
  notFound: (message = 'Not found', code = 'not_found') => new HttpError(404, code, message),
  conflict: (message = 'Conflict', code = 'conflict') => new HttpError(409, code, message),
  payloadTooLarge: (message = 'Payload too large', code = 'payload_too_large') =>
    new HttpError(413, code, message),
  unprocessable: (message = 'Unprocessable entity', code = 'unprocessable_entity') =>
    new HttpError(422, code, message),
  rateLimited: (message = 'Too many requests', code = 'rate_limited') =>
    new HttpError(429, code, message),
  internal: (message = 'Internal server error', code = 'internal_error') =>
    new HttpError(500, code, message),
};

export function sendError(reply: FastifyReply, err: unknown): FastifyReply {
  if (err instanceof HttpError) {
    return reply.status(err.statusCode).send({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }
  return reply.status(500).send({
    error: {
      code: 'internal_error',
      message: 'Internal server error',
    },
  });
}
