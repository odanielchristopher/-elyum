import { beforeEach, describe, expect, it } from 'vitest';

import {
  ElyumContainer,
  Provider,
  ProviderAlreadyRegisteredError,
  ReflectDependencyResolver,
  ReflectMetadataReader,
  ValueProvider,
} from '@elyum/core';

describe('ElyumContainer', () => {
  let container: ElyumContainer;
  let resolver: ReflectDependencyResolver;
  let metadataReader: ReflectMetadataReader;

  beforeEach(() => {
    metadataReader = new ReflectMetadataReader();
    resolver = new ReflectDependencyResolver(metadataReader);
    container = new ElyumContainer(resolver);
  });

  describe('register()', () => {
    it('should register a class provider', () => {
      // Arrange
      class TestService {}
      const provider: Provider = {
        token: 'TestService',
        useClass: TestService,
      };

      // Act
      container.register(provider);

      // Assert
      const registered = container.getProvider('TestService');
      expect(registered).toBeDefined();
      expect(registered).toEqual(provider);
    });

    it('should register a value provider', () => {
      // Arrange
      const provider: Provider = {
        token: 'config',
        useValue: { port: 3000 },
      };

      // Act
      container.register(provider);

      // Assert
      const registered = container.getProvider('config');
      expect(registered).toBeDefined();
      expect(registered).toEqual(provider);
    });

    it('should register a factory provider', () => {
      // Arrange
      const provider: Provider = {
        token: 'database',
        useFactory: () => ({ connected: true }),
      };

      // Act
      container.register(provider);

      // Assert
      const registered = container.getProvider('database');
      expect(registered).toBeDefined();
      expect(registered).toEqual(provider);
    });

    it('should throw error if provider already registered', () => {
      // Arrange
      const provider: Provider = {
        token: 'duplicate',
        useValue: 'first',
      };
      container.register(provider);

      // Act & Assert
      expect(() => {
        container.register({
          token: 'duplicate',
          useValue: 'second',
        });
      }).toThrow(ProviderAlreadyRegisteredError);
    });

    it('should allow same token in parent and child containers', () => {
      // Arrange
      const parentProvider: Provider = {
        token: 'service',
        useValue: 'parent',
      };
      container.register(parentProvider);

      const childContainer = new ElyumContainer(resolver, container);
      const childProvider: Provider = {
        token: 'service',
        useValue: 'child',
      };

      // Act & Assert (should not throw)
      expect(() => {
        childContainer.register(childProvider);
      }).not.toThrow();
    });
  });

  describe('getProvider()', () => {
    it('should return provider if registered in current container', () => {
      // Arrange
      const provider: Provider = {
        token: 'test',
        useValue: 'value',
      };
      container.register(provider);

      // Act
      const result = container.getProvider('test');

      // Assert
      expect(result).toEqual(provider);
    });

    it('should return provider from parent if not in current container', () => {
      // Arrange
      const parentProvider: Provider = {
        token: 'parent-service',
        useValue: 'parent-value',
      };
      container.register(parentProvider);

      const childContainer = new ElyumContainer(resolver, container);

      // Act
      const result = childContainer.getProvider('parent-service');

      // Assert
      expect(result).toEqual(parentProvider);
    });

    it('should prioritize current container over parent', () => {
      // Arrange
      const parentProvider: Provider = {
        token: 'override',
        useValue: 'parent',
      };
      container.register(parentProvider);

      const childContainer = new ElyumContainer(resolver, container);
      const childProvider: Provider = {
        token: 'override',
        useValue: 'child',
      };
      childContainer.register(childProvider);

      // Act
      const result = childContainer.getProvider('override');

      // Assert
      expect(result).toEqual(childProvider);
      expect((result as ValueProvider).useValue).toBe('child');
    });

    it('should return undefined if provider not found', () => {
      // Act
      const result = container.getProvider('non-existent');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getValue() / setValue()', () => {
    it('should store and retrieve cached values', () => {
      // Arrange
      const token = 'cached';
      const value = { data: 'test' };

      // Act
      container.setValue(token, value);
      const result = container.getValue(token);

      // Assert
      expect(result).toBe(value); // Same reference
    });

    it('should return undefined for non-existent values', () => {
      // Act
      const result = container.getValue('non-existent');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should not share cache between parent and child', () => {
      // Arrange
      const childContainer = new ElyumContainer(resolver, container);

      container.setValue('parent-cache', 'parent-value');
      childContainer.setValue('child-cache', 'child-value');

      // Act
      const parentValue = childContainer.getValue('parent-cache');
      const childValue = container.getValue('child-cache');

      // Assert
      expect(parentValue).toBeUndefined(); // Child doesn't see parent cache
      expect(childValue).toBeUndefined(); // Parent doesn't see child cache
    });
  });

  describe('getRoot()', () => {
    it('should return self if no parent', () => {
      // Act
      const root = container.getRoot();

      // Assert
      expect(root).toBe(container);
    });

    it('should return root container from child', () => {
      // Arrange
      const child1 = new ElyumContainer(resolver, container);
      const child2 = new ElyumContainer(resolver, child1);

      // Act
      const root = child2.getRoot();

      // Assert
      expect(root).toBe(container);
    });

    it('should return root from deeply nested containers', () => {
      // Arrange
      const child1 = new ElyumContainer(resolver, container);
      const child2 = new ElyumContainer(resolver, child1);
      const child3 = new ElyumContainer(resolver, child2);
      const child4 = new ElyumContainer(resolver, child3);

      // Act
      const root = child4.getRoot();

      // Assert
      expect(root).toBe(container);
    });
  });

  describe('resolve() delegation', () => {
    it('should delegate to dependency resolver', () => {
      // Arrange
      const provider: Provider = {
        token: 'test',
        useValue: 'resolved-value',
      };
      container.register(provider);

      // Act
      const result = container.resolve('test');

      // Assert
      expect(result).toBe('resolved-value');
    });
  });

  describe('fork()', () => {
    it('should create child container', () => {
      // Act
      const child = container.fork();

      // Assert
      expect(child).toBeInstanceOf(ElyumContainer);
      expect(child).not.toBe(container);
      expect((child as any).parent).toBe(container);
    });

    it('child should inherit parent providers', () => {
      // Arrange
      const provider: Provider = {
        token: 'shared',
        useValue: 'value',
      };
      container.register(provider);

      // Act
      const child = container.fork();

      // Assert
      expect(child.getProvider('shared')).toEqual(provider);
    });
  });
});
