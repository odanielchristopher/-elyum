import { describe, expect, it } from 'vitest';

import { ValidationError, ValidationErrorItem } from '@elyum/validation';

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should create error with message and errors', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];

      // Act
      const error = new ValidationError('Validation failed', errors);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual(errors);
    });

    it('should preserve stack trace', () => {
      // Act
      const error = new ValidationError('Test', []);

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });
  });

  describe('getFieldErrors()', () => {
    it('should return errors for specific field', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Required' },
        { field: 'email', message: 'Invalid format' },
        { field: 'password', message: 'Too short' },
      ];
      const error = new ValidationError('Test', errors);

      // Act
      const emailErrors = error.getFieldErrors('email');

      // Assert
      expect(emailErrors).toHaveLength(2);
      expect(emailErrors[0]?.message).toBe('Required');
      expect(emailErrors[1]?.message).toBe('Invalid format');
    });

    it('should return empty array for field without errors', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Invalid' },
      ];
      const error = new ValidationError('Test', errors);

      // Act
      const result = error.getFieldErrors('password');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('hasFieldError()', () => {
    it('should return true if field has errors', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Invalid' },
      ];
      const error = new ValidationError('Test', errors);

      // Act & Assert
      expect(error.hasFieldError('email')).toBe(true);
    });

    it('should return false if field has no errors', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Invalid' },
      ];
      const error = new ValidationError('Test', errors);

      // Act & Assert
      expect(error.hasFieldError('password')).toBe(false);
    });
  });

  describe('getErrorMap()', () => {
    it('should return map of errors by field', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Required' },
        { field: 'email', message: 'Invalid' },
        { field: 'password', message: 'Too short' },
      ];
      const error = new ValidationError('Test', errors);

      // Act
      const map = error.getErrorMap();

      // Assert
      expect(map).toEqual({
        email: ['Required', 'Invalid'],
        password: ['Too short'],
      });
    });

    it('should return empty object for no errors', () => {
      // Arrange
      const error = new ValidationError('Test', []);

      // Act
      const map = error.getErrorMap();

      // Assert
      expect(map).toEqual({});
    });
  });

  describe('toJSON()', () => {
    it('should serialize to JSON', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Invalid', code: 'invalid_email' },
      ];
      const error = new ValidationError('Validation failed', errors);

      // Act
      const json = error.toJSON();

      // Assert
      expect(json).toEqual({
        name: 'ValidationError',
        message: 'Validation failed',
        errors: errors,
      });
    });

    it('should work with JSON.stringify', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Invalid' },
      ];
      const error = new ValidationError('Test', errors);

      // Act
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);

      // Assert
      expect(parsed.name).toBe('ValidationError');
      expect(parsed.errors).toHaveLength(1);
    });
  });

  describe('static fromSingleError()', () => {
    it('should create ValidationError from single error', () => {
      // Act
      const error = ValidationError.fromSingleError('email', 'Invalid email');

      // Assert
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual([
        { field: 'email', message: 'Invalid email' },
      ]);
    });
  });

  describe('static fromErrors()', () => {
    it('should create ValidationError from multiple errors', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Required' },
        { field: 'password', message: 'Too short' },
      ];

      // Act
      const error = ValidationError.fromErrors(errors);

      // Assert
      expect(error.message).toBe('Validation failed with 2 errors');
      expect(error.errors).toEqual(errors);
    });

    it('should use singular message for single error', () => {
      // Arrange
      const errors: ValidationErrorItem[] = [
        { field: 'email', message: 'Invalid' },
      ];

      // Act
      const error = ValidationError.fromErrors(errors);

      // Assert
      expect(error.message).toBe('Validation failed: Invalid');
    });
  });

  describe('ValidationErrorItem', () => {
    it('should support optional fields', () => {
      // Arrange
      const item: ValidationErrorItem = {
        field: 'age',
        message: 'Must be positive',
        code: 'min',
        received: -5,
        expected: 0,
      };

      // Assert
      expect(item.field).toBe('age');
      expect(item.message).toBe('Must be positive');
      expect(item.code).toBe('min');
      expect(item.received).toBe(-5);
      expect(item.expected).toBe(0);
    });

    it('should work with only required fields', () => {
      // Arrange
      const item: ValidationErrorItem = {
        field: 'email',
        message: 'Required',
      };

      // Assert
      expect(item.field).toBe('email');
      expect(item.message).toBe('Required');
      expect(item.code).toBeUndefined();
    });
  });
});
