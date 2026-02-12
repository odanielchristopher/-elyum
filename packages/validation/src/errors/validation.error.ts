import { ValidationErrorItem } from '../types/validation-error-item.type';

/**
 * Erro lançado quando validação falha
 *
 * Contém lista de erros por campo para facilitar tratamento
 *
 * @example
 * try {
 *   validator.parse(data);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log(error.errors); // Array de erros
 *     console.log(error.getFieldErrors('email')); // Erros do campo email
 *   }
 * }
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationErrorItem[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  /**
   * Retorna erros de um campo específico
   */
  getFieldErrors(field: string): ValidationErrorItem[] {
    return this.errors.filter((error) => error.field === field);
  }

  /**
   * Verifica se campo específico tem erro
   */
  hasFieldError(field: string): boolean {
    return this.errors.some((error) => error.field === field);
  }

  /**
   * Retorna mapa de erros por campo
   * Útil para formulários
   *
   * @example
   * { email: ['Email is required'], password: ['Too short'] }
   */
  getErrorMap(): Record<string, string[]> {
    const map: Record<string, string[]> = {};

    for (const error of this.errors) {
      if (!map[error.field]) {
        map[error.field] = [];
      }

      map[error.field]?.push(error.message);
    }

    return map;
  }

  /**
   * Serializa para JSON (útil para responses HTTP)
   */
  toJSON(): {
    name: string;
    message: string;
    errors: ValidationErrorItem[];
  } {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors,
    };
  }

  /**
   * Cria ValidationError a partir de erro único
   */
  static fromSingleError(field: string, message: string): ValidationError {
    return new ValidationError('Validation failed', [{ field, message }]);
  }

  /**
   * Cria ValidationError a partir de múltiplos erros
   */
  static fromErrors(errors: ValidationErrorItem[]): ValidationError {
    const message =
      errors.length === 1
        ? `Validation failed: ${errors[0]?.message}`
        : `Validation failed with ${errors.length} errors`;

    return new ValidationError(message, errors);
  }
}
