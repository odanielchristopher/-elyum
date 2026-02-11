import { ContainerDI } from './container.contract';
import { InjectionToken } from './injection-token.type';
import { ResolveOptions } from './resolve-options.type';

export interface DependencyResolver {
  resolve<T>(
    container: ContainerDI,
    token: InjectionToken<T>,
    options?: ResolveOptions,
  ): T;
}
