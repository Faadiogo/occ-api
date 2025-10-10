import { z } from 'zod';

export const createTaxPlanSchema = z.object({
  client_id: z.string().uuid('ID do cliente inválido'),
  year: z.number().int().min(2000).max(2100),
});

export const createRevenueSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().datetime().or(z.date()),
});

export const createExpenseSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().datetime().or(z.date()),
  category: z.string().min(2, 'Categoria é obrigatória'),
});

export type CreateTaxPlanInput = z.infer<typeof createTaxPlanSchema>;
export type CreateRevenueInput = z.infer<typeof createRevenueSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

