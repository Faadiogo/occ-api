import { z } from 'zod';

// Schema para busca de CNAE
export const cnaeSearchSchema = z.object({
  q: z.string()
    .max(100, 'Termo de busca muito longo')
    .optional()
    .default(''),
  
  page: z.string()
    .regex(/^\d+$/, 'Página deve ser um número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'Página deve ser maior que 0')
    .optional()
    .default('1'),
  
  limit: z.string()
    .regex(/^\d+$/, 'Limite deve ser um número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, 'Limite deve estar entre 1 e 100')
    .optional()
    .default('20')
});

// Schema para busca por código CNAE
export const cnaeCodeSchema = z.object({
  code: z.string()
    .regex(/^\d{7}$/, 'Código CNAE deve ter exatamente 7 dígitos')
    .min(7, 'Código CNAE deve ter 7 dígitos')
    .max(7, 'Código CNAE deve ter 7 dígitos')
});

// Schema para busca de faixas por anexo
export const cnaeFaixasSchema = z.object({
  anexo: z.string()
    .min(1, 'Anexo é obrigatório')
    .max(50, 'Nome do anexo muito longo')
    .regex(/^[IVX]+$/, 'Anexo deve ser I, II, III, IV ou V')
});

export type CNAESearchInput = z.infer<typeof cnaeSearchSchema>;
export type CNAECodeInput = z.infer<typeof cnaeCodeSchema>;
export type CNAEFaixasInput = z.infer<typeof cnaeFaixasSchema>;
