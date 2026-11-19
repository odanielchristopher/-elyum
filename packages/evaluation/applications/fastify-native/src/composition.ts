import type { Clock } from './application/contracts/clock';
import type { IdGenerator } from './application/contracts/id-generator';
import { CreateOrderUseCase } from './application/usecases/orders/create-order.usecase';
import { GetOrderUseCase } from './application/usecases/orders/get-order.usecase';
import { ListOrdersUseCase } from './application/usecases/orders/list-orders.usecase';
import { PreviewOrderUseCase } from './application/usecases/orders/preview-order.usecase';
import { UpdateOrderStatusUseCase } from './application/usecases/orders/update-order-status.usecase';
import { CreateProductUseCase } from './application/usecases/products/create-product.usecase';
import { ListProductsUseCase } from './application/usecases/products/list-products.usecase';
import { Product } from './domain/entities/product.entity';
import { NodeIdGenerator } from './infrastructure/random/node-id-generator';
import { InMemoryOrderRepository } from './infrastructure/repositories/in-memory-order.repository';
import { InMemoryProductRepository } from './infrastructure/repositories/in-memory-product.repository';
import { SystemClock } from './infrastructure/time/system-clock';

export function composeApplication(
  options: { clock?: Clock; idGenerator?: IdGenerator } = {},
) {
  const products = new InMemoryProductRepository([
    new Product({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Mechanical Keyboard',
      description: 'Mechanical keyboard',
      priceInCents: 25000,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    new Product({
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Wireless Mouse',
      description: 'Wireless mouse',
      priceInCents: 10000,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    new Product({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Monitor',
      description: '24-inch monitor',
      priceInCents: 90000,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
  ]);
  const orders = new InMemoryOrderRepository();
  const clock = options.clock ?? new SystemClock();
  const ids = options.idGenerator ?? new NodeIdGenerator();
  return {
    createProduct: new CreateProductUseCase(products, ids, clock),
    listProducts: new ListProductsUseCase(products),
    createOrder: new CreateOrderUseCase(orders, products, ids, clock),
    previewOrder: new PreviewOrderUseCase(products),
    getOrder: new GetOrderUseCase(orders),
    listOrders: new ListOrdersUseCase(orders),
    updateOrderStatus: new UpdateOrderStatusUseCase(orders),
  };
}
