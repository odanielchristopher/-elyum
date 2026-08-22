export type HttpHeaders = Readonly<Record<string, string | readonly string[]>>;

const HTTP_RESULT_BRAND: unique symbol = Symbol('elyum.http-result');

export interface HttpResultOptions<TBody = unknown> {
  statusCode: number;
  body?: TBody;
  headers?: HttpHeaders;
}

/** Unambiguous structured result returned by a controller. */
export interface HttpResult<TBody = unknown> {
  readonly [HTTP_RESULT_BRAND]: true;
  readonly statusCode: number;
  readonly body?: TBody;
  readonly headers?: HttpHeaders;
}

export function httpResult<TBody = unknown>(
  options: HttpResultOptions<TBody>,
): HttpResult<TBody> {
  return Object.freeze({
    ...options,
    [HTTP_RESULT_BRAND]: true as const,
  });
}

export function isHttpResult(value: unknown): value is HttpResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    HTTP_RESULT_BRAND in value &&
    (value as HttpResult)[HTTP_RESULT_BRAND] === true
  );
}

/** Supported controller return modes. */
export type ControllerResult<TBody = unknown> =
  | HttpResult<TBody>
  | TBody
  | void;
