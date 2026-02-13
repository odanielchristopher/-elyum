import { AsyncLocalStorage } from 'node:async_hooks';

export type ExecutionContextStore = Record<string, any>;

export class ExecutionContext {
  private static readonly storage =
    new AsyncLocalStorage<ExecutionContextStore>();

  static run<S extends ExecutionContextStore, R>(store: S, fn: () => R): R {
    return this.storage.run(store, fn);
  }

  static getStore<
    S extends ExecutionContextStore = ExecutionContextStore,
  >(): S {
    const store = this.storage.getStore();

    if (!store) {
      throw new Error('ExecutionContext is not available in current scope.');
    }

    return store as S;
  }

  static get<V>(key: string): V | undefined {
    const store = this.storage.getStore();
    return store?.[key];
  }

  static getOrThrow<V>(key: string): V {
    if (!this.has(key)) {
      throw new Error(`ExecutionContext key '${key}' is not defined.`);
    }

    return this.get<V>(key) as V;
  }

  static set<V>(key: string, value: V): void {
    const store = this.getStore();
    store[key] = value;
  }

  static has(key: string): boolean {
    const store = this.storage.getStore();
    return !!store && key in store;
  }
}
