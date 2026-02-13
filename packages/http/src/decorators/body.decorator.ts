import { IValidator } from '@elyum/validation';

import { createTypedParamDecorator } from '../utils/create-typed-decorator.util';

/**
 * @Body decorator - Extrai e valida request body
 *
 * @example
 * // Extrai body completo
 * create(@Body() body: any) {}
 *
 * @example
 * // Extrai campo específico do body
 * create(@Body('name') name: string) {}
 *
 * @example
 * // Extrai body completo com validação
 * create(@Body(zodValidator(schema)) dto: CreateUserDto) {}
 *
 * @example
 * // Extrai campo específico com validação
 * create(@Body('age', zodValidator(z.number())) age: number) {}
 */
export function Body(): ParameterDecorator;
export function Body(key: string): ParameterDecorator;
export function Body<T>(validator: IValidator<any, T>): ParameterDecorator;
export function Body<T>(
  key: string,
  validator: IValidator<any, T>,
): ParameterDecorator;
export function Body<T>(
  keyOrValidator?: string | IValidator<any, T>,
  validator?: IValidator<any, T>,
): ParameterDecorator {
  return createTypedParamDecorator('body')(keyOrValidator, validator);
}
