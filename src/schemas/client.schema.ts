import { z } from 'zod';

export const createClientSchema = z.object({
  user_id: z.string().uuid('ID do usuário inválido'),
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve conter 14 dígitos'),
  regime_tributario: z.enum(['Simples Nacional', 'Lucro Presumido', 'Lucro Real']),
});

export const updateClientSchema = createClientSchema.partial();

export const createDocumentSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  file_url: z.string().url('URL do arquivo inválida'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

