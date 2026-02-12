import { INJECTABLE_META_KEY } from '@elyum/constants/shared.constants';
import { Constructor } from '@elyum/types/constructor.type';
import {
  ClassProvider,
  FactoryProvider,
  Provider,
} from '@elyum/types/provider.type';

export function isClassProvider(p: Provider): p is ClassProvider {
  return 'useClass' in p;
}

export function isFactoryProvider(p: Provider): p is FactoryProvider {
  return 'useFactory' in p;
}

export const isInjectable = (target: Constructor) => {
  return Reflect.getMetadata(INJECTABLE_META_KEY, target) ?? false;
};
