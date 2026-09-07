import { describe, expect, it } from 'vitest';

import {
  CircularDependencyError,
  DependencyRegister,
  DependencyRegistrationError,
  ElyumFactory,
  Inject,
  Injectable,
  OptionalInject,
  type Provider,
} from '@elyum/core';

describe('DependencyRegister', () => {
  it('should register an injectable dependency graph with declared scopes', () => {
    // Arrange
    @Injectable()
    class Repository {}

    @Injectable({ scope: 'transient' })
    class UseCase {
      constructor(readonly repository: Repository) {}
    }

    @Injectable()
    class Root {
      constructor(readonly useCase: UseCase) {}
    }
    Reflect.defineMetadata('design:paramtypes', [Repository], UseCase);
    Reflect.defineMetadata('design:paramtypes', [UseCase], Root);
    const container = ElyumFactory.createRoot();
    const dependencyRegister = new DependencyRegister(container);

    // Act
    dependencyRegister.registerDependencies(Root);

    // Assert
    expect(container.getProvider(Root)).toBeUndefined();
    expect(container.getProvider(UseCase)).toEqual({
      token: UseCase,
      useClass: UseCase,
      scope: 'transient',
    });
    expect(container.getProvider(Repository)).toEqual({
      token: Repository,
      useClass: Repository,
      scope: 'singleton',
    });
  });

  it('should preserve existing providers and discover their class dependencies', () => {
    // Arrange
    @Injectable()
    class Database {}

    class Repository {
      constructor(readonly database: Database) {}
    }

    @Injectable()
    class Root {
      constructor(readonly repository: Repository) {}
    }
    Reflect.defineMetadata('design:paramtypes', [Database], Repository);
    Reflect.defineMetadata('design:paramtypes', [Repository], Root);
    const repositoryProvider: Provider<Repository> = {
      token: Repository,
      useClass: Repository,
      scope: 'transient',
    };
    const container = ElyumFactory.createRoot();
    container.register(repositoryProvider);

    // Act
    new DependencyRegister(container).registerDependencies(Root);

    // Assert
    expect(container.getProvider(Repository)).toBe(repositoryProvider);
    expect(container.getProvider(Database)).toBeDefined();
  });

  it('should traverse existing factory dependencies and stop at values', () => {
    // Arrange
    const FACTORY = Symbol('FACTORY');
    const CONFIG = Symbol('CONFIG');

    @Injectable()
    class Dependency {}

    @Injectable()
    class Root {
      constructor(@Inject(FACTORY) readonly value: unknown) {}
    }
    Reflect.defineMetadata('design:paramtypes', [Object], Root);
    const container = ElyumFactory.createRoot();
    container.register({ token: CONFIG, useValue: { enabled: true } });
    container.register({
      token: FACTORY,
      useFactory: () => ({}),
      inject: [Dependency, CONFIG],
    });

    // Act
    new DependencyRegister(container).registerDependencies(Root);

    // Assert
    expect(container.getProvider(Dependency)).toBeDefined();
    expect(container.getProvider(CONFIG)).toEqual({
      token: CONFIG,
      useValue: { enabled: true },
    });
  });

  it('should leave an absent optional dependency unregistered', () => {
    // Arrange
    @Injectable()
    class OptionalDependency {}

    @Injectable()
    class Root {
      constructor(
        @OptionalInject(OptionalDependency)
        readonly dependency?: OptionalDependency,
      ) {}
    }
    Reflect.defineMetadata('design:paramtypes', [OptionalDependency], Root);
    const container = ElyumFactory.createRoot();

    // Act
    new DependencyRegister(container).registerDependencies(Root);

    // Assert
    expect(container.getProvider(OptionalDependency)).toBeUndefined();
  });

  it('should require explicit registration for string and symbol tokens', () => {
    // Arrange
    const TOKEN = Symbol('Repository');

    @Injectable()
    class Root {
      constructor(@Inject(TOKEN) readonly dependency: unknown) {}
    }
    Reflect.defineMetadata('design:paramtypes', [Object], Root);
    const container = ElyumFactory.createRoot();

    // Act & Assert
    expect(() =>
      new DependencyRegister(container).registerDependencies(Root),
    ).toThrowError(
      expect.objectContaining({
        reason: 'unregistered_token',
        dependency: TOKEN,
      }),
    );
  });

  it('should require explicit registration for a custom injectable token', () => {
    // Arrange
    const TOKEN = Symbol('Dependency');

    @Injectable({ token: TOKEN })
    class Dependency {}

    @Injectable()
    class Root {
      constructor(readonly dependency: Dependency) {}
    }
    Reflect.defineMetadata('design:paramtypes', [Dependency], Root);
    const container = ElyumFactory.createRoot();

    // Act & Assert
    expect(() =>
      new DependencyRegister(container).registerDependencies(Root),
    ).toThrowError(
      expect.objectContaining({ reason: 'custom_token_requires_provider' }),
    );
  });

  it('should reject non-injectable dependencies with an actionable path', () => {
    // Arrange
    class Dependency {}

    @Injectable()
    class Root {
      constructor(readonly dependency: Dependency) {}
    }
    Reflect.defineMetadata('design:paramtypes', [Dependency], Root);
    const container = ElyumFactory.createRoot();

    // Act & Assert
    try {
      new DependencyRegister(container).registerDependencies(Root);
      expect.fail('Expected dependency registration to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(DependencyRegistrationError);
      expect(error).toMatchObject({
        root: Root,
        dependency: Dependency,
        dependencyPath: [Root, Dependency],
        reason: 'non_injectable_dependency',
      });
      expect((error as Error).message).toContain(
        'Add @Injectable() to the class or register its provider explicitly.',
      );
    }
  });

  it('should reject unsupported scopes for discovered and existing providers', () => {
    // Arrange
    @Injectable({ scope: 'scoped' })
    class DiscoveredDependency {}

    @Injectable()
    class DiscoveredRoot {
      constructor(readonly dependency: DiscoveredDependency) {}
    }
    class ExistingDependency {}

    @Injectable()
    class ExistingRoot {
      constructor(readonly dependency: ExistingDependency) {}
    }
    Reflect.defineMetadata(
      'design:paramtypes',
      [DiscoveredDependency],
      DiscoveredRoot,
    );
    Reflect.defineMetadata(
      'design:paramtypes',
      [ExistingDependency],
      ExistingRoot,
    );
    const discoveredContainer = ElyumFactory.createRoot();
    const existingContainer = ElyumFactory.createRoot();
    existingContainer.register({
      token: ExistingDependency,
      useClass: ExistingDependency,
      scope: 'scoped',
    });
    const options = { allowedScopes: ['singleton', 'transient'] as const };

    // Act & Assert
    expect(() =>
      new DependencyRegister(discoveredContainer).registerDependencies(
        DiscoveredRoot,
        options,
      ),
    ).toThrowError(expect.objectContaining({ reason: 'unsupported_scope' }));
    expect(() =>
      new DependencyRegister(existingContainer).registerDependencies(
        ExistingRoot,
        options,
      ),
    ).toThrowError(expect.objectContaining({ reason: 'unsupported_scope' }));
  });

  it('should accept scoped dependencies when no scope restriction is supplied', () => {
    // Arrange
    @Injectable({ scope: 'scoped' })
    class Dependency {}

    @Injectable()
    class Root {
      constructor(readonly dependency: Dependency) {}
    }
    Reflect.defineMetadata('design:paramtypes', [Dependency], Root);
    const container = ElyumFactory.createRoot();

    // Act
    new DependencyRegister(container).registerDependencies(Root);

    // Assert
    expect(container.getProvider(Dependency)).toMatchObject({
      scope: 'scoped',
    });
  });

  it('should detect circular graphs with their complete path', () => {
    // Arrange
    @Injectable()
    class ServiceA {}

    @Injectable()
    class ServiceB {}

    @Injectable()
    class Root {}
    Reflect.defineMetadata('design:paramtypes', [ServiceA], Root);
    Reflect.defineMetadata('design:paramtypes', [ServiceB], ServiceA);
    Reflect.defineMetadata('design:paramtypes', [ServiceA], ServiceB);
    const container = ElyumFactory.createRoot();

    // Act & Assert
    expect(() =>
      new DependencyRegister(container).registerDependencies(Root),
    ).toThrowError(
      new CircularDependencyError([Root, ServiceA, ServiceB, ServiceA]),
    );
  });

  it('should not mutate the container when graph validation fails', () => {
    // Arrange
    @Injectable()
    class ValidDependency {}

    class InvalidDependency {}

    @Injectable()
    class Root {
      constructor(
        readonly valid: ValidDependency,
        readonly invalid: InvalidDependency,
      ) {}
    }
    Reflect.defineMetadata(
      'design:paramtypes',
      [ValidDependency, InvalidDependency],
      Root,
    );
    const container = ElyumFactory.createRoot();

    // Act
    expect(() =>
      new DependencyRegister(container).registerDependencies(Root),
    ).toThrow(DependencyRegistrationError);

    // Assert
    expect(container.getProvider(ValidDependency)).toBeUndefined();
    expect(container.getProvider(InvalidDependency)).toBeUndefined();
  });

  it('should report missing constructor metadata before mutating the container', () => {
    // Arrange
    const Root = class Root {
      constructor(readonly dependency: object) {}
    };
    Reflect.defineMetadata('provider:injectable', true, Root);
    const container = ElyumFactory.createRoot();

    // Act & Assert
    expect(() =>
      new DependencyRegister(container).registerDependencies(Root),
    ).toThrowError(expect.objectContaining({ reason: 'metadata_unavailable' }));
  });
});
