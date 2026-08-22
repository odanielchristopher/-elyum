import { describe, expect, it } from 'vitest';

import {
  Inject,
  INJECT_METADATA_KEY,
  Injectable,
  OPTIONAL_METADATA_KEY,
  OptionalInject,
  PROVIDER_TOKEN_METADATA_KEY,
  SCOPE_METADATA_KEY,
} from '@elyum/core';

describe('Decorators', () => {
  describe('@Inject', () => {
    it('should set inject metadata on constructor parameter', () => {
      // Arrange
      const TOKEN = Symbol('MyToken');

      class TestClass {
        constructor(@Inject(TOKEN) public dep: any) {}
      }

      // Act
      const metadata = Reflect.getMetadata(INJECT_METADATA_KEY(0), TestClass);

      // Assert
      expect(metadata).toBe(TOKEN);
    });

    it('should work with multiple parameters', () => {
      // Arrange
      const TOKEN_A = Symbol('A');
      const TOKEN_B = Symbol('B');
      const TOKEN_C = Symbol('C');

      class TestClass {
        constructor(
          @Inject(TOKEN_A) public a: any,
          @Inject(TOKEN_B) public b: any,
          @Inject(TOKEN_C) public c: any,
        ) {}
      }

      // Act & Assert
      expect(Reflect.getMetadata(INJECT_METADATA_KEY(0), TestClass)).toBe(
        TOKEN_A,
      );
      expect(Reflect.getMetadata(INJECT_METADATA_KEY(1), TestClass)).toBe(
        TOKEN_B,
      );
      expect(Reflect.getMetadata(INJECT_METADATA_KEY(2), TestClass)).toBe(
        TOKEN_C,
      );
    });

    it('should work with string tokens', () => {
      // Arrange
      class TestClass {
        constructor(@Inject('config') public config: any) {}
      }

      // Act
      const metadata = Reflect.getMetadata(INJECT_METADATA_KEY(0), TestClass);

      // Assert
      expect(metadata).toBe('config');
    });
  });

  describe('@OptionalInject', () => {
    it('should set both inject and optional metadata', () => {
      // Arrange
      const TOKEN = Symbol('Optional');

      class TestClass {
        constructor(@OptionalInject(TOKEN) public dep?: any) {}
      }

      // Act
      const injectMetadata = Reflect.getMetadata(
        INJECT_METADATA_KEY(0),
        TestClass,
      );
      const optionalMetadata = Reflect.getMetadata(
        OPTIONAL_METADATA_KEY(0),
        TestClass,
      );

      // Assert
      expect(injectMetadata).toBe(TOKEN);
      expect(optionalMetadata).toBe(true);
    });

    it('should work with mixed optional and required deps', () => {
      // Arrange
      class Required {}
      const OPTIONAL_TOKEN = Symbol('Optional');

      class TestClass {
        constructor(
          public required: Required,
          @OptionalInject(OPTIONAL_TOKEN) public optional?: any,
        ) {}
      }

      // Act
      const requiredOptional = Reflect.getMetadata(
        OPTIONAL_METADATA_KEY(0),
        TestClass,
      );
      const optionalOptional = Reflect.getMetadata(
        OPTIONAL_METADATA_KEY(1),
        TestClass,
      );

      // Assert
      expect(requiredOptional).toBeUndefined(); // Não tem @OptionalInject
      expect(optionalOptional).toBe(true);
    });
  });

  describe('@Injectable', () => {
    it('should mark class as injectable without options', () => {
      // Arrange
      @Injectable()
      class TestService {}

      // Act
      const tokenMetadata = Reflect.getMetadata(
        PROVIDER_TOKEN_METADATA_KEY,
        TestService,
      );
      const scopeMetadata = Reflect.getMetadata(
        SCOPE_METADATA_KEY,
        TestService,
      );

      // Assert
      expect(tokenMetadata).toBeUndefined(); // Sem token customizado
      expect(scopeMetadata).toBeUndefined(); // Sem escopo customizado
    });

    it('should set custom token', () => {
      // Arrange
      const TOKEN = Symbol('IUserService');

      @Injectable({ token: TOKEN })
      class UserService {}

      // Act
      const metadata = Reflect.getMetadata(
        PROVIDER_TOKEN_METADATA_KEY,
        UserService,
      );

      // Assert
      expect(metadata).toBe(TOKEN);
    });

    it('should set custom scope', () => {
      // Arrange
      @Injectable({ scope: 'transient' })
      class TransientService {}

      // Act
      const metadata = Reflect.getMetadata(
        SCOPE_METADATA_KEY,
        TransientService,
      );

      // Assert
      expect(metadata).toBe('transient');
    });

    it('should set both token and scope', () => {
      // Arrange
      const TOKEN = 'MyService';

      @Injectable({ token: TOKEN, scope: 'scoped' })
      class MyService {}

      // Act
      const tokenMetadata = Reflect.getMetadata(
        PROVIDER_TOKEN_METADATA_KEY,
        MyService,
      );
      const scopeMetadata = Reflect.getMetadata(SCOPE_METADATA_KEY, MyService);

      // Assert
      expect(tokenMetadata).toBe(TOKEN);
      expect(scopeMetadata).toBe('scoped');
    });
  });
});
