/**
 * Tipo de função handler de rota
 *
 * Handler pode retornar qualquer valor ou Promise
 */
export type RouteHandler = (...args: any[]) => any | Promise<any>;
