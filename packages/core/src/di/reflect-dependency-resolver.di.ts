import {
  DEPENDENCIES_METADATA_KEY,
  INJECT_METADATA_KEY,
  OPTIONAL_METADATA_KEY,
} from '@elyum/constants/shared.constants';
import { isClassProvider, isFactoryProvider } from '@elyum/utils/shared.utils';

import { CircularDependencyError } from '@elyum/errors/circular-dependency.error';
import { ProviderNotFoundError } from '@elyum/errors/provider-not-found.error';
import { ContainerDI } from '@elyum/types/container.contract';
import { DependencyResolver } from '@elyum/types/dependency-resolver.type';
import { InjectionToken } from '@elyum/types/injection-token.type';
import { MetadataReader } from '@elyum/types/metadata-reader.type';
import { ClassProvider, FactoryProvider } from '@elyum/types/provider.type';
import { ResolveOptions } from '@elyum/types/resolve-options.type';

export class ReflectDependencyResolver implements DependencyResolver {
  constructor(private readonly metadataReader: MetadataReader) {}

  resolve<T>(
    container: ContainerDI,
    token: InjectionToken<T>,
    options: ResolveOptions = { optional: false },
    stack: InjectionToken[] = [],
  ): T {
    if (stack.includes(token)) {
      throw new CircularDependencyError([...stack, token]);
    }

    const provider = container.getProvider(token);

    if (!provider) {
      if (!options?.optional) {
        throw new ProviderNotFoundError(token, stack.at(-1));
      }
      return undefined as T;
    }

    const scope =
      (provider as ClassProvider | FactoryProvider).scope ?? 'singleton';

    // =========================
    // CACHE
    // =========================

    if (scope === 'singleton') {
      const cached = container.getRoot().getValue(token);
      if (cached !== undefined) return cached;
    }

    if (scope === 'request') {
      const cached = container.getValue(token);
      if (cached !== undefined) return cached;
    }

    // =========================
    // CREATION
    // =========================

    let instance: any;

    if (isFactoryProvider(provider)) {
      const deps = provider.inject ?? [];

      const args = deps.map((depToken) =>
        this.resolve(container, depToken, { optional: false }, [
          ...stack,
          token,
        ]),
      );

      instance = provider.useFactory(...args);
    } else if (isClassProvider(provider)) {
      const deps =
        this.metadataReader.get<any[]>(
          DEPENDENCIES_METADATA_KEY,
          provider.useClass,
        ) ?? [];

      const args = deps.map((dep, index) => {
        const depToken =
          this.metadataReader.get<InjectionToken>(
            INJECT_METADATA_KEY(index),
            provider.useClass,
          ) || dep;

        const optional =
          this.metadataReader.get<boolean>(
            OPTIONAL_METADATA_KEY(index),
            provider.useClass,
          ) ?? false;

        return this.resolve(container, depToken, { optional }, [
          ...stack,
          token,
        ]);
      });

      instance = new provider.useClass(...args);
    } else {
      instance = provider.useValue;
    }

    // =========================
    // CACHE STORE
    // =========================

    if (scope === 'singleton') {
      container.getRoot().setValue(token, instance);
    }

    if (scope === 'request') {
      container.setValue(token, instance);
    }

    if (scope === 'transient') {
      return instance as T;
    }

    return instance as T;
  }
}
