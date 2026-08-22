import { CONTROLLER_ROUTES_METADATA_KEY } from '../constants/metadata-keys.constants';
import {
  ControllerRouteMetadata,
  HttpMethod,
  RouteDecoratorOptions,
  RouteOptions,
} from '../types';

export function Route({
  method,
  path = '/',
  handler,
}: RouteOptions): ClassDecorator {
  return (target) => {
    const routes: ControllerRouteMetadata[] =
      Reflect.getOwnMetadata(CONTROLLER_ROUTES_METADATA_KEY, target) ?? [];

    Reflect.defineMetadata(
      CONTROLLER_ROUTES_METADATA_KEY,
      [...routes, { method, path, handler }],
      target,
    );
  };
}

function createRouteDecorator(method: HttpMethod) {
  return (
    path: string = '/',
    options: RouteDecoratorOptions = {},
  ): ClassDecorator => Route({ method, path, ...options });
}

export const Get = createRouteDecorator('GET');
export const Post = createRouteDecorator('POST');
export const Put = createRouteDecorator('PUT');
export const Patch = createRouteDecorator('PATCH');
export const Delete = createRouteDecorator('DELETE');
export const Head = createRouteDecorator('HEAD');
export const Options = createRouteDecorator('OPTIONS');
