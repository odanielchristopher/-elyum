import { ProviderAlreadyRegisteredError } from '@elyum/errors/provider-already-registered.error';
import { ContainerDI } from '@elyum/types/container.contract';
import { DependencyResolver } from '@elyum/types/dependency-resolver.type';
import { InjectionToken } from '@elyum/types/injection-token.type';
import { Provider } from '@elyum/types/provider.type';
import { ResolveOptions } from '@elyum/types/resolve-options.type';

export class ElyumContainer implements ContainerDI {
  private providers = new Map<InjectionToken, Provider>();
  private values = new Map<InjectionToken, any>();

  constructor(
    private readonly dependencyResolver: DependencyResolver,
    readonly parent?: ElyumContainer,
  ) {}

  register<T>(provider: Provider<T>): void {
    if (this.providers.has(provider.token)) {
      throw new ProviderAlreadyRegisteredError(provider.token);
    }

    this.providers.set(provider.token, provider);
  }

  resolve<T>(token: InjectionToken<T>, options?: ResolveOptions): T {
    return this.dependencyResolver.resolve(this, token, options);
  }

  getProvider<T>(token: InjectionToken<T>): Provider<T> | undefined {
    return this.providers.get(token) ?? this.parent?.getProvider(token);
  }

  getValue<T>(token: InjectionToken<T>): T | undefined {
    return this.values.get(token);
  }

  setValue<T>(token: InjectionToken<T>, value: T): void {
    this.values.set(token, value);
  }

  getRoot(): ContainerDI {
    return this.parent ? this.parent.getRoot() : this;
  }

  fork(): ContainerDI {
    return new ElyumContainer(this.dependencyResolver, this);
  }
}
