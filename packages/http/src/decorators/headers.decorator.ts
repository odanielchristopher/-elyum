import { IValidator } from '@elyum/validation';

import { createTypedParamDecorator } from '../utils/create-typed-decorator.util';

/**
 * @Headers decorator - Extrai request headers
 *
 * @example
 * // Extrai todos headers
 * handle(@Headers() headers: any) {}
 *
 * @example
 * // Extrai header específico
 * handle(@Headers('authorization') token: string) {}
 *
 * @example
 * // Extrai e valida header
 * handle(@Headers('content-type', validator) contentType: string) {}
 */
export function Headers(): ParameterDecorator;
export function Headers(key: string): ParameterDecorator;
export function Headers<T>(validator: IValidator<any, T>): ParameterDecorator;
export function Headers<T>(
  key: string,
  validator: IValidator<any, T>,
): ParameterDecorator;
export function Headers<T>(
  keyOrValidator?: string | IValidator<any, T>,
  validator?: IValidator<any, T>,
): ParameterDecorator {
  return createTypedParamDecorator('headers')(keyOrValidator, validator);
}
