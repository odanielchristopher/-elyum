import { IValidator } from '@elyum/validation';

/**
 * Tipo de parâmetro
 */
export type ParamType =
  | 'body' // @Body() - request body completo
  | 'query' // @Query() - query parameters
  | 'param' // @Param() - route parameters
  | 'headers' // @Headers() - request headers
  | 'request' // @Request() - request completo
  | 'response'; // @Response() - response completo

/**
 * Metadata de um parâmetro
 *
 * Descreve como extrair e validar um parâmetro
 */
export interface ParamMetadata {
  /** Índice do parâmetro no método (0, 1, 2, ...) */
  index: number;

  /** Tipo do parâmetro */
  type: ParamType;

  /**
   * Chave específica (opcional)
   * @example @Query('page') → key = 'page'
   * @example @Param('id') → key = 'id'
   */
  key?: string;

  /**
   * Validator para validação (opcional)
   * @example @Body(zodValidator(schema))
   */
  validator?: IValidator<any, any>;

  /**
   * Se parâmetro é opcional
   */
  optional?: boolean;
}
