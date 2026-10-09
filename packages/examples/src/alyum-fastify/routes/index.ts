import { FastifyPluginAsync } from 'fastify';

import { CreateOrderController } from '../../presentation/controllers/orders/create-order.controller';
import { GetOrderController } from '../../presentation/controllers/orders/get-order.controller';
import { ListOrdersController } from '../../presentation/controllers/orders/list-orders.controller';
import { UpdateOrderStatusController } from '../../presentation/controllers/orders/update-order-status.controller';
import { CreateProductController } from '../../presentation/controllers/products/create-product.controller';
import { ListProductsController } from '../../presentation/controllers/products/list-products.controller';
import { authenticate } from '../hooks/authenticate.hook';

export const routes: FastifyPluginAsync = async (fastify) => {
  fastify.controller(CreateProductController);
  fastify.controller(ListProductsController);
  fastify.controller(CreateOrderController, { onRequest: [authenticate] });
  fastify.controller(GetOrderController, { onRequest: [authenticate] });
  fastify.controller(ListOrdersController, { onRequest: [authenticate] });
  fastify.controller(UpdateOrderStatusController, {
    onRequest: [authenticate],
  });
};
