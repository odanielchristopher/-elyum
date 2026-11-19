import z from 'zod';

export const createOrderSchema = z.object({
  customerId: z.uuid({ error: 'Invalid customer ID.' }),
  items: z
    .array(
      z.object({
        productId: z.uuid({ error: 'Invalid product ID.' }),
        quantity: z
          .number()
          .int()
          .positive({ error: 'Quantity must be a positive integer.' }),
      }),
    )
    .min(1),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
