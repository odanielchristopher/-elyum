import { InjectionToken } from '@elyum/types/injection-token.type';
import { Provider } from '@elyum/types/provider.type';
import { ResolveOptions } from './resolve-options.type';

export interface ContainerDI {
  register<T>(provider: Provider<T>): void;
  resolve<T>(token: InjectionToken<T>, options?: ResolveOptions): T;
  createScope(): ContainerDI;
}
