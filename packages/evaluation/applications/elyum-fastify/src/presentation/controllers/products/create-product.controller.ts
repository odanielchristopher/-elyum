import { Body, Post } from '@elyum/http';
import { zodValidator } from '@elyum/validation-zod';

import { CreateProductUseCase } from '../../../application/usecases/products/create-product.usecase';
import {
  type CreateProductDto,
  createProductSchema,
} from '../../schemas/products/create-product.schema';

@Post('/products')
export class CreateProductController {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {}

  execute(
    @Body(zodValidator(createProductSchema)) createProductDto: CreateProductDto,
  ) {
    return this.createProductUseCase.execute(createProductDto);
  }
}
