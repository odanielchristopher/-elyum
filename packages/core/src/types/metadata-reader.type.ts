import { Constructor } from './constructor.type';

export interface MetadataReader {
  get<TResult = any, TKey = any>(
    metadataKey: TKey,
    target: Constructor<any>,
  ): TResult;

  getAll<TResult extends any[] = any[], TKey = any>(
    metadataKey: TKey,
    targets: Constructor<any>[],
  ): TResult;
}
