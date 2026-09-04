import { createParamDecorator } from '../utils/create-param-decorator.util';

/**
 * Injects the native framework response/reply for manual responses.
 *
 * @example
 * handle(@Response() reply: FastifyReply) {
 *   reply.status(201).send({ created: true });
 * }
 */
export function Response(): ParameterDecorator {
  return createParamDecorator<undefined, unknown>({
    source: 'response',
  })();
}
