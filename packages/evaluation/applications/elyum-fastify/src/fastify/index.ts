import 'reflect-metadata';

import Elyum from '@elyum/fastify';
import Fastify, { type FastifyServerOptions } from 'fastify';

import type { Clock } from '../application/contracts/clock';
import type { IdGenerator } from '../application/contracts/id-generator';
import { createContainer } from '../di/container';

import { handleApplicationError } from './errors/application-error.handler';
import { routes } from './routes';

export function buildApplication(
  options: FastifyServerOptions = {},
  dependencies: { clock?: Clock; idGenerator?: IdGenerator } = {},
) {
  const fastify = Fastify(options);

  fastify.addHook('onRequest', async (_request, reply) => {
    reply.header('X-Request-Source', 'evaluation');
  });

  fastify.register(Elyum(), {
    container: createContainer(dependencies),
    autoRegisterDependencies: true,
    onError: handleApplicationError,
  });

  fastify.register(routes);

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

export const bootstrap = async () => {
  const fastify = buildApplication({ logger: true });

  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info('Server is running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
