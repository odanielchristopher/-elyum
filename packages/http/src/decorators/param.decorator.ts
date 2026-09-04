import { IValidator } from '@elyum/validation';

import { createTypedParamDecorator } from '../utils/create-typed-decorator.util';

/**
 * @Param decorator - Extrai route parameters
 *
 * @example
 * // Extrai todos os parâmetros
 * findOne(@Param() params: Record<string, string>) {}
 *
 * @example
 * // Extrai e valida todos os parâmetros
 * findOne(@Param(zodValidator(paramsSchema)) params: ParamsDto) {}
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
export function Param(): ParameterDecorator;
export function Param<T>(validator: IValidator<any, T>): ParameterDecorator;
export function Param(key: string): ParameterDecorator;
export function Param<T>(
  key: string,
  validator: IValidator<any, T>,
): ParameterDecorator;
export function Param<T>(
  keyOrValidator?: string | IValidator<any, T>,
  validator?: IValidator<any, T>,
): ParameterDecorator {
  if (typeof keyOrValidator === 'string' && keyOrValidator.length === 0) {
    throw new Error(
      '@Param received an empty key. Remove the key to inject all route parameters, or provide a non-empty parameter name.',
    );
  }

  return createTypedParamDecorator('param')(keyOrValidator, validator);
}
