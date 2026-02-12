import { IValidator, ValidationError } from '@elyum/validation';
import { describe, expect, it } from 'vitest';

describe('IValidator Interface - Custom Implementation', () => {
  it('should allow custom validator implementation', () => {
    // Arrange - Custom email validator
    class EmailValidator implements IValidator<string, string> {
      parse(data: string): string {
        if (typeof data !== 'string') {
          throw ValidationError.fromSingleError('email', 'Must be a string');
        }

        if (!data.includes('@')) {
          throw ValidationError.fromSingleError(
            'email',
            'Invalid email format',
          );
        }

        return data.toLowerCase().trim();
      }
    }

    const validator = new EmailValidator();

    // Act
    const result = validator.parse('  USER@EXAMPLE.COM  ');

    // Assert
    expect(result).toBe('user@example.com');
  });

  it('should allow validators to be async', async () => {
    // Arrange - Async validator (ex: check database)
    class UniqueEmailValidator implements IValidator<string, string> {
      async parse(data: string): Promise<string> {
        // Simular check no banco
        await new Promise((resolve) => setTimeout(resolve, 10));

        if (data === 'taken@example.com') {
          throw ValidationError.fromSingleError(
            'email',
            'Email already registered',
          );
        }

        return data;
      }
    }

    const validator = new UniqueEmailValidator();

    // Act & Assert
    await expect(validator.parse('taken@example.com')).rejects.toThrow(
      ValidationError,
    );

    const result = await validator.parse('available@example.com');
    expect(result).toBe('available@example.com');
  });

  it('should allow chaining validators', async () => {
    // Arrange - Composite validator
    class CompositeValidator<T> implements IValidator<T, T> {
      constructor(private validators: IValidator<T, T>[]) {}

      async parse(data: T): Promise<T> {
        let result = data;
        for (const validator of this.validators) {
          result = await validator.parse(result);
        }
        return result;
      }
    }

    class TrimValidator implements IValidator<string, string> {
      parse(data: string): string {
        return data.trim();
      }
    }

    class LowercaseValidator implements IValidator<string, string> {
      parse(data: string): string {
        return data.toLowerCase();
      }
    }

    const validator = new CompositeValidator([
      new TrimValidator(),
      new LowercaseValidator(),
    ]);

    // Act
    const result = await validator.parse('  HELLO  ');

    // Assert
    expect(result).toBe('hello');
  });
});
