import { HttpResponse } from '../contracts';
import { createParamDecorator } from '../utils/create-param-decorator.util';

/**
 * @Response decorator - Injeta response completo
 *
 * Útil para controle manual da resposta
 *
 * @example
 * handle(@Response() res: HttpResponse) {
 *   res.status(201).json({ created: true });
 * }
 */
export function Response(): ParameterDecorator {
  return createParamDecorator<undefined, HttpResponse>({
    factory(_, context) {
      return context.getResponse();
    },
  })();
}
