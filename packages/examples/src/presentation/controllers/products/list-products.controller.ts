import { Get } from '@elyum/http';

import { ListProductsUseCase } from '../../../application/usecases/products/list-products.usecase';

@Get('/products')
export class ListProductsController {
  constructor(private readonly listProductsUseCase: ListProductsUseCase) {}

  execute() {
    return this.listProductsUseCase.execute();
  }
}
