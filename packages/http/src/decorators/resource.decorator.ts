import { RESOURCE_PATH_METADATA_KEY } from '../constants/metadata-keys.constants';

/**
 * Marca classe como HTTP resource
 *
 * Define prefix de path para todas as rotas do resource
 *
 * @example
 * @Resource('users')
 * class UserResource {
 *   @Get(':id') // path final: /users/:id
 *   findOne() {}
 * }
 *
 * @example
 * @Resource('/api/v1/users')
 * class UserResource {
 *   @Get() // path final: /api/v1/users
 *   findAll() {}
 * }
 */
export function Resource(path: string = ''): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(RESOURCE_PATH_METADATA_KEY, path, target);
  };
}
