import 'reflect-metadata';

import { createServer } from 'node:http';

import elyum, { type ElyumExpress } from '@elyum/express';
import express, { type ErrorRequestHandler, type Express } from 'express';

import type { Clock } from '../application/contracts/clock';
import type { IdGenerator } from '../application/contracts/id-generator';
import { createContainer } from '../di/container';

import { handleApplicationError } from './application-error.handler';
import { registerRoutes } from './routes';

export function buildApplication(
  dependencies: { clock?: Clock; idGenerator?: IdGenerator } = {},
  logger = false,
): ElyumExpress<Express> {
  const native = express();
  native.use((request, response, next) => {
    response.setHeader('X-Request-Source', 'evaluation');
    if (logger)
      response.on('finish', () =>
        process.stdout.write(
          `${request.method} ${request.path} ${response.statusCode}\n`,
        ),
      );
    next();
  });
  const app = elyum(native, {
    json: {},
    container: createContainer(dependencies),
    autoRegisterDependencies: true,
    onError: handleApplicationError,
  });
  registerRoutes(app);
  app.use(app.elyum.errorHandler());
  const fallback: ErrorRequestHandler = (
    error: unknown,
    _request,
    response,
    next,
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    const malformedJson =
      error instanceof SyntaxError && 'status' in error && error.status === 400;
    response.status(malformedJson ? 400 : 500).json({
      code: malformedJson ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
      message: malformedJson ? 'Invalid JSON' : 'Internal server error',
    });
  };
  app.use(fallback);
  return app;
}

export async function startApplication(options: {
  host: string;
  port: number;
  logger: boolean;
  clock?: Clock;
  idGenerator?: IdGenerator;
}): Promise<{ baseUrl: string; close(): Promise<void> }> {
  const app = buildApplication(
    {
      ...(options.clock ? { clock: options.clock } : {}),
      ...(options.idGenerator ? { idGenerator: options.idGenerator } : {}),
    },
    options.logger,
  );
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Expected a TCP server address.');
  let closing: Promise<void> | undefined;
  return {
    baseUrl: `http://${options.host}:${address.port}`,
    close() {
      closing ??= new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      });
      return closing;
    },
  };
}
