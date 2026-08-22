import { ElyumError, ErrorCode } from '@elyum/core';

import { CompiledController } from '../types';

export type ControllerExecutionReason =
  | 'handler_not_found'
  | 'invalid_controller_instance'
  | 'response_conflict';

export class ControllerExecutionError extends ElyumError {
  override readonly code = ErrorCode.ELYUM_HTTP_CONTROLLER_EXECUTION;

  constructor(
    readonly controllerName: string,
    readonly method: string,
    readonly path: string,
    readonly reason: ControllerExecutionReason,
    problem: string,
    resolution: string,
  ) {
    super(
      `Controller '${controllerName}' cannot execute route ${method} ${path}: ${problem} ${resolution}`,
    );
  }

  static fromController(
    controller: CompiledController,
    reason: ControllerExecutionReason,
    problem: string,
    resolution: string,
  ): ControllerExecutionError {
    return new ControllerExecutionError(
      controller.controllerClass.name || '[Anonymous Controller]',
      controller.method,
      controller.path,
      reason,
      problem,
      resolution,
    );
  }
}
