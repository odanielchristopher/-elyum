import { inspect } from 'node:util';

import { ValidationError } from '@elyum/validation';
import { describe, expect, it } from 'vitest';
import * as yup from 'yup';

import { YupValidator, yupValidator } from '@elyum/validation-yup';

describe('YupValidator', () => {
  describe('parse() - async', () => {
    it('should validate valid data', async () => {
      // Arrange
      const schema = yup.object({
        name: yup.string().required(),
        age: yup.number().required(),
      });
      const validator = new YupValidator(schema);
      const data = { name: 'John', age: 30 };

      // Act
      const result = await validator.parse(data);

      // Assert
      expect(result).toEqual(data);
    });

    it('should transform data according to schema', async () => {
      // Arrange
      const schema = yup.object({
        name: yup.string().trim().lowercase(),
        age: yup.number(),
      });
      const validator = new YupValidator(schema);

      // Act
      const result = await validator.parse({
        name: '  JOHN  ',
        age: 30,
      });

      // Assert
      expect(result.name).toBe('john');
    });

    it('should throw ValidationError for invalid data', async () => {
      // Arrange
      const schema = yup.object({
        email: yup.string().email().required(),
      });
      const validator = new YupValidator(schema);

      // Act & Assert
      await expect(validator.parse({ email: 'invalid' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should collect all errors (abortEarly: false)', async () => {
      // Arrange
      const schema = yup.object({
        email: yup.string().email().required(),
        age: yup.number().min(18).required(),
      });
      const validator = new YupValidator(schema);

      // Act
      try {
        await validator.parse({ email: 'invalid', age: 15 });
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;

        expect(validationError.errors.length).toBeGreaterThanOrEqual(2);
        expect(validationError.hasFieldError('email')).toBe(true);
        expect(validationError.hasFieldError('age')).toBe(true);
      }
    });

    it('should handle nested object errors', async () => {
      // Arrange
      const schema = yup.object({
        user: yup.object({
          name: yup.string().min(3).required(),
          email: yup.string().email().required(),
        }),
      });
      const validator = new YupValidator(schema);

      // Act
      try {
        await validator.parse({
          user: { name: 'Jo', email: 'invalid' },
        });
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        const validationError = error as ValidationError;
        const fieldNames = validationError.errors.map((e) => e.field);

        expect(fieldNames).toContain('user.name');
        expect(fieldNames).toContain('user.email');
      }
    });

    it('should handle array errors', async () => {
      // Arrange
      const schema = yup.object({
        tags: yup.array().of(yup.string().min(3).required()),
      });
      const validator = new YupValidator(schema);

      // Act
      try {
        await validator.parse({ tags: ['ok', 'x', 'good'] });
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        const validationError = error as ValidationError;
        expect(validationError.errors[0]?.field).toContain('tags');
      }
    });

    it('should support async validations', async () => {
      // Arrange
      const schema = yup.object({
        username: yup
          .string()
          .test('unique', 'Username already taken', async (value) => {
            // Simular check async
            await new Promise((resolve) => setTimeout(resolve, 10));
            return value !== 'admin';
          }),
      });
      const validator = new YupValidator(schema);

      // Act & Assert
      await expect(validator.parse({ username: 'admin' })).rejects.toThrow(
        ValidationError,
      );

      const result = await validator.parse({ username: 'user123' });
      expect(result.username).toBe('user123');
    });
  });

  describe('parseSync()', () => {
    it('should validate synchronously', () => {
      // Arrange
      const schema = yup.object({
        name: yup.string().required(),
      });
      const validator = new YupValidator(schema);

      // Act
      const result = validator.parseSync({ name: 'John' });

      // Assert
      expect(result.name).toBe('John');
    });

    it('should throw for invalid data', () => {
      // Arrange
      const schema = yup.object({
        email: yup.string().email().required(),
      });
      const validator = new YupValidator(schema);

      // Act & Assert
      expect(() => {
        validator.parseSync({ email: 'invalid' });
      }).toThrow(ValidationError);
    });

    it('should throw if schema has async validations', () => {
      // Arrange
      const schema = yup.object({
        username: yup
          .string()
          .test('unique', 'Already taken', async () => true),
      });
      const validator = new YupValidator(schema);

      // Act & Assert
      expect(() => {
        validator.parseSync({ username: 'test' });
      }).toThrow(); // Yup lança erro para validações async em validateSync
    });
  });

  describe('safeParse()', () => {
    it('should return success result for valid data', async () => {
      // Arrange
      const schema = yup.object({ name: yup.string().required() });
      const validator = new YupValidator(schema);

      // Act
      const result = await validator.safeParse({ name: 'John' });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
      }
    });

    it('should return error result for invalid data', async () => {
      // Arrange
      const schema = yup.object({ email: yup.string().email().required() });
      const validator = new YupValidator(schema);

      // Act
      const result = await validator.safeParse({ email: 'invalid' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('yupValidator() helper', () => {
    it('should create YupValidator instance', async () => {
      // Arrange
      const schema = yup.object({ name: yup.string().required() });

      // Act
      const validator = yupValidator(schema);

      // Assert
      expect(validator).toBeInstanceOf(YupValidator);
      const result = await validator.parse({ name: 'John' });
      expect(result.name).toBe('John');
    });

    it('should work with complex schemas', async () => {
      // Arrange
      const schema = yup.object({
        name: yup.string().min(3).required(),
        email: yup.string().email().required(),
        age: yup.number().integer().positive().required(),
        address: yup.object({
          street: yup.string().required(),
          city: yup.string().required(),
        }),
        tags: yup.array().of(yup.string().required()),
      });

      const validator = yupValidator(schema);

      // Act
      const result = await validator.parse({
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

  it('should keep sensitive input out of normalized and serialized errors', async () => {
    const secrets = [
      'password-example-secret',
      'token-example-secret',
      'authorization-example-secret',
      'nested-example-secret',
    ];
    const validator = new YupValidator(
      yup.object({
        password: yup.number(),
        token: yup.number(),
        authorization: yup.number(),
        nested: yup.object({ secret: yup.number() }),
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

  it('should sanitize a Yup error without inner errors', async () => {
    const secret = 'single-example-secret';
    const validator = new YupValidator(
      yup.mixed().test('custom', 'invalid', (value) => {
        throw new yup.ValidationError(
          `Invalid value: ${String(value)}`,
          value,
          'password',
          'custom',
        );
      }),
    );
    const result = await validator.safeParse(secret);
    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected validation failure');
    expect(result.error.errors[0]).toMatchObject({
      field: 'password',
      code: 'custom',
    });
    expect(inspect(result.error)).not.toContain(secret);
    expect(JSON.stringify(result.error)).not.toContain(secret);
  });

  describe('Error conversion', () => {
    it('should include error type/code', async () => {
      // Arrange
      const schema = yup.string().email();
      const validator = new YupValidator(schema);

      // Act
      try {
        await validator.parse('invalid');
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        const validationError = error as ValidationError;
        expect(validationError.errors[0]?.code).toBeDefined();
      }
    });

    it('should not include the received value', async () => {
      // Arrange
      const schema = yup.number();
      const validator = new YupValidator(schema);

      // Act
      try {
        await validator.parse('not-a-number');
        expect.fail('Should have thrown');
      } catch (error) {
        // Assert
        const validationError = error as ValidationError;
        expect(validationError.errors[0]?.received).toBeUndefined();
      }
    });
  });
});
