import {
  INJECT_METADATA_KEY,
  OPTIONAL_METADATA_KEY,
} from '../constants/shared.constants';
import { InjectionToken } from '../types';

/**
 * Marca parâmetro como injeção opcional
 * Se o provider não for encontrado, retorna undefined ao invés de lançar erro
 *
 * @example
 * class UserService {
 *   constructor(@OptionalInject('Logger') private logger?: Logger) {}
 * }
 */
export function OptionalInject<T>(
  token: InjectionToken<T>,
): ParameterDecorator {
  return (target, _key, index) => {
    Reflect.defineMetadata(INJECT_METADATA_KEY(index), token, target);
    Reflect.defineMetadata(OPTIONAL_METADATA_KEY(index), true, target);
  };
}
