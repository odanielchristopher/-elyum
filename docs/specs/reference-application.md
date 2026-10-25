# Elyum reference application

## Purpose

The reference application is an order API used to demonstrate Elyum through a
non-trivial but controlled business domain. It starts with in-memory storage so
framework behavior, dependency injection, portability, removability, and later
benchmarks are not confused with database latency or ORM behavior.

The application is evidence for the TCC only when the same domain and
application behavior can be exercised through Elyum Fastify, Elyum Express,
and equivalent direct-framework implementations.

The current Fastify order application is stored in `packages/evaluation`
(private `@elyum/evaluation`), renamed from the former examples package without
changing its internal layout or behavior. The four experimental variants are
not implemented yet. `packages/express/examples` is a separate adapter example.

## Architectural boundary

The application follows these dependency directions:

- `domain` owns entities, value semantics, invariants, and domain errors;
- `application` owns use cases, ports, injection tokens, and application errors;
- `infrastructure` implements application ports for persistence, IDs, and time;
- `presentation` owns validation schemas and framework-neutral controllers;
- `fastify` owns the Fastify composition, route registration, hooks, and native
  error mapping;
- `di` is the application composition root.

Domain and application errors must not extend HTTP exceptions. HTTP adapters
map them to native responses at their boundary. Repositories are asynchronous
ports even when the in-memory implementation completes immediately, allowing a
database implementation to replace them without redesigning use cases.

## Order model

An order contains an ID, customer ID, immutable item snapshots, creation time,
calculated total in cents, and one of these states:

- `pending`;
- `confirmed`;
- `cancelled`.

Only a pending order may transition to confirmed or cancelled. Monetary values
use integer cents. The client supplies product IDs and quantities; the create
order use case obtains current prices from the product repository and stores
them in the order item snapshots. The client never supplies the authoritative
order total.

Products contain an ID, name, description, integer price in cents, and creation
time. Product names are unique without regard to casing in the current
in-memory catalog.

## Dependency injection

Repositories, the clock, and the ID generator are application-owned abstract
contracts and use explicit symbol tokens. Their concrete providers are
registered at the composition root and use singleton scope. Concrete use cases
remain discoverable through conservative `@Injectable()` registration.

IDs and time are ports rather than calls embedded in entities. This keeps unit
tests deterministic and makes the business behavior independent from Node.js
and the HTTP framework.

## Initial application capabilities

The reusable core supports:

- creating and listing products;
- creating orders from catalog products;
- reading and listing orders;
- confirming or cancelling a pending order;
- reporting duplicate products, missing products, missing orders, invalid
  entity data, and invalid status transitions through typed errors.

The first HTTP milestone may expose only a subset of these capabilities. Route
coverage can grow without changing the reusable core.

## Fastify registration

The Fastify example currently exposes:

- `POST /products` and `GET /products` as public catalog routes;
- `POST /orders`, `GET /orders`, `GET /orders/:id`, and
  `PATCH /orders/:id/status` as protected order routes.

Protected routes receive the application-owned `authenticate` function through
the native `onRequest` route option passed to `fastify.controller`. The
demonstration credential is `Authorization: Bearer example-token`; it is not a
production authentication design.

The application-owned Elyum `onError` callback maps normalized validation and
known domain/application errors to `400`, `404`, or `409`. Unknown errors are
not converted: they are logged and rethrown by the adapter into Fastify's
native error pipeline.

## Deferred work

- database and ORM integrations;
- authentication implementation beyond a demonstrative native hook;
- Express composition;
- direct Fastify and Express variants for removability comparisons;
- request-scoped state;
- benchmark fixtures and measurements.
