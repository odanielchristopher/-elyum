/**
 * Interface genérica para validadores
 *
 * Qualquer biblioteca de validação pode implementar esta interface
 * para se tornar compatível com Elyum
 *
 * @template TInput - Tipo dos dados de entrada (geralmente unknown)
 * @template TOutput - Tipo dos dados validados (com inferência de tipo)
 *
 * @example
 * // Implementação Zod
 * class ZodValidator<T> implements IValidator<unknown, T> {
 *   constructor(private schema: z.ZodType<T>) {}
 *
 *   parse(data: unknown): T {
 *     return this.schema.parse(data);
 *   }
 * }
 *
 * @example
 * // Implementação custom
 * class EmailValidator implements IValidator<string, string> {
 *   parse(data: string): string {
 *     if (!data.includes('@')) {
 *       throw ValidationError.fromSingleError('email', 'Invalid email');
 *     }
 *     return data.toLowerCase();
 *   }
 * }
 */
export interface IValidator<TInput = unknown, TOutput = TInput> {
  /**
   * Valida e transforma dados
   *
   * @param data - Dados a serem validados
   * @returns Dados validados e transformados
   * @throws {ValidationError} Se validação falhar
   *
   * @remarks
   * - DEVE lançar ValidationError se validação falhar
   * - PODE transformar dados (ex: trim strings, coerce types)
   * - PODE ser assíncrono (retornar Promise<TOutput>)
   */
  parse(data: TInput): TOutput | Promise<TOutput>;
}

/**
 * Type helper para extrair tipo de saída de um validator
 *
 * @example
 * const validator = zodValidator(z.object({ name: z.string() }));
 * type OutputType = InferValidatorOutput<typeof validator>; // { name: string }
 */
export type InferValidatorOutput<V extends IValidator<any, any>> =
  V extends IValidator<any, infer TOutput> ? TOutput : never;
