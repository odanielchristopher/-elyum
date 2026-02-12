import {
  DEPENDENCIES_METADATA_KEY,
  INJECT_METADATA_KEY,
  OPTIONAL_METADATA_KEY,
} from '@elyum/constants/shared.constants';
import { beforeEach, describe, expect, it } from 'vitest';

import { ElyumContainer } from '@elyum/di/container.di';
import { ReflectDependencyResolver } from '@elyum/di/reflect-dependency-resolver.di';
import { ReflectMetadataReader } from '@elyum/di/reflect-metadata-reader.di';
import { CircularDependencyError } from '@elyum/errors/circular-dependency.error';
import { ProviderNotFoundError } from '@elyum/errors/provider-not-found.error';
import { Provider } from '@elyum/types/provider.type';

describe('ReflectDependencyResolver', () => {
  let container: ElyumContainer;
  let resolver: ReflectDependencyResolver;
  let metadataReader: ReflectMetadataReader;

  beforeEach(() => {
    metadataReader = new ReflectMetadataReader();
    resolver = new ReflectDependencyResolver(metadataReader);
    container = new ElyumContainer(resolver);
  });

  describe('ValueProvider', () => {
    it('should resolve value provider', () => {
      // Arrange
      const provider: Provider = {
        token: 'config',
        useValue: { port: 3000 },
      };
      container.register(provider);

      // Act
      const result = container.resolve('config');

      // Assert
      expect(result).toEqual({ port: 3000 });
    });

    it('should return same instance for multiple resolves (singleton by nature)', () => {
      // Arrange
      const value = { port: 3000 };
      const provider: Provider = {
        token: 'config',
        useValue: value,
      };
      container.register(provider);

      // Act
      const result1 = container.resolve('config');
      const result2 = container.resolve('config');

      // Assert
      expect(result1).toBe(result2);
      expect(result1).toBe(value);
    });
  });

  describe('ClassProvider - without dependencies', () => {
    it('should resolve class provider without dependencies', () => {
      // Arrange
      class SimpleService {
        public readonly id = Math.random();
      }

      const provider: Provider = {
        token: SimpleService,
        useClass: SimpleService,
      };
      container.register(provider);

      // Act
      const result = container.resolve(SimpleService);

      // Assert
      expect(result).toBeInstanceOf(SimpleService);
      expect(result.id).toBeDefined();
    });

    it('should resolve using string token', () => {
      // Arrange
      class TestService {}

      const provider: Provider = {
        token: 'TestService',
        useClass: TestService,
      };
      container.register(provider);

      // Act
      const result = container.resolve('TestService');

      // Assert
      expect(result).toBeInstanceOf(TestService);
    });

    it('should resolve using symbol token', () => {
      // Arrange
      class TestService {}
      const TOKEN = Symbol('TestService');

      const provider: Provider = {
        token: TOKEN,
        useClass: TestService,
      };
      container.register(provider);

      // Act
      const result = container.resolve(TOKEN);

      // Assert
      expect(result).toBeInstanceOf(TestService);
    });
  });

  describe('ClassProvider - with dependencies', () => {
    it('should resolve class with dependencies', () => {
      // Arrange
      class Repository {
        public readonly name = 'Repository';
      }

      class Service {
        constructor(public readonly repo: Repository) {}
      }

      // Simulate TypeScript metadata
      Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, [Repository], Service);

      container.register({ token: Repository, useClass: Repository });
      container.register({ token: Service, useClass: Service });

      // Act
      const result = container.resolve(Service);

      // Assert
      expect(result).toBeInstanceOf(Service);
      expect(result.repo).toBeInstanceOf(Repository);
      expect(result.repo.name).toBe('Repository');
    });

    it('should resolve nested dependencies', () => {
      // Arrange
      class Database {
        public readonly connected = true;
      }

      class Repository {
        constructor(public readonly db: Database) {}
      }

      class Service {
        constructor(public readonly repo: Repository) {}
      }

      // Metadata
      Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, [Database], Repository);
      Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, [Repository], Service);

      container.register({ token: Database, useClass: Database });
      container.register({ token: Repository, useClass: Repository });
      container.register({ token: Service, useClass: Service });

      // Act
      const result = container.resolve(Service);

      // Assert
      expect(result).toBeInstanceOf(Service);
      expect(result.repo).toBeInstanceOf(Repository);
      expect(result.repo.db).toBeInstanceOf(Database);
      expect(result.repo.db.connected).toBe(true);
    });

    it('should use @Inject metadata when present', () => {
      // Arrange
      class Repository {}
      const REPO_TOKEN = Symbol('Repository');

      class Service {
        constructor(public readonly repo: Repository) {}
      }

      // Metadata: constructor(repo: any) but @Inject(REPO_TOKEN)
      Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, [Object], Service);
      Reflect.defineMetadata(INJECT_METADATA_KEY(0), REPO_TOKEN, Service);

      container.register({ token: REPO_TOKEN, useClass: Repository });
      container.register({ token: Service, useClass: Service });

      // Act
      const result = container.resolve(Service);

      // Assert
      expect(result).toBeInstanceOf(Service);
      expect(result.repo).toBeInstanceOf(Repository);
    });
  });

  describe('FactoryProvider', () => {
    it('should resolve factory provider without dependencies', () => {
      // Arrange
      const provider: Provider = {
        token: 'factory',
        useFactory: () => ({ created: true }),
      };
      container.register(provider);

      // Act
      const result = container.resolve('factory');

      // Assert
      expect(result).toEqual({ created: true });
    });

    it('should resolve factory with dependencies', () => {
      // Arrange
      class Config {
        public readonly port = 3000;
      }

      const provider: Provider = {
        token: 'database',
        useFactory: (config: Config) => ({
          host: 'localhost',
          port: config.port,
        }),
        inject: [Config],
      };

      container.register({ token: Config, useClass: Config });
      container.register(provider);

      // Act
      const result = container.resolve('database');

      // Assert
      expect(result).toEqual({
        host: 'localhost',
        port: 3000,
      });
    });

    it('should pass dependencies in correct order', () => {
      // Arrange
      class ServiceA {
        public name = 'A';
      }
      class ServiceB {
        public name = 'B';
      }
      class ServiceC {
        public name = 'C';
      }

      const provider: Provider = {
        token: 'combined',
        useFactory: (a: ServiceA, b: ServiceB, c: ServiceC) => {
          return `${a.name}-${b.name}-${c.name}`;
        },
        inject: [ServiceA, ServiceB, ServiceC],
      };

      container.register({ token: ServiceA, useClass: ServiceA });
      container.register({ token: ServiceB, useClass: ServiceB });
      container.register({ token: ServiceC, useClass: ServiceC });
      container.register(provider);

      // Act
      const result = container.resolve('combined');

      // Assert
      expect(result).toBe('A-B-C');
    });
  });

  describe('Scopes', () => {
    describe('singleton (default)', () => {
      it('should return same instance for multiple resolves', () => {
        // Arrange
        class Service {
          public readonly id = Math.random();
        }

        container.register({
          token: Service,
          useClass: Service,
          scope: 'singleton',
        });

        // Act
        const instance1 = container.resolve(Service);
        const instance2 = container.resolve(Service);

        // Assert
        expect(instance1).toBe(instance2);
        expect(instance1.id).toBe(instance2.id);
      });

      it('should cache in root container', () => {
        // Arrange
        class Service {
          public id = Math.random();
        }

        container.register({
          token: Service,
          useClass: Service,
          scope: 'singleton',
        });

        const childContainer = container.fork();

        // Act
        const instance1 = container.resolve(Service);
        const instance2 = childContainer.resolve(Service);

        // Assert
        expect(instance1).toBe(instance2); // Same instance
      });
    });

    describe('scoped (request)', () => {
      it('should return same instance within same container', () => {
        // Arrange
        class Service {
          public readonly id = Math.random();
        }

        container.register({
          token: Service,
          useClass: Service,
          scope: 'scoped',
        });

        // Act
        const instance1 = container.resolve(Service);
        const instance2 = container.resolve(Service);

        // Assert
        expect(instance1).toBe(instance2);
      });

      it('should return different instances in different containers', () => {
        // Arrange
        class Service {
          public readonly id = Math.random();
        }

        container.register({
          token: Service,
          useClass: Service,
          scope: 'scoped',
        });

        const child1 = container.fork();
        const child2 = container.fork();

        // Act
        const instance1 = child1.resolve(Service);
        const instance2 = child2.resolve(Service);

        // Assert
        expect(instance1).not.toBe(instance2);
        expect(instance1.id).not.toBe(instance2.id);
      });
    });

    describe('transient', () => {
      it('should return new instance every time', () => {
        // Arrange
        class Service {
          public readonly id = Math.random();
        }

        container.register({
          token: Service,
          useClass: Service,
          scope: 'transient',
        });

        // Act
        const instance1 = container.resolve(Service);
        const instance2 = container.resolve(Service);

        // Assert
        expect(instance1).not.toBe(instance2);
        expect(instance1.id).not.toBe(instance2.id);
      });
    });
  });

  describe('Error handling', () => {
    it('should throw ProviderNotFoundError for unregistered token', () => {
      // Act & Assert
      expect(() => {
        container.resolve('non-existent');
      }).toThrow(ProviderNotFoundError);
    });

    it('should return undefined for optional unregistered token', () => {
      // Act
      const result = container.resolve('non-existent', { optional: true });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should detect circular dependencies', () => {
      // Arrange
      class ServiceA {
        constructor(public b: ServiceB) {}
      }

      class ServiceB {
        constructor(public a: ServiceA) {}
      }

      // Metadata
      Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, [ServiceB], ServiceA);
      Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, [ServiceA], ServiceB);

      container.register({ token: ServiceA, useClass: ServiceA });
      container.register({ token: ServiceB, useClass: ServiceB });

      // Act & Assert
      expect(() => {
        container.resolve(ServiceA);
      }).toThrow(CircularDependencyError);
    });

    it('should include dependency chain in error', () => {
      // Arrange
      class ServiceA {
        constructor(public b: ServiceB) {}
      }

      class ServiceB {
        constructor(public c: ServiceC) {}
      }

      class ServiceC {}

      Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, [ServiceB], ServiceA);
      Reflect.defineMetadata(DEPENDENCIES_METADATA_KEY, [ServiceC], ServiceB);

      container.register({ token: ServiceA, useClass: ServiceA });
      container.register({ token: ServiceB, useClass: ServiceB });
      // ServiceC NOT registered

      // Act & Assert
      try {
        container.resolve(ServiceA);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderNotFoundError);
      }
    });

    it('should allow optional dependencies', () => {
      // Arrange
      class OptionalService {}

      class MainService {
        constructor(public optional?: OptionalService) {}
      }

      // Metadata
      Reflect.defineMetadata(
        DEPENDENCIES_METADATA_KEY,
        [OptionalService],
        MainService,
      );
      Reflect.defineMetadata(OPTIONAL_METADATA_KEY(0), true, MainService);

      container.register({ token: MainService, useClass: MainService });
      // OptionalService NOT registered

      // Act
      const result = container.resolve(MainService);

      // Assert
      expect(result).toBeInstanceOf(MainService);
      expect(result.optional).toBeUndefined();
    });
  });

  describe('Complex scenarios', () => {
    it('should handle mixed scopes correctly', () => {
      // Arrange
      class SingletonService {
        public id = Math.random();
      }

      class TransientService {
        public id = Math.random();
      }

      class MixedService {
        constructor(
          public singleton: SingletonService,
          public transient: TransientService,
        ) {}
      }

      Reflect.defineMetadata(
        DEPENDENCIES_METADATA_KEY,
        [SingletonService, TransientService],
        MixedService,
      );

      container.register({
        token: SingletonService,
        useClass: SingletonService,
        scope: 'singleton',
      });
      container.register({
        token: TransientService,
        useClass: TransientService,
        scope: 'transient',
      });
      container.register({
        token: MixedService,
        useClass: MixedService,
        scope: 'transient',
      });

      // Act
      const instance1 = container.resolve(MixedService);
      const instance2 = container.resolve(MixedService);

      // Assert
      expect(instance1).not.toBe(instance2); // MixedService is transient
      expect(instance1.singleton).toBe(instance2.singleton); // Same singleton
      expect(instance1.transient).not.toBe(instance2.transient); // Different transients
    });

    it('should resolve factory that depends on class provider', () => {
      // Arrange
      class Config {
        public port = 3000;
      }

      container.register({ token: Config, useClass: Config });
      container.register({
        token: 'server',
        useFactory: (config: Config) => ({
          url: `http://localhost:${config.port}`,
        }),
        inject: [Config],
      });

      // Act
      const result = container.resolve('server');

      // Assert
      expect(result).toEqual({
        url: 'http://localhost:3000',
      });
    });
  });
});
