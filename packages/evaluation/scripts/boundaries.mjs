import { readdir, readFile } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import path from 'node:path';

import ts from 'typescript';

export const APPLICATIONS = [
  {
    id: 'EF',
    directory: 'elyum-fastify',
    host: 'fastify',
    allowedPackages: [
      '@elyum/core',
      '@elyum/fastify',
      '@elyum/http',
      '@elyum/validation',
      '@elyum/validation-zod',
      'fastify',
      'reflect-metadata',
      'zod',
    ],
  },
  {
    id: 'FN',
    directory: 'fastify-native',
    host: 'fastify',
    allowedPackages: ['fastify', 'zod'],
  },
  {
    id: 'EE',
    directory: 'elyum-express',
    host: 'express',
    allowedPackages: [
      '@elyum/core',
      '@elyum/express',
      '@elyum/http',
      '@elyum/validation',
      '@elyum/validation-zod',
      'express',
      'reflect-metadata',
      'zod',
    ],
  },
  {
    id: 'EN',
    directory: 'express-native',
    host: 'express',
    allowedPackages: ['express', 'zod'],
  },
];
const builtins = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`]),
);
const sharedDirectories = [
  'tests/acceptance/',
  'tests/equivalence/',
  'tests/helpers/',
  'tests/fixtures/',
];
const loaderFile = 'tests/helpers/application.helper.ts';
const publicEntries = APPLICATIONS.map(
  (app) => `../../dist/${app.directory}/src/index.js`,
);

export function packageName(specifier) {
  return specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : specifier.split('/')[0];
}

/** Extract import/export, require(), dynamic import and import-type dependencies. */
export function dependencies(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const imports = [];
  const computed = [];
  const literals = [];
  function add(node) {
    if (node && ts.isStringLiteralLike(node)) {
      imports.push(node.text);
    } else {
      computed.push('Non-literal module loading');
    }
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) {
        add(node.moduleSpecifier);
      }
    } else if (ts.isExternalModuleReference(node)) {
      add(node.expression);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument)
    ) {
      add(node.argument.literal);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      add(node.arguments[0]);
    }
    if (ts.isStringLiteralLike(node)) {
      literals.push(node.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { imports: [...new Set(imports)], computed, literals };
}

export function auditSource(file, text) {
  const issues = [];
  const app = APPLICATIONS.find((item) =>
    file.startsWith(`applications/${item.directory}/src/`),
  );
  const shared = sharedDirectories.some((directory) =>
    file.startsWith(directory),
  );
  if (!app && !shared) {
    return issues;
  }
  const root = app ? `applications/${app.directory}/src/` : 'tests/';
  const found = dependencies(file, text);
  for (const issue of found.computed) {
    issues.push(`${file}: ${issue}`);
  }
  for (const specifier of found.imports) {
    if (specifier.startsWith('.')) {
      const target = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), specifier),
      );
      if (!target.startsWith(root)) {
        issues.push(`${file}: dependency escapes ${root}: ${specifier}`);
      }
      // Shared code cannot reach package-local tests that may import internals.
      if (
        shared &&
        !sharedDirectories.some((directory) =>
          `${target}/`.startsWith(directory),
        )
      ) {
        issues.push(
          `${file}: shared suite imports outside its boundary: ${specifier}`,
        );
      }
    } else if (specifier.startsWith('/')) {
      issues.push(`${file}: absolute module path: ${specifier}`);
    } else if (
      app &&
      !builtins.has(specifier) &&
      !app.allowedPackages.includes(packageName(specifier))
    ) {
      issues.push(`${file}: package not allowed in ${app.id}: ${specifier}`);
    } else if (
      shared &&
      !builtins.has(specifier) &&
      packageName(specifier) !== 'vitest'
    ) {
      issues.push(
        `${file}: shared suite imports a production/framework dependency: ${specifier}`,
      );
    }
  }
  if (
    app &&
    found.imports.some((specifier) => packageName(specifier) === 'node:module')
  ) {
    issues.push(`${file}: production module-loader escape hatch is forbidden`);
  }
  if (
    shared &&
    file !== loaderFile &&
    found.imports.some((specifier) => specifier === 'node:module')
  ) {
    issues.push(
      `${file}: only the public entrypoint loader may load built application modules`,
    );
  }
  for (const literal of found.literals) {
    if (
      shared &&
      /(?:applications\/|dist\/)/.test(literal) &&
      !(file === loaderFile && publicEntries.includes(literal))
    ) {
      issues.push(
        `${file}: shared suite references an application internal: ${literal}`,
      );
    }
  }
  if (file === loaderFile) {
    for (const entry of publicEntries) {
      if (!found.literals.includes(entry)) {
        issues.push(`${file}: missing literal public entrypoint ${entry}`);
      }
    }
  }
  return issues;
}

export async function sourceFiles(root, directory = '') {
  const files = [];
  for (const entry of (
    await readdir(path.join(root, directory), { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.posix.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Source symlinks are not allowed: ${name}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(root, name)));
    } else if (
      /\.(?:[cm]?[jt]s|tsx)$/.test(entry.name) &&
      !/\.d\.[cm]?ts$/.test(entry.name)
    ) {
      files.push(name);
    }
  }
  return files;
}

export async function auditRepository(root) {
  const issues = [];
  for (const directory of ['applications', 'tests']) {
    for (const file of await sourceFiles(path.join(root, directory))) {
      const relative = path.posix.join(directory, file);
      issues.push(
        ...auditSource(
          relative,
          await readFile(path.join(root, relative), 'utf8'),
        ),
      );
    }
  }
  return issues;
}
