import {
  IValidator,
  ValidationError,
  ValidationErrorItem,
} from '@elyum/validation';
import * as yup from 'yup';

/**
 * Adapter Yup → IValidator
 *
 * @example
 * const schema = yup.object({
 *   name: yup.string().required().min(3),
 *   email: yup.string().email().required(),
 * });
 *
 * const validator = yupValidator(schema);
 * const data = await validator.parse({ name: 'John', email: 'john@example.com' });
 */
export class YupValidator<TOutput> implements IValidator<unknown, TOutput> {
  constructor(private readonly schema: yup.Schema<TOutput>) {}

  /**
   * Validação assíncrona (Yup é sempre async)
   */
  async parse(data: unknown): Promise<TOutput> {
    try {
      // Yup validate() é sempre async
      return await this.schema.validate(data, {
        abortEarly: false, // Coletar todos os erros
        stripUnknown: false, // Não remover campos desconhecidos (deixar para schema decidir)
      });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        throw this.convertYupError(error);
      }
      throw error;
    }
  }

  /**
   * Converte ValidationError do Yup para ValidationError do Elyum
   */
  private convertYupError(yupError: yup.ValidationError): ValidationError {
    const errors: ValidationErrorItem[] = [];

    // Yup pode ter erros em inner ou direto
    if (yupError.inner && yupError.inner.length > 0) {
      // Múltiplos erros
      for (const innerError of yupError.inner) {
        errors.push({
          field: innerError.path || 'root',
          message: this.safeMessage(innerError),
          code: innerError.type,
        });
      }
    } else {
      // Erro único
      errors.push({
        field: yupError.path || 'root',
        message: this.safeMessage(yupError),
        code: yupError.type,
      });
    }

    return ValidationError.fromErrors(errors);
  }

  /** Yup type errors may interpolate the original input into their message. */
  private safeMessage(error: yup.ValidationError): string {
    let message = error.message;
    const visited = new WeakSet<object>();
    const redact = (value: unknown): void => {
      if (typeof value === 'string' && value.length > 0) {
        message = message.split(value).join('[redacted]');
        const escaped = JSON.stringify(value).slice(1, -1);
        if (escaped !== value)
          message = message.split(escaped).join('[redacted]');
      } else if (value && typeof value === 'object' && !visited.has(value)) {
        visited.add(value);
        for (const child of Object.values(value)) redact(child);
      }
    };
    redact(error.value);
    redact(error.params?.originalValue);
    return message;
  }

  /**
   * Safe parse que retorna resultado
   */
  async safeParse(
    data: unknown,
  ): Promise<
    | { success: true; data: TOutput }
    | { success: false; error: ValidationError }
  > {
    try {
      const validated = await this.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { success: false, error };
      }
      throw error;
    }
  }

  /**
   * Validação síncrona (throws se schema tiver validações async)
   */
  parseSync(data: unknown): TOutput {
    try {
      return this.schema.validateSync(data, {
        abortEarly: false,
      });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        throw this.convertYupError(error);
      }
      throw error;
    }
  }
}

/**
 * Helper function para criar YupValidator
 *
 * @example
 * const validator = yupValidator(yup.object({ name: yup.string() }));
 *
 * @Post()
 * async create(@Body(yupValidator(schema)) dto: CreateUserDto) {
 *   // ...
 * }
 */
export function yupValidator<T>(schema: yup.Schema<T>): YupValidator<T> {
  return new YupValidator(schema);
}
