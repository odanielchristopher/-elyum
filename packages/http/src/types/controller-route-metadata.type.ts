import { HttpMethod } from './http-method.type';

export interface ControllerRouteMetadata {
  method: HttpMethod;
  path: string;
  handler?: string;
}

export interface RouteDecoratorOptions {
  handler?: string;
}

export interface RouteOptions extends RouteDecoratorOptions {
  method: HttpMethod;
  path?: string;
}
