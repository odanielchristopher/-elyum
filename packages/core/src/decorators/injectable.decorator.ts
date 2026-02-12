import {
  INJECTABLE_META_KEY,
  PROVIDER_TOKEN_METADATA_KEY,
  SCOPE_METADATA_KEY,
} from '../constants/shared.constants';
import { InjectionToken, Scope } from '../types';

export type InjectableOptions = {
  /** Token customizado para identificar o provider */
  token?: InjectionToken;
  /** Escopo de vida da instância (default: singleton) */
  scope?: Scope;
};

/**
 * Marca classe como injetável no container de DI
 *
 * @example
 * // Simples (usa a própria classe como token, singleton)
 * @Injectable()
 * class UserService {}
 *
 * // Com escopo customizado
 * @Injectable({ scope: 'transient' })
 * class RequestLogger {}
 *
 * // Com token customizado (útil para interfaces)
 * @Injectable({ token: 'IUserService' })
 * class UserServiceImpl implements IUserService {}
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(PROVIDER_TOKEN_METADATA_KEY, options.token, target);
    Reflect.defineMetadata(SCOPE_METADATA_KEY, options.scope, target);
    Reflect.defineMetadata(INJECTABLE_META_KEY, true, target);
  };
}
