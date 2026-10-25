import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const repositoryRoot = resolve(packageRoot, '../..');
const consumerRoot = await mkdtemp(join(tmpdir(), 'elyum-express-consumer-'));

try {
  await mkdir(join(consumerRoot, 'node_modules/@elyum'), { recursive: true });
  for (const name of ['core', 'http', 'validation', 'express']) {
    await symlink(
      join(repositoryRoot, 'packages', name),
      join(consumerRoot, 'node_modules/@elyum', name),
      'dir',
    );
  }
  for (const name of ['express', '@types']) {
    await symlink(
      join(packageRoot, 'node_modules', name),
      join(consumerRoot, 'node_modules', name),
      'dir',
    );
  }
  // Outside the workspace: no tsconfig paths or Vitest aliases may hide a
  // broken export condition, missing declaration, or non-callable default.
  const source = `
import assert from 'node:assert/strict';
import elyum, { Next } from '@elyum/express';
import { Get } from '@elyum/http';
import express, { type NextFunction } from 'express';

@Get('/health')
class Controller {
  execute(@Next() next: NextFunction) { next(); }
}

const native = express();
const app = elyum(native);
assert.equal(app, native);
app.get('/native/:id', (request, response) => {
  const id: string = request.params.id;
  response.json({ id });
}).controller(Controller);
app.use(app.elyum.errorHandler());
assert.equal(elyum(app), app);
`;
  const inputs = ['cts', 'mts'].map((extension) =>
    join(consumerRoot, `consumer.${extension}`),
  );
  for (const input of inputs) {
    await writeFile(input, source);
  }
  for (const compiler of ['tsc', 'tsc6']) {
    execFileSync(
      compiler,
      [
        '--ignoreConfig',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        '--target',
        'ES2022',
        '--strict',
        '--skipLibCheck',
        '--experimentalDecorators',
        '--emitDecoratorMetadata',
        '--outDir',
        join(consumerRoot, 'output'),
        ...inputs,
      ],
      { stdio: 'inherit' },
    );
  }
  for (const extension of ['cjs', 'mjs']) {
    execFileSync(
      process.execPath,
      [join(consumerRoot, 'output', `consumer.${extension}`)],
      {
        stdio: 'inherit',
      },
    );
  }
  process.stdout.write(
    'CJS and ESM artifact consumers passed with TypeScript 7 and 6, without workspace aliases.\n',
  );
} finally {
  await rm(consumerRoot, { recursive: true, force: true });
}
