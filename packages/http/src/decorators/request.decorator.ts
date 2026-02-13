import { HttpRequest } from '../contracts';
import { createParamDecorator } from '../utils/create-param-decorator.util';

/**
 * @Request decorator - Injeta request completo
 *
 * @example
 * handle(@Request() req: HttpRequest) {
 *   console.log(req.method, req.url);
 * }
 */
export function Request(): ParameterDecorator {
  return createParamDecorator<undefined, HttpRequest>({
    factory(_, context) {
      return context.getRequest();
    },
  })();
}
