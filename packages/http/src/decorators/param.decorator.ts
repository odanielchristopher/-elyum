import { IValidator } from '@elyum/validation';

import { createTypedParamDecorator } from '../utils/create-typed-decorator.util';

/**
 * @Param decorator - Extrai route parameters
 *
 * @example
 * // Extrai param específico
 * findOne(@Param('id') id: string) {}
 *
 * @example
 * // Extrai e valida param
 * findOne(@Param('id', zodValidator(z.string().uuid())) id: string) {}
 *
 * @example
 * // Múltiplos params
 * getPost(
 *   @Param('userId') userId: string,
 *   @Param('postId') postId: string
 * ) {}
 */
export function Param(key: string): ParameterDecorator;
export function Param<T>(
  key: string,
  validator: IValidator<any, T>,
): ParameterDecorator;
export function Param<T>(
  key: string,
  validator?: IValidator<any, T>,
): ParameterDecorator {
  if (!key) {
    throw new Error('@Param requires a key parameter');
  }
  return createTypedParamDecorator('param')(key, validator);
}
