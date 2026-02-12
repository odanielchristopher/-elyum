import { InjectionToken } from './injection-token.type';
import { Provider } from './provider.type';
import { ResolveOptions } from './resolve-options.type';

export interface ContainerDI {
  register<T>(provider: Provider<T>): void;
  resolve<T>(token: InjectionToken<T>, options?: ResolveOptions): T;

  getProvider<T>(token: InjectionToken<T>): Provider<T> | undefined;

  getValue<T>(token: InjectionToken<T>): T | undefined;
  setValue<T>(token: InjectionToken<T>, value: T): void;

  getRoot(): ContainerDI;

  fork(): ContainerDI;
}
