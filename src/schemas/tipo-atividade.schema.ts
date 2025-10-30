import { z } from 'zod';

// Schema para listar tipos de atividade
export const tipoAtividadeListSchema = z.object({
  query: z.object({
    ativo: z.string().optional().transform((val) => val === 'true'),
  }).optional(),
});

// Schema para buscar tipo de atividade por ID
export const tipoAtividadeIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID deve ser um UUID válido'),
  }),
});

// Schema para criar tipo de atividade
export const tipoAtividadeCreateSchema = z.object({
  body: z.object({
    nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome deve ter no máximo 255 caracteres'),
    descricao: z.string().optional(),
    presuncao_irpj: z.number().min(0, 'Presunção IRPJ deve ser maior ou igual a 0').max(100, 'Presunção IRPJ deve ser menor ou igual a 100'),
    presuncao_csll: z.number().min(0, 'Presunção CSLL deve ser maior ou igual a 0').max(100, 'Presunção CSLL deve ser menor ou igual a 100'),
    ativo: z.boolean().optional().default(true),
    presuncao_irpj_variavel: z.boolean().optional().default(false),
    faturamento_limite: z.number().optional(),
    presuncao_irpj_ate_limite: z.number().min(0).max(100).optional(),
    presuncao_irpj_acima_limite: z.number().min(0).max(100).optional(),
  }).refine((data) => {
    // Se presunção variável é true, os campos de limite são obrigatórios
    if (data.presuncao_irpj_variavel) {
      return data.faturamento_limite !== undefined && 
             data.presuncao_irpj_ate_limite !== undefined && 
             data.presuncao_irpj_acima_limite !== undefined;
    }
    return true;
  }, {
    message: 'Se presunção variável for true, faturamento_limite, presuncao_irpj_ate_limite e presuncao_irpj_acima_limite são obrigatórios',
  }),
});

// Schema para atualizar tipo de atividade
export const tipoAtividadeUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID deve ser um UUID válido'),
  }),
  body: z.object({
    nome: z.string().min(1).max(255).optional(),
    descricao: z.string().optional(),
    presuncao_irpj: z.number().min(0).max(100).optional(),
    presuncao_csll: z.number().min(0).max(100).optional(),
    ativo: z.boolean().optional(),
    presuncao_irpj_variavel: z.boolean().optional(),
    faturamento_limite: z.number().optional(),
    presuncao_irpj_ate_limite: z.number().min(0).max(100).optional(),
    presuncao_irpj_acima_limite: z.number().min(0).max(100).optional(),
  }).refine((data) => {
    // Se presunção variável é true, os campos de limite são obrigatórios
    if (data.presuncao_irpj_variavel) {
      return data.faturamento_limite !== undefined && 
             data.presuncao_irpj_ate_limite !== undefined && 
             data.presuncao_irpj_acima_limite !== undefined;
    }
    return true;
  }, {
    message: 'Se presunção variável for true, faturamento_limite, presuncao_irpj_ate_limite e presuncao_irpj_acima_limite são obrigatórios',
  }),
});

// Schema para deletar tipo de atividade
export const tipoAtividadeDeleteSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID deve ser um UUID válido'),
  }),
});
