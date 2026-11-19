import type { ElyumExpressExtensions } from '@elyum/express';
import type { Application } from 'express';

import { HealthController } from '../presentation/controllers/health.controller';
import { CreateOrderController } from '../presentation/controllers/orders/create-order.controller';
import { GetOrderController } from '../presentation/controllers/orders/get-order.controller';
import { ListOrdersController } from '../presentation/controllers/orders/list-orders.controller';
import { PreviewOrderController } from '../presentation/controllers/orders/preview-order.controller';
import { UpdateOrderStatusController } from '../presentation/controllers/orders/update-order-status.controller';
import { CreateProductController } from '../presentation/controllers/products/create-product.controller';
import { ListProductsController } from '../presentation/controllers/products/list-products.controller';

export function registerRoutes(app: Application & ElyumExpressExtensions) {
  app.controller(HealthController);
  app.controller(PreviewOrderController);
  app.controller(CreateProductController);
  app.controller(ListProductsController);
  app.controller(CreateOrderController);
  app.controller(GetOrderController);
  app.controller(ListOrdersController);
  app.controller(UpdateOrderStatusController);
}
