import { Constructor } from './constructor.type';

export type InjectionToken<T = any> = string | Constructor<T> | symbol;
