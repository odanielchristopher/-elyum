import { IValidator } from '@elyum/validation';

import { ROUTE_PARAMS_METADATA_KEY } from '../constants/metadata-keys.constants';
import { HttpExecutionContext } from '../context';
import { ParamMetadata } from '../types';

/**
 * Factory function para extrair valor de um parâmetro
 *
 * Recebe dados da request e retorna valor processado
 *
 * @template TInput - Tipo dos dados brutos (ex: body completo, query params)
 * @template TOutput - Tipo do valor retornado (após processamento/validação)
 *
 * @param input - Dados brutos extraídos da request
 * @param context - Execution context (para acessar request, response, etc)
 *
 * @example
 * // Factory que extrai user-agent header em uppercase
 * const userAgentFactory: ParamFactory<Record<string, string>, string> = (headers) => {
 *   return headers['user-agent']?.toUpperCase() || 'UNKNOWN';
 * };
 */
export type ParamFactory<TInput = any, TOutput = any> = (
  input: TInput,
  context: typeof HttpExecutionContext,
  index: number,
) => TOutput | Promise<TOutput>;

/**
 * Tipo de fonte de dados da request
 *
 * Indica de onde extrair os dados brutos
 */
export type ParamSource =
  | 'body'
  | 'query'
  | 'param'
  | 'headers'
  | 'request'
  | 'response'
  | 'custom';

/**
 * Configuração do param decorator
 */
export interface ParamDecoratorConfig<TInput = any, TOutput = any> {
  /** Factory para processar valor */
  factory?: ParamFactory<TInput, TOutput>;

  /** Fonte dos dados (body, query, etc) */
  source: ParamSource;

  /** Chave específica (opcional) */
  key?: string;

  /** Validator (opcional) */
  validator?: IValidator<any, any>;
}

/**
 * Cria param decorator customizável
 *
 * Permite criar decorators que:
 * - Extraem dados de fontes específicas
 * - Aplicam transformações customizadas
 * - Validam dados
 * - Combinam múltiplas fontes
 *
 * @example
 * // Decorator simples que extrai IP
 * const Ip = createParamDecorator({
 *  factory: (request) => request.ip,
 *  source: 'request'
 * });
 *
 * @example
 * // Decorator que extrai e valida user-agent
 * const UserAgent = createParamDecorator({
 *  factory: (headers) => headers['user-agent'],
 *  source: 'headers'
 * });
 *
 * @example
 * // Decorator customizado com lógica complexa
 * const CurrentUser = createParamDecorator({
 *  factory: (request) => {
 *    const userId = HttpExecutionContext.get('userId');
 *    userService.findById(userId);
 *  },
 * });
 */
export function createParamDecorator<
  TKey = undefined,
  TOutput = any,
  TInput = unknown,
>({
  factory,
  source = 'custom',
}: {
  factory?: ParamFactory<TInput, TOutput>;
  source?: ParamSource;
}): TKey extends undefined
  ? (validator?: IValidator<any, any>) => ParameterDecorator
  : (key: TKey, validator?: IValidator<any, any>) => ParameterDecorator {
  return ((
    key?: TKey,
    validator?: IValidator<any, any>,
  ): ParameterDecorator => {
    const validatorWithoutKey =
      validator === undefined && isValidator(key) ? key : undefined;
    const finalKey = validatorWithoutKey ? undefined : key;
    const finalValidator = validatorWithoutKey ?? validator;

    return (target, propertyKey, parameterIndex) => {
      const paramMetadata: ParamMetadata<TKey> = {
        index: parameterIndex,
        type: source,
        key: finalKey,
        validator: finalValidator,
        ...(factory ? { factory } : {}),
      };

      const existingParams =
        Reflect.getMetadata(ROUTE_PARAMS_METADATA_KEY, target, propertyKey!) ??
        [];

      existingParams.push(paramMetadata);

      Reflect.defineMetadata(
        ROUTE_PARAMS_METADATA_KEY,
        existingParams,
        target,
        propertyKey!,
      );
    };
  }) as any;
}

function isValidator(value: unknown): value is IValidator<any, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'parse' in value &&
    typeof value.parse === 'function'
  );
}
