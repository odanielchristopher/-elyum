import {
  IValidator,
  ValidationError,
  ValidationErrorItem,
} from '@elyum/validation';
import { z } from 'zod';

/**
 * Adapter Zod → IValidator
 *
 * Converte schemas Zod para o formato esperado pelo Elyum
 *
 * @example
 * const schema = z.object({
 *   name: z.string().min(3),
 *   email: z.string().email(),
 * });
 *
 * const validator = new ZodValidator(schema);
 * const data = validator.parse({ name: 'John', email: 'john@example.com' });
 */
export class ZodValidator<TOutput> implements IValidator<unknown, TOutput> {
  constructor(private readonly schema: z.ZodType<TOutput>) {}

  parse(data: unknown): TOutput {
    try {
      return this.schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw this.convertZodError(error, data);
      }
      // Re-throw se não for ZodError
      throw error;
    }
  }

  /**
   * Converte ZodError para ValidationError do Elyum
   */
  private convertZodError(
    zodError: z.ZodError,
    input: unknown,
  ): ValidationError {
    const errors: ValidationErrorItem[] = zodError.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code,
      received: this.getReceivedType(issue, input),
      expected: this.getExpectedValue(issue),
    }));

    return ValidationError.fromErrors(errors);
  }

  /**
   * Extrai valor esperado do issue do Zod
   */
  private getExpectedValue(issue: z.ZodIssue): unknown {
    if ('expected' in issue) {
      return issue.expected;
    }

    if ('format' in issue) {
      return issue.format;
    }

    return undefined;
  }

  /**
   * Preserves the useful received-type detail removed from Zod 4 issues without
   * storing the potentially sensitive input value in the normalized error.
   */
  private getReceivedType(
    issue: z.ZodIssue,
    input: unknown,
  ): string | undefined {
    if (issue.code !== 'invalid_type') {
      return undefined;
    }

    const received = issue.path.reduce<unknown>((value, segment) => {
      if (value === null || typeof value !== 'object') {
        return undefined;
      }

      return (value as Record<PropertyKey, unknown>)[segment];
    }, input);

    if (received === null) {
      return 'null';
    }

    if (Array.isArray(received)) {
      return 'array';
    }

    if (typeof received === 'number' && Number.isNaN(received)) {
      return 'nan';
    }

    return typeof received;
  }

  /**
   * Validação assíncrona (útil para schemas com refinements async)
   */
  async parseAsync(data: unknown): Promise<TOutput> {
    try {
      return await this.schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw this.convertZodError(error, data);
      }
      throw error;
    }
  }

  /**
   * Safe parse que retorna resultado ao invés de lançar erro
   */
  safeParse(
    data: unknown,
  ):
    | { success: true; data: TOutput }
    | { success: false; error: ValidationError } {
    const result = this.schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: this.convertZodError(result.error, data),
      };
    }
  }
}

/**
 * Helper function para criar ZodValidator
 *
 * @example
 * const validator = zodValidator(z.object({ name: z.string() }));
 *
 * @Post()
 * create(@Body(zodValidator(schema)) dto: CreateUserDto) {
 *   // ...
 * }
 */
export function zodValidator<T>(schema: z.ZodType<T>): ZodValidator<T> {
  return new ZodValidator(schema);
}
