import type { FastifyReply, FastifyRequest } from 'fastify';

export const EXAMPLE_AUTHORIZATION = 'Bearer example-token';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (request.headers.authorization === EXAMPLE_AUTHORIZATION) {
    return;
  }

  await reply.code(401).send({
    code: 'UNAUTHORIZED',
    message: 'Provide the example bearer token to access order routes.',
  });
}
