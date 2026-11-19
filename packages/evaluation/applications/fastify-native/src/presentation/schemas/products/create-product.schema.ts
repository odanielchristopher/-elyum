import z from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(100),
  priceInCents: z.number().int().positive(),
  description: z.string().max(255),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
