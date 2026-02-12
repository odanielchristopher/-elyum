import { Constructor, MetadataReader } from '../types';

export class ReflectMetadataReader implements MetadataReader {
  get<TResult = any, TKey = any>(
    metadataKey: TKey,
    target: Constructor<any>,
  ): TResult {
    return Reflect.getMetadata(metadataKey, target) as TResult;
  }

  getAll<TResult extends any[] = any[], TKey = any>(
    metadataKey: TKey,
    targets: Constructor<any>[],
  ): TResult {
    return targets.map((t) => Reflect.getMetadata(metadataKey, t)) as TResult;
  }
}
