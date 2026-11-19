import type { FastifyInstance } from 'fastify';

import type { composeApplication } from '../composition';
import { healthHandler } from '../presentation/handlers/health.handler';
import { createOrderHandler } from '../presentation/handlers/orders/create-order.handler';
import { getOrderHandler } from '../presentation/handlers/orders/get-order.handler';
import { listOrdersHandler } from '../presentation/handlers/orders/list-orders.handler';
import { previewOrderHandler } from '../presentation/handlers/orders/preview-order.handler';
import { updateOrderStatusHandler } from '../presentation/handlers/orders/update-order-status.handler';
import { createProductHandler } from '../presentation/handlers/products/create-product.handler';
import { listProductsHandler } from '../presentation/handlers/products/list-products.handler';

export function registerRoutes(
  app: FastifyInstance,
  useCases: ReturnType<typeof composeApplication>,
) {
  app.get('/health', healthHandler);
  app.post('/products', createProductHandler(useCases.createProduct));
  app.get('/products', listProductsHandler(useCases.listProducts));
  app.post('/orders', createOrderHandler(useCases.createOrder));
  app.post('/orders/preview', previewOrderHandler(useCases.previewOrder));
  app.get('/orders', listOrdersHandler(useCases.listOrders));
  app.get('/orders/:id', getOrderHandler(useCases.getOrder));
  app.patch(
    '/orders/:id/status',
    updateOrderStatusHandler(useCases.updateOrderStatus),
  );
}
