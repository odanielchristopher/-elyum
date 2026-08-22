export type ControllerHandler<
  TArgs extends unknown[] = unknown[],
  TResult = unknown,
> = (...args: TArgs) => TResult | Promise<TResult>;

/** Optional convenience contract for controllers using `execute`. */
export interface Controller<
  TArgs extends unknown[] = unknown[],
  TResult = unknown,
> {
  execute(...args: TArgs): TResult | Promise<TResult>;
}

/** Optional convenience contract for controllers using `handler`. */
export interface HandlerController<
  TArgs extends unknown[] = unknown[],
  TResult = unknown,
> {
  handler(...args: TArgs): TResult | Promise<TResult>;
}
