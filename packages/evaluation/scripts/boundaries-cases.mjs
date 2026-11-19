import assert from 'node:assert/strict';
import test from 'node:test';

import { auditSource, dependencies } from './boundaries.mjs';

const cases = [
  [
    'FN importing Elyum',
    'applications/fastify-native/src/example.ts',
    "import { Body } from '@elyum/http';",
  ],
  [
    'EN re-exporting Elyum',
    'applications/express-native/src/example.ts',
    "export * from '@elyum/core';",
  ],
  [
    'FN importing Express types',
    'applications/fastify-native/src/example.ts',
    "import type { Request } from 'express';",
  ],
  [
    'EN requiring Fastify',
    'applications/express-native/src/example.ts',
    "const server = require('fastify');",
  ],
  [
    'EF importing Express dynamically',
    'applications/elyum-fastify/src/example.ts',
    "void import('express');",
  ],
  [
    'EE importing Fastify',
    'applications/elyum-express/src/example.ts',
    "import Fastify from 'fastify';",
  ],
  [
    'production importing another application',
    'applications/fastify-native/src/example.ts',
    "import { Order } from '../../elyum-fastify/src/domain/entities/order.entity';",
  ],
  [
    'production importing shared helpers',
    'applications/fastify-native/src/example.ts',
    "import { request } from '../../../tests/helpers/application.helper';",
  ],
  [
    'shared suite importing a controller',
    'tests/acceptance/example.spec.ts',
    "import { Controller } from '../../applications/elyum-fastify/src/presentation/controller';",
  ],
  [
    'shared helper importing a framework',
    'tests/helpers/example.ts',
    "import express from 'express';",
  ],
  [
    'shared suite importing package-local internals tests',
    'tests/acceptance/example.spec.ts',
    "import '../../tests/fastify/order-api.spec';",
  ],
  [
    'computed dynamic import',
    'applications/fastify-native/src/example.ts',
    'void import(packageName);',
  ],
  [
    'absolute production path',
    'applications/fastify-native/src/example.ts',
    "import '/tmp/production.ts';",
  ],
  [
    'native import-type dependency',
    'applications/express-native/src/example.ts',
    "type App = import('fastify').FastifyInstance;",
  ],
];
for (const [label, file, text] of cases) {
  test(`rejects ${label}`, () => {
    assert.ok(auditSource(file, text).length > 0);
  });
}
test('allows direct native host and Zod dependencies', () => {
  assert.deepEqual(
    auditSource(
      'applications/fastify-native/src/example.ts',
      "import Fastify from 'fastify'; import { z } from 'zod'; import { Clock } from './application/contracts/clock';",
    ),
    [],
  );
});
test('allows framework-neutral shared test helpers', () => {
  assert.deepEqual(
    auditSource(
      'tests/acceptance/example.spec.ts',
      "import { expect } from 'vitest'; import { request } from '../helpers/application.helper';",
    ),
    [],
  );
});
test('extracts all static import forms without reading comments as dependencies', () => {
  assert.deepEqual(
    dependencies(
      'example.ts',
      "// import 'express';\nexport * from 'zod'; type X = import('fastify').FastifyInstance; const x = require('node:crypto');",
    ).imports,
    ['zod', 'fastify', 'node:crypto'],
  );
});
