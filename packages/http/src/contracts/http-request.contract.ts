/**
 * Framework-agnostic HTTP request abstraction
 *
 * Representa uma requisição HTTP de forma agnóstica,
 * permitindo que adapters (Fastify, Express) convertam
 * suas requisições para este formato
 */
export interface HttpRequest<
  TBody = unknown,
  TQuery = Record<string, unknown>,
  TParams = Record<string, string>,
  THeaders = Record<string, string>,
> {
  /** Request body (já parseado) */
  body: TBody;

  /** Query parameters (?key=value) */
  query: TQuery;

  /** Route parameters (/:id) */
  params: TParams;

  /** Request headers */
  headers: THeaders;

  /** HTTP method (GET, POST, PUT, etc) */
  method: string;

  /** Full URL (/users?page=1) */
  url: string;

  /** Path without query (/users) */
  path?: string;

  /** Client IP address */
  ip?: string;

  /** Protocol (http, https) */
  protocol?: string;

  /** Hostname */
  hostname?: string;

  /** Cookies */
  cookies?: Record<string, string>;

  /** Raw request (framework-specific, use with caution) */
  raw?: any;
}
