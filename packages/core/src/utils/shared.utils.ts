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
