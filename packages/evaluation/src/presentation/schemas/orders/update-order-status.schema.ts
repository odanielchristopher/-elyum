import z from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled']),
});

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
