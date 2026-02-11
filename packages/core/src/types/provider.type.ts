import { Constructor } from './constructor.type';
import { InjectionToken } from './injection-token.type';
import { Scope } from './scope.type';

export type Provider<T = any> =
  | {
      token: InjectionToken<T>;
      useClass: Constructor<T>;
      scope?: Scope;
    }
  | {
      token: InjectionToken<T>;
      useValue: any;
      scope?: 'singleton';
    };
