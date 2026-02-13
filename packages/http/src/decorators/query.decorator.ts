import { IValidator } from '@elyum/validation';

import { createTypedParamDecorator } from '../utils/create-typed-decorator.util';

/**
 * @Query decorator - Extrai query parameters
 *
 * @example
 * // Extrai todos query params
 * search(@Query() query: any) {}
 *
 * @example
 * // Extrai query param específico
 * search(@Query('page') page: string) {}
 *
 * @example
 * // Extrai e valida query param
 * search(@Query('page', zodValidator(z.coerce.number())) page: number) {}
 *
 * @example
 * // Extrai e valida todos query params
 * search(@Query(zodValidator(querySchema)) query: QueryDto) {}
 */
export function Query(): ParameterDecorator;
export function Query(key: string): ParameterDecorator;
export function Query<T>(validator: IValidator<any, T>): ParameterDecorator;
export function Query<T>(
  key: string,
  validator: IValidator<any, T>,
): ParameterDecorator;
export function Query<T>(
  keyOrValidator?: string | IValidator<any, T>,
  validator?: IValidator<any, T>,
): ParameterDecorator {
  return createTypedParamDecorator('query')(keyOrValidator, validator);
}
