import { INJECT_METADATA_KEY } from '@elyum/constants/shared.constants';
import { InjectionToken } from '@elyum/types/injection-token.type';

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
