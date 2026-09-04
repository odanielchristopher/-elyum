import { IValidator } from '@elyum/validation';

import { coerceValue, PrimitiveType } from './coerce-value.util';
import {
  createParamDecorator,
  ParamFactory,
  ParamSource,
} from './create-param-decorator.util';

/**
 * Detecta tipo esperado do parâmetro via reflection
 */
function getExpectedType(
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number,
): PrimitiveType | undefined {
  const types = Reflect.getMetadata('design:paramtypes', target, propertyKey);

  if (!types || !types[parameterIndex]) {
    return undefined;
  }

  const paramType = types[parameterIndex];
  const typeName = paramType.name?.toLowerCase();

  switch (typeName) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
    case 'array':
      return 'object';
    default:
      return undefined;
  }
}

/**
 * Cria param decorator com coerção automática de tipo
 *
 * Detecta tipo esperado do parâmetro via TypeScript reflection
 * e converte automaticamente (ex: '42' → 42 se parâmetro é number)
 *
 * Suporta 3 assinaturas:
 * 1. @Query() → extrai tudo
 * 2. @Query('key') → extrai campo com coerção automática
 * 3. @Query(validator) → extrai tudo com validação
 * 4. @Query('key', validator) → extrai campo com validação
 *
 * @example
 * // Coerção automática de tipos
 * @Get('search')
 * search(
 *   @Query('page') page: number,      // '5' → 5
 *   @Query('active') active: boolean   // 'true' → true
 * ) {}
 */
export function createTypedParamDecorator(source: ParamSource) {
  return function (
    keyOrValidator?: string | IValidator<any, any>,
    validator?: IValidator<any, any>,
  ): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
      // Determinar key e validator
      let key: string | undefined;
      let finalValidator: IValidator<any, any> | undefined;

      if (typeof keyOrValidator === 'string') {
        key = keyOrValidator;
        finalValidator = validator;
      } else if (keyOrValidator && typeof keyOrValidator === 'object') {
        finalValidator = keyOrValidator;
      }

      // Detectar tipo esperado
      const expectedType = getExpectedType(
        target,
        propertyKey!,
        parameterIndex,
      );

      // Criar factory customizado
      const factory: ParamFactory = (input: any) => {
        let value: any;

        // Extrair valor
        if (key) {
          value = input?.[key];
        } else {
          value = input;
        }

        // Aplicar coerção se necessário
        if (key && expectedType && value !== undefined) {
          value = coerceValue(value, expectedType);
        }

        return value;
      };

      // Keep validation metadata visible to compilers and adapters.
      const decorator = createParamDecorator<undefined, any>({
        factory,
        source,
      })(finalValidator);
      decorator(target, propertyKey, parameterIndex);
    };
  };
}
