import { createServer, type Server } from 'node:http';

import type { Application } from 'express';
import { afterEach } from 'vitest';

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.closeAllConnections();
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

export async function serve(app: Application): Promise<string> {
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral TCP address.');
  }
  return `http://127.0.0.1:${address.port}`;
}

export function request(url: string, options: RequestInit = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(4000) });
}
