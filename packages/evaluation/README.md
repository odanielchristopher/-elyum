# Evaluation baseline

Four independent implementations of the order API follow the
[functional contract v2](../../docs/evaluation/evaluation-contracts-v2.md) and
[protocol v0.2](../../docs/evaluation/evaluation-protocol-v0.2.md).

| ID  | Production root                   | Composition and HTTP                                    |
| --- | --------------------------------- | ------------------------------------------------------- |
| EF  | `applications/elyum-fastify/src`  | Elyum DI/controllers, native Fastify plugin/hooks       |
| FN  | `applications/fastify-native/src` | Manual composition, native Fastify handlers, direct Zod |
| EE  | `applications/elyum-express/src`  | Elyum DI/controllers, native Express middleware         |
| EN  | `applications/express-native/src` | Manual composition, native Express handlers, direct Zod |

Each root owns its domain, application ports/use cases, in-memory infrastructure,
validation schemas, HTTP integration, startup and shutdown. There are no shared
production modules or imports between applications. EE was copied from EF; EN
was copied from FN. Only tests, fixtures, HTTP clients, scripts and manifests are
shared. The shared client uses `fetch`; it is not a production HTTP layer.

## Build and run

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @elyum/evaluation... build
HOST=127.0.0.1 PORT=3000 pnpm --filter @elyum/evaluation start:ef
HOST=127.0.0.1 PORT=3001 pnpm --filter @elyum/evaluation start:fn
HOST=127.0.0.1 PORT=3002 pnpm --filter @elyum/evaluation start:ee
HOST=127.0.0.1 PORT=3003 pnpm --filter @elyum/evaluation start:en
```

Run one application per terminal. SIGINT/SIGTERM closes its server. `start` and
`dev` select EF. The four public `src/index.ts` entrypoints export
`startApplication({ host, port, logger, clock?, idGenerator? })`, returning
`{ baseUrl, close }`. Port `0` selects an ephemeral port. The native
`buildApplication` is also exported for application-local tests; the shared
suite consumes only `startApplication`.

Every new instance owns a fresh catalog and order repository. Default
dependencies use system time and random UUIDs; tests can provide objects with
`now(): Date` and `generate(): string`. Startup does not consume those objects.
All baseline routes are public. The source header is supplied by native hooks
or middleware. Express uses `json({ strict: false })` so well-formed scalar JSON
is rejected by the same Zod object schemas as in Fastify. Malformed JSON and
missing-route response bodies remain host-specific.

## Validation

```sh
pnpm --filter @elyum/evaluation test:ci
pnpm --filter @elyum/evaluation check:boundaries
pnpm --filter @elyum/evaluation check:manifests
pnpm --filter @elyum/evaluation check:origins
pnpm test:ci
pnpm typecheck
pnpm typecheck:ts6
pnpm ci:lint
pnpm build
git diff --check
```

`test:ci` first builds the evaluation package and its dependencies. The shared
HTTP tests load the emitted entrypoints to exercise actual constructor metadata,
without importing controllers or application services. Every case creates new
state, uses loopback TCP and closes the server in `finally`.

The common matrix covers success, validation boundaries, normalized failures,
known application/domain errors, transitions, catalog pricing, duplicate lines,
unknown-field stripping, deterministic dependencies, preview side effects,
instance reset, defaults and socket cleanup. Lists are compared by identity;
order lines preserve input order. Outside B3, error message text is required but
is not compared. B1–B3 compare raw bodies, statuses and normative headers.

## Inventories and dependency boundaries

- `manifests/applications.json`: file inventories, external production packages,
  allowed dependencies and the explicitly empty set of shared production code.
- `manifests/component-map.json`: responsibility, current SHA-256, semantic
  EF→EE/FN→EN mapping and static dependency reachability for the P1 slice.
- `manifests/provenance.json`: original source commit/path/hash and copy/adaptation
  origin for each file.
- `manifests/ef-structural-origin.json`: unchanged record of the original EF move.

The startup graph includes combined route-registration and composition modules,
including dependencies also used by routes outside P1. The inventory keeps those
whole files; it does not split them to improve a comparison. `main.ts` is a CLI
launcher and is outside the graph used by the external harness.

The boundary check parses static imports, re-exports, import types, `require()`
and dynamic imports. Non-literal module loading is rejected. The common harness
has one audited registry of literal public entrypoint paths. Negative checker
tests exercise the forbidden dependency cases. Native production cannot import
Elyum or the opposite HTTP host; no production tree may import outside itself.

`check:manifests` verifies current inventories/hashes/graphs and needs no Git
history, so it works in a shallow CI checkout. `check:origins` additionally
verifies recorded source hashes against historical Git objects and requires
those commits. After an intentional source change, review the boundary check
and regenerate with `pnpm --filter @elyum/evaluation manifests:update`; commit
the reviewed source and manifests together. Regeneration also requires history.

These are baseline functional checks and inventories. They do not run a load
generator, calculate experimental metrics, create a tag or produce experimental
results. Human review and protocol freeze remain separate steps.
