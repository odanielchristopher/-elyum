import Elyum from '@elyum/fastify';
import Fastify, { type FastifyServerOptions } from 'fastify';

import { createContainer } from '../di/container';

import { handleApplicationError } from './errors/application-error.handler';
import { routes } from './routes';

export function buildApplication(options: FastifyServerOptions = {}) {
  const fastify = Fastify(options);

  fastify.register(Elyum(), {
    container: createContainer(),
    autoRegisterDependencies: true,
    onError: handleApplicationError,
  });

  fastify.register(routes);

  return fastify;
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
