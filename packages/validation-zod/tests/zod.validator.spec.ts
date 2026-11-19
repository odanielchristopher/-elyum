import { inspect } from 'node:util';

import { ValidationError } from '@elyum/validation';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ZodValidator, zodValidator } from '@elyum/validation-zod';

describe('ZodValidator', () => {
  describe('parse()', () => {
    it('should validate valid data', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const validator = new ZodValidator(schema);
      const data = { name: 'John', age: 30 };

      // Act
      const result = validator.parse(data);

      // Assert
      expect(result).toEqual(data);
    });

    it('should transform data according to schema', () => {
      // Arrange
      const schema = z.object({
        name: z.string().trim().toLowerCase(),
        age: z.coerce.number(),
      });
      const validator = new ZodValidator(schema);

      // Act
      const result = validator.parse({
        name: '  JOHN  ',
        age: '30',
      });

      // Assert
      expect(result).toEqual({
        name: 'john',
        age: 30,
      });
    });

    it('should throw ValidationError for invalid data', () => {
      // Arrange
      const schema = z.object({
        email: z.string().email(),
      });
      const validator = new ZodValidator(schema);

      // Act & Assert
      expect(() => {
        validator.parse({ email: 'invalid' });
      }).toThrow(ValidationError);
    });

    it('should convert ZodError to ValidationError correctly', () => {
      // Arrange
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });
      const validator = new ZodValidator(schema);

      // Act
      try {
        validator.parse({ email: 'invalid', age: 15 });
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;

        expect(validationError.errors).toHaveLength(2);
        expect(validationError.hasFieldError('email')).toBe(true);
        expect(validationError.hasFieldError('age')).toBe(true);
      }
    });

    it('should handle nested object errors', () => {
      // Arrange
      const schema = z.object({
        user: z.object({
          name: z.string().min(3),
          email: z.string().email(),
        }),
      });
      const validator = new ZodValidator(schema);

      // Act
      try {
        validator.parse({
          user: { name: 'Jo', email: 'invalid' },
        });
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        const validationError = error as ValidationError;
        expect(validationError.errors[0]?.field).toBe('user.name');
        expect(validationError.errors[1]?.field).toBe('user.email');
      }
    });

    it('should handle array errors', () => {
      // Arrange
      const schema = z.object({
        tags: z.array(z.string().min(2)),
      });
      const validator = new ZodValidator(schema);

      // Act
      try {
        validator.parse({ tags: ['ok', 'x', 'good'] });
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        const validationError = error as ValidationError;
        expect(validationError.errors[0]?.field).toBe('tags.1');
      }
    });

    it('should re-throw non-ZodError errors', () => {
      // Arrange
      const schema = z.object({
        data: z.any().transform(() => {
          throw new Error('Custom error');
        }),
      });
      const validator = new ZodValidator(schema);

      // Act & Assert
      expect(() => {
        validator.parse({ data: 'test' });
      }).toThrow('Custom error');
    });
  });

  describe('parseAsync()', () => {
    it('should validate async schemas', async () => {
      // Arrange
      const schema = z.object({
        email: z
          .string()
          .email()
          .refine(
            async (email) => {
              // Simular validação async (ex: checar se email já existe)
              await new Promise((resolve) => setTimeout(resolve, 10));
              return !email.includes('taken');
            },
            { message: 'Email already taken' },
          ),
      });
      const validator = new ZodValidator(schema);

      // Act
      const result = await validator.parseAsync({ email: 'new@example.com' });

      // Assert
      expect(result.email).toBe('new@example.com');
    });

    it('should throw ValidationError for async validation failure', async () => {
      // Arrange
      const schema = z.object({
        email: z
          .string()
          .refine(async () => false, { message: 'Async validation failed' }),
      });
      const validator = new ZodValidator(schema);

      // Act & Assert
      await expect(
        validator.parseAsync({ email: 'test@example.com' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('safeParse()', () => {
    it('should return success result for valid data', () => {
      // Arrange
      const schema = z.object({ name: z.string() });
      const validator = new ZodValidator(schema);

      // Act
      const result = validator.safeParse({ name: 'John' });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John' });
      }
    });

    it('should return error result for invalid data', () => {
      // Arrange
      const schema = z.object({ email: z.string().email() });
      const validator = new ZodValidator(schema);

      // Act
      const result = validator.safeParse({ email: 'invalid' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.hasFieldError('email')).toBe(true);
      }
    });
  });

  describe('zodValidator() helper', () => {
    it('should create ZodValidator instance', () => {
      // Arrange
      const schema = z.object({ name: z.string() });

      // Act
      const validator = zodValidator(schema);

      // Assert
      expect(validator).toBeInstanceOf(ZodValidator);
      expect(validator.parse({ name: 'John' })).toEqual({ name: 'John' });
    });

    it('should work with complex schemas', () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().int().positive(),
        address: z.object({
          street: z.string(),
          city: z.string(),
        }),
        tags: z.array(z.string()),
      });

      const validator = zodValidator(schema);

      // Act
      const result = validator.parse({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'NYC',
        },
        tags: ['developer', 'typescript'],
      });

      // Assert
      expect(result.name).toBe('John Doe');
      expect(result.address.city).toBe('NYC');
      expect(result.tags).toHaveLength(2);
    });
  });

  describe('Type inference', () => {
    it('should infer correct output type', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const validator = zodValidator(schema);

      // Act
      const result = validator.parse({ name: 'John', age: 30 });

      // Assert - TypeScript should infer type correctly
      const name: string = result.name;
      const age: number = result.age;

      expect(name).toBe('John');
      expect(age).toBe(30);
    });
  });

  it('should keep sensitive input out of normalized and serialized errors', async () => {
    const secrets = [
      'password-example-secret',
      'token-example-secret',
      'authorization-example-secret',
      'nested-example-secret',
    ];
    const validator = new ZodValidator(
      z.object({
        password: z.number(),
        token: z.number(),
        authorization: z.number(),
        nested: z.object({ secret: z.number() }),
      }),
    );
    for (const data of [
      {
        password: secrets[0],
        token: 1,
        authorization: 1,
        nested: { secret: 1 },
      },
      {
        password: secrets[0],
        token: secrets[1],
        authorization: secrets[2],
        nested: { secret: secrets[3] },
      },
    ]) {
      const result = await validator.safeParse(data);
      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected validation failure');
      expect(result.error.errors.length).toBe(data.token === 1 ? 1 : 4);
      for (const representation of [
        inspect(result.error),
        JSON.stringify(result.error),
        JSON.stringify(result.error.toJSON()),
      ]) {
        for (const secret of secrets)
          expect(representation).not.toContain(secret);
      }
    }
  });

  describe('Error details', () => {
    it('should include error code', () => {
      // Arrange
      const schema = z.string().email();
      const validator = new ZodValidator(schema);

      // Act
      try {
        validator.parse('invalid');
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        const validationError = error as ValidationError;
        expect(validationError.errors[0]?.code).toBeDefined();
      }
    });

    it('should include received value', () => {
      // Arrange
      const schema = z.number();
      const validator = new ZodValidator(schema);

      // Act
      try {
        validator.parse('not-a-number');
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        const validationError = error as ValidationError;
        expect(validationError.errors[0]?.received).toBe('string');
      }
    });
  });
});
