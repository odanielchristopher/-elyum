import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';

import {
  APPLICATIONS,
  auditRepository,
  dependencies,
  packageName,
  sourceFiles,
} from './boundaries.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(root, '../..');
const write = process.argv.includes('--write');
const issues = await auditRepository(root);
if (issues.length) {
  throw new Error(issues.join('\n'));
}
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const origins = {
  EF: {
    commit: '305798d1a062e92107e4b6b20b6c1cb7a2989d21',
    root: 'packages/evaluation/src',
    treatment: 'original order API',
  },
  FN: {
    commit: 'eb4fbbcbdbf546ddf6942af0851eccffb5ac490f',
    root: 'packages/evaluation/applications/elyum-fastify/src',
    treatment: 'EF',
  },
  EE: {
    commit: 'a4b6c4e1bfbbd0ca0ad767ea17ccd3e75ab70e3f',
    root: 'packages/evaluation/applications/elyum-fastify/src',
    treatment: 'EF',
  },
  EN: {
    commit: 'a4b6c4e1bfbbd0ca0ad767ea17ccd3e75ab70e3f',
    root: 'packages/evaluation/applications/fastify-native/src',
    treatment: 'FN',
  },
};
const verifyOrigins = write || process.argv.includes('--verify-origins');
const recorded = write
  ? undefined
  : JSON.parse(
      await readFile(path.join(root, 'manifests/provenance.json'), 'utf8'),
    );
const recordedFiles = new Map(
  recorded?.files.map((item) => [item.file, item.origin]),
);

function sourceName(id, relative) {
  if (id === 'EE') {
    return relative
      .replace('express/index.ts', 'fastify/index.ts')
      .replace('express/routes.ts', 'fastify/routes/index.ts')
      .replace(
        'express/application-error.handler.ts',
        'fastify/errors/application-error.handler.ts',
      );
  }
  if (id === 'EN') {
    return relative.replace(/^express\//, 'fastify/');
  }
  if (id === 'FN') {
    return relative
      .replace('composition.ts', 'di/container.ts')
      .replace('presentation/handlers/', 'presentation/controllers/')
      .replace('.handler.ts', '.controller.ts')
      .replace('fastify/routes.ts', 'fastify/routes/index.ts')
      .replace(
        'fastify/application-error.handler.ts',
        'fastify/errors/application-error.handler.ts',
      );
  }
  return relative;
}
function component(relative) {
  if (relative.startsWith('domain/')) {
    return 'domain';
  }
  if (relative.startsWith('application/')) {
    return 'application';
  }
  if (relative.startsWith('infrastructure/')) {
    return 'infrastructure';
  }
  if (relative.startsWith('presentation/')) {
    return 'presentation';
  }
  if (relative.startsWith('di/') || relative === 'composition.ts') {
    return 'composition';
  }
  if (/^(fastify|express)\//.test(relative)) {
    return 'http';
  }
  return 'entrypoint';
}
function resolveImport(from, specifier, files) {
  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(from), specifier),
  );
  const candidates = [
    resolved,
    `${resolved}.ts`,
    `${resolved}/index.ts`,
    resolved.replace(/\.js$/, '.ts'),
  ];
  const target = candidates.find((candidate) => files.has(candidate));
  if (!target) {
    throw new Error(`Unresolved local import ${from} -> ${specifier}`);
  }
  return target;
}
const componentMap = [];
const provenance = [];
const applications = [];
for (const app of APPLICATIONS) {
  const appRoot = `applications/${app.directory}/src`;
  const names = await sourceFiles(path.join(root, appRoot));
  const nameSet = new Set(names);
  const graph = new Map();
  const external = new Set();
  const contents = new Map();
  for (const name of names) {
    const bytes = await readFile(path.join(root, appRoot, name));
    contents.set(name, bytes);
    const imported = dependencies(name, bytes.toString('utf8')).imports;
    graph.set(
      name,
      imported
        .filter((specifier) => specifier.startsWith('.'))
        .map((specifier) => resolveImport(name, specifier, nameSet)),
    );
    for (const specifier of imported.filter(
      (item) => !item.startsWith('.') && !item.startsWith('node:'),
    )) {
      external.add(packageName(specifier));
    }
  }
  const p1 = new Set();
  function traverse(name) {
    if (p1.has(name)) {
      return;
    }
    p1.add(name);
    for (const child of graph.get(name) ?? []) {
      traverse(child);
    }
  }
  traverse('index.ts');
  applications.push({
    ...app,
    root: appRoot,
    publicEntrypoint: `${appRoot}/index.ts`,
    productionDependencies: [...external].sort(),
    files: names.map((name) => `${appRoot}/${name}`),
  });
  for (const name of names) {
    const file = `${appRoot}/${name}`;
    const importedBy = [...graph]
      .filter(([, imports]) => imports.includes(name))
      .map(([parent]) => `${appRoot}/${parent}`)
      .sort();
    const sha256 = hash(contents.get(name));
    componentMap.push({
      application: app.id,
      file,
      component: component(name),
      sha256,
      hostSpecific:
        /^(fastify|express)\//.test(name) ||
        /presentation\/handlers\//.test(name),
      p1: {
        included: p1.has(name),
        reason:
          name === 'index.ts'
            ? 'Public startApplication entrypoint used by the external harness.'
            : p1.has(name)
              ? 'Transitive local import of the startup graph, including shared registration/composition for routes outside the slice.'
              : 'Process launcher; external harness starts through index.ts.',
        importedBy,
      },
    });
    const origin = origins[app.id];
    const sourceFile = `${origin.root}/${sourceName(app.id, name)}`;
    let fileOrigin;
    if (verifyOrigins) {
      // Require history only for regeneration or the explicit provenance audit.
      // An absent file in an existing commit means this concept was newly added.
      execFileSync('git', ['cat-file', '-e', `${origin.commit}^{commit}`], {
        cwd: workspace,
        stdio: 'pipe',
      });
      let sourceBytes;
      try {
        sourceBytes = execFileSync(
          'git',
          ['show', `${origin.commit}:${sourceFile}`],
          { cwd: workspace, stdio: ['ignore', 'pipe', 'ignore'] },
        );
      } catch {
        /* Newly introduced baseline concept. */
      }
      fileOrigin = sourceBytes
        ? {
            treatment: origin.treatment,
            commit: origin.commit,
            file: sourceFile,
            sha256: hash(sourceBytes),
            operation: sourceBytes.equals(contents.get(name))
              ? 'copied'
              : 'adapted',
          }
        : {
            treatment: 'created during baseline implementation',
            sourceContextCommit: origin.commit,
          };
    } else {
      fileOrigin = recordedFiles.get(file);
      if (
        !fileOrigin ||
        (fileOrigin.commit ?? fileOrigin.sourceContextCommit) !==
          origin.commit ||
        (fileOrigin.file && fileOrigin.file !== sourceFile) ||
        (fileOrigin.sha256 && !/^[a-f0-9]{64}$/.test(fileOrigin.sha256))
      ) {
        throw new Error(`Missing or invalid provenance for ${file}`);
      }
    }
    provenance.push({ application: app.id, file, sha256, origin: fileOrigin });
  }
}
const mappings = [];
for (const [sourceId, targetId] of [
  ['EF', 'EE'],
  ['FN', 'EN'],
]) {
  const source = applications.find((app) => app.id === sourceId);
  const target = applications.find((app) => app.id === targetId);
  for (const file of source.files) {
    const relative = file.slice(source.root.length + 1);
    const mappedRelative =
      sourceId === 'EF'
        ? relative
            .replace('fastify/index.ts', 'express/index.ts')
            .replace('fastify/routes/index.ts', 'express/routes.ts')
            .replace(
              'fastify/errors/application-error.handler.ts',
              'express/application-error.handler.ts',
            )
        : relative.replace(/^fastify\//, 'express/');
    const mappedFile = `${target.root}/${mappedRelative}`;
    if (!target.files.includes(mappedFile)) {
      throw new Error(`Missing semantic counterpart: ${file} -> ${mappedFile}`);
    }
    mappings.push({
      pair: `${sourceId}->${targetId}`,
      source: file,
      target: mappedFile,
      component: component(relative),
    });
  }
}
const documents = {
  'applications.json': {
    schemaVersion: 1,
    contract: 'docs/evaluation/evaluation-contracts-v2.md',
    sharedProductionComponents: [],
    sharedArtifacts: [
      'tests/acceptance',
      'tests/equivalence',
      'tests/helpers',
      'tests/fixtures',
      'scripts',
      'manifests',
    ],
    applications,
  },
  'component-map.json': {
    schemaVersion: 1,
    p1: {
      selectedRoutes: [
        'GET /health',
        'POST /orders/preview',
        'POST /orders',
        'GET /orders',
        'GET /orders/:id',
      ],
      rule: 'Reachability through static local imports from each public index.ts. Combined route registration and composition remain whole files. No churn, SLOC or experimental result is calculated.',
    },
    files: componentMap,
    semanticMappings: mappings,
  },
  'provenance.json': {
    schemaVersion: 1,
    baseCommit: origins.EF.commit,
    structuralMoveCommit: 'cbed1164737e1618a0c479774f656c07e14536d8',
    treatmentOrigins: origins,
    files: provenance,
  },
};
for (const [name, document] of Object.entries(documents)) {
  const expected = await format(JSON.stringify(document), {
    parser: 'json',
    trailingComma: 'all',
    singleQuote: true,
  });
  const file = path.join(root, 'manifests', name);
  if (write) {
    await writeFile(file, expected);
  } else if ((await readFile(file, 'utf8')) !== expected) {
    throw new Error(
      `Manifest is stale: ${name}. Review the source change and run pnpm manifests:update.`,
    );
  }
}
process.stdout.write(
  write
    ? 'Baseline inventories, hashes and provenance updated.\n'
    : 'Baseline manifests match the production files and import graph.\n',
);
