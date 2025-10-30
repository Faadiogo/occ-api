import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve conter 14 dígitos'),
  regime_tributario: z.enum(['Simples Nacional', 'Lucro Presumido', 'Lucro Real']),
  cnae: z.string().min(1, 'CNAE é obrigatório'),
  cnaes_secundarios: z.array(z.string()).optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  cnae: z.string().optional().or(z.literal('')),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

