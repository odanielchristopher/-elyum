import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditRepository } from './boundaries.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const issues = await auditRepository(root);
if (issues.length) {
  process.stderr.write(`${issues.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    'Application and shared-suite dependency boundaries passed.\n',
  );
}
