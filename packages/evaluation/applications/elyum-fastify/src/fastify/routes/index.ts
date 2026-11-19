import { FastifyPluginAsync } from 'fastify';

import { HealthController } from '../../presentation/controllers/health.controller';
import { CreateOrderController } from '../../presentation/controllers/orders/create-order.controller';
import { GetOrderController } from '../../presentation/controllers/orders/get-order.controller';
import { ListOrdersController } from '../../presentation/controllers/orders/list-orders.controller';
import { PreviewOrderController } from '../../presentation/controllers/orders/preview-order.controller';
import { UpdateOrderStatusController } from '../../presentation/controllers/orders/update-order-status.controller';
import { CreateProductController } from '../../presentation/controllers/products/create-product.controller';
import { ListProductsController } from '../../presentation/controllers/products/list-products.controller';

export const routes: FastifyPluginAsync = async (fastify) => {
  fastify.controller(HealthController);
  fastify.controller(PreviewOrderController);
  fastify.controller(CreateProductController);
  fastify.controller(ListProductsController);
  fastify.controller(CreateOrderController);
  fastify.controller(GetOrderController);
  fastify.controller(ListOrdersController);
  fastify.controller(UpdateOrderStatusController);
};
