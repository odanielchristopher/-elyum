import {
  DEPENDENCIES_METADATA_KEY,
  INJECTABLE_META_KEY,
  INJECT_METADATA_KEY,
  OPTIONAL_METADATA_KEY,
  PROVIDER_TOKEN_METADATA_KEY,
  SCOPE_METADATA_KEY,
} from '../constants/shared.constants';
import {
  CircularDependencyError,
  DependencyRegistrationError,
} from '../errors';
import {
  ClassProvider,
  Constructor,
  ContainerDI,
  FactoryProvider,
  InjectionToken,
  MetadataReader,
  Provider,
  RegisterDependenciesOptions,
  Scope,
} from '../types';
import { isClassProvider, isFactoryProvider } from '../utils/shared.utils';

import { ReflectMetadataReader } from './reflect-metadata-reader.di';

interface RegistrationState {
  readonly allowedScopes?: ReadonlySet<Scope>;
  readonly candidates: Map<InjectionToken, ClassProvider>;
  readonly root: Constructor;
  readonly visited: Set<InjectionToken>;
  readonly visiting: Set<InjectionToken>;
}

/**
 * Discovers injectable class dependencies and registers them in an existing
 * container. Discovery and validation complete before the container is
 * mutated, so a failure never leaves a partially registered graph.
 */
export class DependencyRegister {
  private readonly metadataReader: MetadataReader;

  constructor(
    private readonly container: ContainerDI,
    metadataReader: MetadataReader = new ReflectMetadataReader(),
  ) {
    this.metadataReader = metadataReader;
  }

  registerDependencies(
    root: Constructor,
    options: RegisterDependenciesOptions = {},
  ): void {
    const state: RegistrationState = {
      ...(options.allowedScopes
        ? { allowedScopes: new Set(options.allowedScopes) }
        : {}),
      candidates: new Map(),
      root,
      visited: new Set(),
      visiting: new Set(),
    };

    this.visitClass(root, root, [root], state);

    for (const provider of state.candidates.values()) {
      this.container.register(provider);
    }
  }

  private visitClass(
    node: InjectionToken,
    target: Constructor,
    path: readonly InjectionToken[],
    state: RegistrationState,
  ): void {
    if (state.visiting.has(node)) {
      throw new CircularDependencyError([...path, node]);
    }

    if (state.visited.has(node)) return;

    state.visiting.add(node);

    const dependencies = this.readDependencies(target, path, state);
    dependencies.forEach((reflectedType, index) => {
      const explicitToken = this.metadataReader.get<InjectionToken | undefined>(
        INJECT_METADATA_KEY(index),
        target,
      );
      const token = explicitToken ?? reflectedType;
      const dependencyPath = [...path, token];
      const optional =
        this.metadataReader.get<boolean | undefined>(
          OPTIONAL_METADATA_KEY(index),
          target,
        ) ?? false;

      if (
        optional &&
        !this.container.getProvider(token) &&
        !state.candidates.has(token)
      ) {
        return;
      }

      this.visitToken(token, dependencyPath, state);
    });

    state.visiting.delete(node);
    state.visited.add(node);
  }

  private visitToken(
    token: InjectionToken,
    path: readonly InjectionToken[],
    state: RegistrationState,
  ): void {
    if (state.visiting.has(token)) {
      throw new CircularDependencyError([...path]);
    }

    const provider =
      this.container.getProvider(token) ?? state.candidates.get(token);

    if (provider) {
      this.visitProvider(token, provider, path, state);
      return;
    }

    if (typeof token !== 'function') {
      throw this.createError(
        state,
        token,
        'unregistered_token',
        path,
        `token '${String(token)}' has no registered provider and its implementation cannot be inferred.`,
        'Register a value, class, or factory provider for this token before registering the root class.',
      );
    }

    if (!this.metadataReader.get<boolean>(INJECTABLE_META_KEY, token)) {
      throw this.createError(
        state,
        token,
        'non_injectable_dependency',
        path,
        `class '${token.name || '[Anonymous Class]'}' is not marked with @Injectable().`,
        'Add @Injectable() to the class or register its provider explicitly.',
      );
    }

    const configuredToken = this.metadataReader.get<InjectionToken | undefined>(
      PROVIDER_TOKEN_METADATA_KEY,
      token,
    );
    if (configuredToken !== undefined && configuredToken !== token) {
      throw this.createError(
        state,
        token,
        'custom_token_requires_provider',
        path,
        `class '${token.name || '[Anonymous Class]'}' declares a custom injection token.`,
        'Register the class provider explicitly under that token and inject the token with @Inject().',
      );
    }

    const scope =
      this.metadataReader.get<Scope | undefined>(SCOPE_METADATA_KEY, token) ??
      'singleton';
    this.assertScopeAllowed(token, scope, path, state);

    const candidate: ClassProvider = {
      token,
      useClass: token,
      scope,
    };
    state.candidates.set(token, candidate);
    this.visitProvider(token, candidate, path, state);
  }

  private visitProvider(
    token: InjectionToken,
    provider: Provider,
    path: readonly InjectionToken[],
    state: RegistrationState,
  ): void {
    if (state.visited.has(token)) return;

    if (isClassProvider(provider)) {
      this.assertScopeAllowed(
        token,
        provider.scope ?? 'singleton',
        path,
        state,
      );
      this.visitClass(token, provider.useClass, path, state);
      return;
    }

    if (isFactoryProvider(provider)) {
      this.assertScopeAllowed(
        token,
        provider.scope ?? 'singleton',
        path,
        state,
      );
      this.visitFactory(token, provider, path, state);
      return;
    }

    state.visited.add(token);
  }

  private visitFactory(
    token: InjectionToken,
    provider: FactoryProvider,
    path: readonly InjectionToken[],
    state: RegistrationState,
  ): void {
    if (state.visiting.has(token)) {
      throw new CircularDependencyError([...path, token]);
    }

    state.visiting.add(token);
    for (const dependency of provider.inject ?? []) {
      this.visitToken(dependency, [...path, dependency], state);
    }
    state.visiting.delete(token);
    state.visited.add(token);
  }

  private readDependencies(
    target: Constructor,
    path: readonly InjectionToken[],
    state: RegistrationState,
  ): readonly Constructor[] {
    const dependencies = this.metadataReader.get<Constructor[] | undefined>(
      DEPENDENCIES_METADATA_KEY,
      target,
    );

    if (!dependencies && target.length > 0) {
      throw this.createError(
        state,
        target,
        'metadata_unavailable',
        path,
        `constructor metadata for '${target.name || '[Anonymous Class]'}' is unavailable.`,
        'Enable emitDecoratorMetadata and decorate the class, or register its dependencies explicitly.',
      );
    }

    return dependencies ?? [];
  }

  private assertScopeAllowed(
    token: InjectionToken,
    scope: Scope,
    path: readonly InjectionToken[],
    state: RegistrationState,
  ): void {
    if (!state.allowedScopes || state.allowedScopes.has(scope)) return;

    throw this.createError(
      state,
      token,
      'unsupported_scope',
      path,
      `provider uses the unsupported '${scope}' scope.`,
      `Use one of the allowed scopes (${[...state.allowedScopes].join(', ')}) or resolve the graph through an integration that supports '${scope}'.`,
    );
  }

  private createError(
    state: RegistrationState,
    dependency: InjectionToken,
    reason: ConstructorParameters<typeof DependencyRegistrationError>[2],
    path: readonly InjectionToken[],
    problem: string,
    resolution: string,
  ): DependencyRegistrationError {
    return new DependencyRegistrationError(
      state.root,
      dependency,
      reason,
      path,
      problem,
      resolution,
    );
  }
}
