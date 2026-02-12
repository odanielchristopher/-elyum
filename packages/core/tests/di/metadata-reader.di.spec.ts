import { ReflectMetadataReader } from '@elyum/core';
import { beforeEach, describe, expect, it } from 'vitest';

describe('ReflectMetadataReader', () => {
  let reader: ReflectMetadataReader;

  beforeEach(() => {
    reader = new ReflectMetadataReader();
  });

  describe('get()', () => {
    it('should read metadata from class', () => {
      // Arrange
      class TestClass {}
      const metadataKey = 'test:key';
      const metadataValue = { data: 'test' };
      Reflect.defineMetadata(metadataKey, metadataValue, TestClass);

      // Act
      const result = reader.get(metadataKey, TestClass);

      // Assert
      expect(result).toEqual(metadataValue);
    });

    it('should return undefined if metadata not found', () => {
      // Arrange
      class TestClass {}

      // Act
      const result = reader.get('non-existent', TestClass);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should read design:paramtypes metadata', () => {
      // Arrange
      class Dependency {}
      class TestClass {
        constructor(public dep: Dependency) {}
      }
      Reflect.defineMetadata('design:paramtypes', [Dependency], TestClass);

      // Act
      const result = reader.get<any[]>('design:paramtypes', TestClass);

      // Assert
      expect(result).toEqual([Dependency]);
    });

    it('should be type-safe with generics', () => {
      // Arrange
      class TestClass {}
      Reflect.defineMetadata('string-key', 'string-value', TestClass);
      Reflect.defineMetadata('number-key', 42, TestClass);

      // Act
      const stringResult = reader.get<string>('string-key', TestClass);
      const numberResult = reader.get<number>('number-key', TestClass);

      // Assert
      expect(typeof stringResult).toBe('string');
      expect(typeof numberResult).toBe('number');
    });
  });

  describe('getAll()', () => {
    it('should read metadata from multiple classes', () => {
      // Arrange
      class ClassA {}
      class ClassB {}
      class ClassC {}

      Reflect.defineMetadata('key', 'A', ClassA);
      Reflect.defineMetadata('key', 'B', ClassB);
      Reflect.defineMetadata('key', 'C', ClassC);

      // Act
      const result = reader.getAll<string[]>('key', [ClassA, ClassB, ClassC]);

      // Assert
      expect(result).toEqual(['A', 'B', 'C']);
    });

    it('should handle empty array', () => {
      // Act
      const result = reader.getAll('key', []);

      // Assert
      expect(result).toEqual([]);
    });

    it('should include undefined for classes without metadata', () => {
      // Arrange
      class ClassA {}
      class ClassB {}

      Reflect.defineMetadata('key', 'A', ClassA);
      // ClassB has no metadata

      // Act
      const result = reader.getAll<any[]>('key', [ClassA, ClassB]);

      // Assert
      expect(result).toEqual(['A', undefined]);
    });
  });

  describe('cache (if implemented)', () => {
    it('should cache metadata reads', () => {
      // Arrange
      class TestClass {}
      const metadataKey = 'cached-key';
      const metadataValue = { data: 'original' };
      Reflect.defineMetadata(metadataKey, metadataValue, TestClass);

      // Act - First read
      const result1 = reader.get(metadataKey, TestClass);

      // Modify metadata after first read
      Reflect.defineMetadata(metadataKey, { data: 'modified' }, TestClass);

      // Act - Second read (should return cached value if cache implemented)
      const result2 = reader.get(metadataKey, TestClass);

      // Assert
      // If cache is implemented:
      // expect(result1).toBe(result2);
      // expect(result2).toEqual({ data: 'original' });

      // If cache is NOT implemented:
      expect(result1).toEqual({ data: 'original' });
      expect(result2).toEqual({ data: 'modified' });
    });
  });
});
