# Elyum reference application

## Purpose and status

The private `@elyum/evaluation` package contains four independent order API
baselines: Elyum/Fastify (EF), native Fastify (FN), Elyum/Express (EE), and native
Express (EN). Their normative observable behavior is defined by
[contracts v2](../evaluation/evaluation-contracts-v2.md), with experimental scope
in [protocol v0.2](../evaluation/evaluation-protocol-v0.2.md). The package README
documents initialization, shutdown and checks. `packages/express/examples` remains
a separate adapter example.

This baseline makes the applications available for evaluation; passing functional
tests does not prove low overhead, portability or removability.

## Architectural boundary

Every application has a physically independent production tree under
`packages/evaluation/applications`:

- `domain` owns entities, value semantics, invariants and domain errors;
- `application` owns use cases, ports and application errors;
- `infrastructure` implements in-memory persistence, IDs and time;
- `presentation` owns Zod schemas and controllers or native handlers;
- `fastify` or `express` owns native routing, source hooks/middleware, error
  mapping and lifecycle;
- Elyum `di` or native `composition.ts` owns application assembly.

Domain/application errors do not extend HTTP exceptions. Repositories are
asynchronous ports. Production code is never imported between treatments; only
external tests, fixtures, HTTP clients, scripts and manifests are shared. Native
treatments use manual composition and Zod directly, without decorators, reflection
or Elyum imports. EF/EE retain Elyum DI, validators and controllers.

## Domain and application behavior

An order contains ID, customer ID, immutable item snapshots, creation time,
calculated total in integer cents and status `pending`, `confirmed` or `cancelled`.
Only pending orders transition. Prices come from the product catalog, and repeated
product lines remain independent and preserve input order. Preview calculates
items and total without persistence, IDs or clock calls.

Products contain ID, name, description, positive integer price in cents and
creation time. Names are trimmed and unique without regard to case. Descriptions
are trimmed by the entity. Each new application starts with the catalog frozen
in the functional contract and no orders.

Clock and ID generator are replaceable application ports. Omitted dependencies
use system time and random UUIDs. EF/EE register the ports in a fresh Elyum root;
FN/EN construct their use cases explicitly. No request-scoped container is added.

## HTTP and lifecycle

All eight baseline routes are public:

- `GET /health`;
- `POST /products` and `GET /products`;
- `POST /orders` and `GET /orders`;
- `GET /orders/:id`;
- `PATCH /orders/:id/status`;
- `POST /orders/preview`.

Native Fastify hooks or Express middleware add `X-Request-Source: evaluation`.
Each public entrypoint provides `startApplication({ host, port, logger, clock?,
idGenerator? })` returning `{ baseUrl, close }`. The shared suite uses real HTTP,
loopback, ephemeral ports, fresh state and deterministic cleanup.

Application-owned error handling maps known errors to 400, 404 or 409. Validation
responses project only `field`, `code` and `message`; B3 has a frozen response.
Other error message text is not normative. Unexpected failures continue through
the host-native error pipeline. Native missing-route/malformed-JSON bodies are
outside required body equivalence. Express parser options allow well-formed JSON
to reach the same Zod schema boundary as Fastify.

## Evaluation boundary

Manifests record source provenance, file responsibility, hashes and dependencies.
Automated checks protect production independence and the shared suite boundary.
Measured scenarios, benchmark collection, interpretation, definitive baseline
freeze and academic review remain outside baseline implementation.
