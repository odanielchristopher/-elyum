import { Constructor } from '@elyum/core';

import { ROUTE_GUARDS_METADATA_KEY } from '../constants/metadata-keys.constants';

/**
 * @UseGuards decorator - Adiciona guards à rota
 *
 * Guards são executados antes do handler
 * Se algum retornar false, acesso é negado
 *
 * @example
 * @UseGuards(AuthGuard)
 * @Get('profile')
 * getProfile() {
 *   const user = HttpExecutionContext.get('user');
 *   return user;
 * }
 *
 * @example
 * // Múltiplos guards (executados em ordem)
 * @UseGuards(AuthGuard, RoleGuard, ThrottleGuard)
 * @Delete(':id')
 * delete(@Param('id') id: string) {}
 */
export function UseGuards(...guards: Constructor[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata(
      ROUTE_GUARDS_METADATA_KEY,
      guards,
      target,
      propertyKey,
    );
  };
}
