import { FastifyPluginAsync } from 'fastify';

import { CreateOrderController } from '../../presentation/controllers/orders/create-order.controller';
import { CreateProductController } from '../../presentation/controllers/products/create-product.controller';
import { ListProductsController } from '../../presentation/controllers/products/list-products.controller';

export const routes: FastifyPluginAsync = async (fastify) => {
  fastify.controller(CreateProductController);
  fastify.controller(ListProductsController);
  fastify.controller(CreateOrderController);
};
