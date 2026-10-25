import type { CompiledController } from '@elyum/http';
import type { Request } from 'express';

// Shared by app/Router installations so a parent error middleware can identify
// an error from a mounted controller without changing the error or native request.
export const errorControllers: WeakMap<
  Request,
  { error: unknown; controller: CompiledController }
> = new WeakMap();
