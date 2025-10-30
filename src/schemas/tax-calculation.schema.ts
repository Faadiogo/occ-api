import { z } from 'zod';

// Constantes para validações (removidas pois RBA/RBAA são calculados dinamicamente)
const MIN_ALIQUOTA_ISS = 0.02; // 2%
const MAX_ALIQUOTA_ISS = 0.05; // 5%
const MIN_ALIQUOTA_ICMS = 0.02; // 2%
const MAX_ALIQUOTA_ICMS = 0.20; // 20%

// Schema para validação do input de cálculo tributário
export const taxCalculationSchema = z.object({
  company_id: z.string()
    .uuid('ID da empresa deve ser um UUID válido')
    .min(1, 'ID da empresa é obrigatório'),
  
  tipo_empresa: z.enum(['comércio', 'serviço', 'indústria'], {
    errorMap: () => ({ message: 'Tipo de empresa deve ser: comércio, serviço ou indústria' })
  }),
  
  cnae: z.string()
    .min(7, 'CNAE deve ter exatamente 7 dígitos')
    .max(7, 'CNAE deve ter exatamente 7 dígitos')
    .regex(/^\d{7}$/, 'CNAE deve conter exatamente 7 dígitos numéricos'),
  
  // RBA será calculado dinamicamente como soma de jan até dez
  // RBAA será calculado dinamicamente como soma de jan_anterior até dez_anterior
  
  // RBT12 será calculado dinamicamente baseado nos dados mensais
  
  // Campos do ano anterior
  jan_anterior: z.number()
    .nonnegative('Janeiro do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  fev_anterior: z.number()
    .nonnegative('Fevereiro do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  mar_anterior: z.number()
    .nonnegative('Março do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  abr_anterior: z.number()
    .nonnegative('Abril do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  mai_anterior: z.number()
    .nonnegative('Maio do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  jun_anterior: z.number()
    .nonnegative('Junho do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  jul_anterior: z.number()
    .nonnegative('Julho do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  ago_anterior: z.number()
    .nonnegative('Agosto do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  set_anterior: z.number()
    .nonnegative('Setembro do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  out_anterior: z.number()
    .nonnegative('Outubro do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  nov_anterior: z.number()
    .nonnegative('Novembro do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  dez_anterior: z.number()
    .nonnegative('Dezembro do ano anterior não pode ser negativo')
    .optional()
    .default(0),
  
  folha_pagamento_12m: z.number()
    .nonnegative('Folha de pagamento dos últimos 12 meses não pode ser negativa'),
  
  lucro_liquido_anual: z.number()
    .nonnegative('Lucro líquido anual não pode ser negativo'),
  
  aliquota_iss: z.number()
    .min(MIN_ALIQUOTA_ISS, `Alíquota de ISS mínima é ${(MIN_ALIQUOTA_ISS * 100)}%`)
    .max(MAX_ALIQUOTA_ISS, `Alíquota de ISS máxima é ${(MAX_ALIQUOTA_ISS * 100)}%`)
    .refine((val) => val >= MIN_ALIQUOTA_ISS && val <= MAX_ALIQUOTA_ISS, 
      'Alíquota de ISS deve estar entre 2% e 5%')
    .optional(),
  
  aliquota_icms: z.number()
    .min(MIN_ALIQUOTA_ICMS, `Alíquota de ICMS mínima é ${(MIN_ALIQUOTA_ICMS * 100)}%`)
    .max(MAX_ALIQUOTA_ICMS, `Alíquota de ICMS máxima é ${(MAX_ALIQUOTA_ICMS * 100)}%`)
    .refine((val) => val >= MIN_ALIQUOTA_ICMS && val <= MAX_ALIQUOTA_ICMS, 
      'Alíquota de ICMS deve estar entre 2% e 20%')
    .optional(),
  
  creditos_pis_cofins: z.number()
    .nonnegative('Créditos de PIS/COFINS não podem ser negativos')
    .max(1000000, 'Créditos de PIS/COFINS não podem exceder R$ 1.000.000')
    .optional()
    .default(0),
  
  // Dados mensais do ano atual
  jan: z.number()
    .nonnegative('Janeiro não pode ser negativo')
    .optional(),
  fev: z.number()
    .nonnegative('Fevereiro não pode ser negativo')
    .optional(),
  mar: z.number()
    .nonnegative('Março não pode ser negativo')
    .optional(),
  abr: z.number()
    .nonnegative('Abril não pode ser negativo')
    .optional(),
  mai: z.number()
    .nonnegative('Maio não pode ser negativo')
    .optional(),
  jun: z.number()
    .nonnegative('Junho não pode ser negativo')
    .optional(),
  jul: z.number()
    .nonnegative('Julho não pode ser negativo')
    .optional(),
  ago: z.number()
    .nonnegative('Agosto não pode ser negativo')
    .optional(),
  set: z.number()
    .nonnegative('Setembro não pode ser negativo')
    .optional(),
  out: z.number()
    .nonnegative('Outubro não pode ser negativo')
    .optional(),
  nov: z.number()
    .nonnegative('Novembro não pode ser negativo')
    .optional(),
  dez: z.number()
    .nonnegative('Dezembro não pode ser negativo')
    .optional(),
})
.refine((data) => {
  // Calcular RBA dinamicamente para validação
  const rbaCalculado = [
    data.jan || 0, data.fev || 0, data.mar || 0, data.abr || 0,
    data.mai || 0, data.jun || 0, data.jul || 0, data.ago || 0,
    data.set || 0, data.out || 0, data.nov || 0, data.dez || 0
  ].reduce((sum, val) => sum + val, 0);

  // Validação: Lucro líquido deve ser menor que a receita
  return data.lucro_liquido_anual <= rbaCalculado;
}, {
  message: 'Lucro líquido não pode ser maior que a receita bruta anual',
  path: ['lucro_liquido_anual']
});

export type TaxCalculationInput = z.infer<typeof taxCalculationSchema>;

