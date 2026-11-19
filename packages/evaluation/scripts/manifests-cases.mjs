import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function withCopy(run) {
  const copy = mkdtempSync(path.join(tmpdir(), 'elyum-manifests-'));
  try {
    for (const directory of ['applications', 'tests', 'scripts', 'manifests']) {
      cpSync(path.join(source, directory), path.join(copy, directory), {
        recursive: true,
      });
    }
    symlinkSync(
      path.resolve(source, '../../node_modules'),
      path.join(copy, 'node_modules'),
      'dir',
    );
    run(copy);
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}
function check(copy) {
  return execFileSync(
    process.execPath,
    [path.join(copy, 'scripts/manifests.mjs')],
    { cwd: copy, stdio: 'pipe', encoding: 'utf8' },
  );
}

test('checks the baseline in a copy without Git metadata or historical objects', () => {
  withCopy((copy) => {
    assert.match(check(copy), /manifests match/);
  });
});
test('rejects production bytes that no longer match the recorded hash', () => {
  withCopy((copy) => {
    appendFileSync(
      path.join(
        copy,
        'applications/fastify-native/src/domain/entities/order.entity.ts',
      ),
      '\n// Hash drift fixture.\n',
    );
    assert.throws(
      () => check(copy),
      (error) =>
        error.status === 1 && /Manifest is stale/.test(String(error.stderr)),
    );
  });
});
test('rejects a deleted dependency instead of accepting a stale inventory', () => {
  withCopy((copy) => {
    unlinkSync(
      path.join(
        copy,
        'applications/fastify-native/src/domain/entities/order.entity.ts',
      ),
    );
    assert.throws(
      () => check(copy),
      (error) =>
        error.status === 1 &&
        /Unresolved local import/.test(String(error.stderr)),
    );
  });
});
