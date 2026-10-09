import z from 'zod';

export const createOrderSchema = z.object({
  customerId: z.uuid(),
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
