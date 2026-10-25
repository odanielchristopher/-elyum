import { Get } from '@elyum/http';

import { ListOrdersUseCase } from '../../../application/usecases/orders/list-orders.usecase';

@Get('/orders')
export class ListOrdersController {
  constructor(private readonly listOrdersUseCase: ListOrdersUseCase) {}

  execute() {
    return this.listOrdersUseCase.execute();
  }
}
