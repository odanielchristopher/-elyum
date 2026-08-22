import { ElyumError, ErrorCode } from '@elyum/core';

export type ControllerCompilationReason =
  | 'ambiguous_handler'
  | 'duplicate_param_index'
  | 'handler_not_found'
  | 'invalid_handler'
  | 'invalid_param_metadata'
  | 'invalid_route'
  | 'multiple_routes'
  | 'route_not_found';

export class ControllerCompilationError extends ElyumError {
  override readonly code = ErrorCode.ELYUM_HTTP_CONTROLLER_COMPILATION;

  constructor(
    readonly controllerName: string,
    readonly reason: ControllerCompilationReason,
    problem: string,
    resolution: string,
  ) {
    super(
      `Controller '${controllerName}' cannot be compiled: ${problem} ${resolution}`,
    );
  }
}
