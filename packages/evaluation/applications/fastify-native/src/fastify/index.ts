import Fastify, { type FastifyServerOptions } from 'fastify';

import type { Clock } from '../application/contracts/clock';
import type { IdGenerator } from '../application/contracts/id-generator';
import { composeApplication } from '../composition';

import { handleApplicationError } from './application-error.handler';
import { registerRoutes } from './routes';

export function buildApplication(
  options: FastifyServerOptions = {},
  dependencies: { clock?: Clock; idGenerator?: IdGenerator } = {},
) {
  const fastify = Fastify(options);

  fastify.addHook('onRequest', async (_request, reply) => {
    reply.header('X-Request-Source', 'evaluation');
  });

  fastify.setErrorHandler(handleApplicationError);
  registerRoutes(fastify, composeApplication(dependencies));

  return fastify;
}

export async function startApplication(options: {
  host: string;
  port: number;
  logger: boolean;
  clock?: Clock;
  idGenerator?: IdGenerator;
}): Promise<{ baseUrl: string; close(): Promise<void> }> {
  const app = buildApplication(
    { logger: options.logger },
    {
      ...(options.clock ? { clock: options.clock } : {}),
      ...(options.idGenerator ? { idGenerator: options.idGenerator } : {}),
    },
  );
  try {
    const baseUrl = await app.listen({
      host: options.host,
      port: options.port,
    });
    return { baseUrl, close: () => app.close() };
  } catch (error) {
    await app.close();
    throw error;
  }
}
