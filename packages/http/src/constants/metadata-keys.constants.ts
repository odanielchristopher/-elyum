/**
 * Chaves de metadata para decorators HTTP
 */

/** Prefix da rota do resource (@Resource('/users')) */
export const RESOURCE_PATH_METADATA_KEY = 'http:resource:path';

/** Rotas de um resource (todas as @Get, @Post, etc) */
export const ROUTES_METADATA_KEY = 'http:routes';

/** Método HTTP de uma rota (@Get → 'GET') */
export const ROUTE_METHOD_METADATA_KEY = 'http:route:method';

/** Path da rota (@Get('/profile') → '/profile') */
export const ROUTE_PATH_METADATA_KEY = 'http:route:path';

/** Parâmetros de uma rota (todos os @Body, @Query, etc) */
export const ROUTE_PARAMS_METADATA_KEY = 'http:route:params';

/** Guards de uma rota (@UseGuards(AuthGuard)) */
export const ROUTE_GUARDS_METADATA_KEY = 'http:route:guards';

/** Factory para chave de parâmetro por índice */
export const PARAM_METADATA_KEY = (index: number) => `http:param:${index}`;
