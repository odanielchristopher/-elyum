import { createRequire } from 'node:module';
import path from 'node:path';

export type Variant =
  | 'elyum-fastify'
  | 'fastify-native'
  | 'elyum-express'
  | 'express-native';
export type StartOptions = {
  host: string;
  port: number;
  logger: boolean;
  clock?: { now(): Date };
  idGenerator?: { generate(): string };
};
export type RunningApplication = { baseUrl: string; close(): Promise<void> };
export type StartApplication = (
  options: StartOptions,
) => Promise<RunningApplication>;

const load = createRequire(path.resolve(__dirname, '../../package.json'));
const entrypoints: Record<Variant, string> = {
  'elyum-fastify': path.resolve(
    __dirname,
    '../../dist/elyum-fastify/src/index.js',
  ),
  'fastify-native': path.resolve(
    __dirname,
    '../../dist/fastify-native/src/index.js',
  ),
  'elyum-express': path.resolve(
    __dirname,
    '../../dist/elyum-express/src/index.js',
  ),
  'express-native': path.resolve(
    __dirname,
    '../../dist/express-native/src/index.js',
  ),
};

/** Load the tsc output so decorator metadata is exercised as in production. */
export function loadApplication(variant: Variant): StartApplication {
  const entry = load(entrypoints[variant]) as {
    startApplication: StartApplication;
  };
  return entry.startApplication;
}

export async function withApplication(
  variant: Variant,
  run: (baseUrl: string) => Promise<void>,
  dependencies: Pick<StartOptions, 'clock' | 'idGenerator'> = {},
): Promise<void> {
  const app = await loadApplication(variant)({
    host: '127.0.0.1',
    port: 0,
    logger: false,
    ...dependencies,
  });
  try {
    await run(app.baseUrl);
  } finally {
    await app.close();
  }
}

export function request(
  baseUrl: string,
  route: string,
  method = 'GET',
  body?: unknown,
) {
  return fetch(`${baseUrl}${route}`, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
    signal: AbortSignal.timeout(5000),
  });
}
