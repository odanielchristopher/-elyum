import { Constructor } from './constructor.type';
import { InjectionToken } from './injection-token.type';
import { Scope } from './scope.type';

export type ClassProvider<T = any> = {
  token: InjectionToken<T>;
  useClass: Constructor<T>;
  scope?: Scope;
};

export type ValueProvider<T = any> = {
  token: InjectionToken<T>;
  useValue: T;
};

export type FactoryProvider<T = any> = {
  token: InjectionToken<T>;
  useFactory: (...args: any[]) => T;
  inject?: InjectionToken[];
  scope?: Scope;
};

export type Provider<T = any> =
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>;
