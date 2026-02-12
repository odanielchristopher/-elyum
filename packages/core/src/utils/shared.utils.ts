import { INJECTABLE_META_KEY } from '../constants/shared.constants';
import { ClassProvider, Constructor } from '../types';
import { FactoryProvider, Provider } from '../types/provider.type';

export function isClassProvider(p: Provider): p is ClassProvider {
  return 'useClass' in p;
}

export function isFactoryProvider(p: Provider): p is FactoryProvider {
  return 'useFactory' in p;
}

export const isInjectable = (target: Constructor) => {
  return Reflect.getMetadata(INJECTABLE_META_KEY, target) ?? false;
};
