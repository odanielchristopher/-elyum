export type HttpHeaders = Readonly<Record<string, string | readonly string[]>>;

/** Structured result returned by a controller. */
export interface HttpResult<TBody = unknown> {
  statusCode: number;
  body?: TBody;
  headers?: HttpHeaders;
}

/** Supported controller return modes. */
export type ControllerResult<TBody = unknown> =
  | HttpResult<TBody>
  | TBody
  | void;
