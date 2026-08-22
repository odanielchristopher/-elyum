import { createParamDecorator } from '../utils/create-param-decorator.util';

/**
 * Injects the native framework request.
 *
 * @example
 * handle(@Request() request: FastifyRequest) {
 *   console.log(request.id);
 * }
 */
export function Request(): ParameterDecorator {
  return createParamDecorator<undefined, unknown>({
    source: 'request',
    factory(request) {
      return request;
    },
  })();
}
