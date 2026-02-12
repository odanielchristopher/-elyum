import { INJECT_METADATA_KEY } from '../constants/shared.constants';
import { InjectionToken } from '../types';

/**
 * Injeta dependência usando token customizado
 *
 * @example
 * class UserService {
 *   constructor(@Inject('IUserRepository') private repo: IUserRepository) {}
 * }
 */
export function Inject<T>(token: InjectionToken<T>): ParameterDecorator {
  return (target, _key, index) => {
    Reflect.defineMetadata(INJECT_METADATA_KEY(index), token, target);
  };
}
