import { Constructor } from '@elyum/types/constructor.type';
import { MetadataReader } from '@elyum/types/metadata-reader.type';

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
