// Tipos e interfaces do sistema

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT'
}

export enum RegimeTributario {
  SIMPLES_NACIONAL = 'Simples Nacional',
  LUCRO_PRESUMIDO = 'Lucro Presumido',
  LUCRO_REAL = 'Lucro Real'
}

export enum QuestionType {
  ALTERNATIVA = 'ALTERNATIVA',
  DISSERTATIVA = 'DISSERTATIVA',
  RATING = 'RATING'
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  created_at: Date;
  updated_at: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClientCompany {
  id: string;
  client_id: string;
  company_name: string;
  cnpj: string;
  regime_tributario: RegimeTributario;
  cnae?: string;
  cnaes_secundarios?: string[];
  tipo_atividade_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TipoAtividade {
  id: string;
  nome: string;
  descricao?: string;
  presuncao_irpj: number;
  presuncao_csll: number;
  ativo: boolean;
  presuncao_irpj_variavel: boolean;
  faturamento_limite?: number;
  presuncao_irpj_ate_limite?: number;
  presuncao_irpj_acima_limite?: number;
  created_at: Date;
  updated_at: Date;
}


export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string;
  author_id: string;
  category_id: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  created_by: string;
  is_active: boolean;
  created_at: Date;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  type: QuestionType;
  options?: string[];
  order: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  client_id: string;
  submitted_at: Date;
}

export interface SurveyAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string;
  created_at: Date;
}

export interface TaxCalculationReport {
  id: string;
  company_id: string;
  jan_anterior: number;
  fev_anterior: number;
  mar_anterior: number;
  abr_anterior: number;
  mai_anterior: number;
  jun_anterior: number;
  jul_anterior: number;
  ago_anterior: number;
  set_anterior: number;
  out_anterior: number;
  nov_anterior: number;
  dez_anterior: number;
  jan_atual: number;
  fev_atual: number;
  mar_atual: number;
  abr_atual: number;
  mai_atual: number;
  jun_atual: number;
  jul_atual: number;
  ago_atual: number;
  set_atual: number;
  out_atual: number;
  nov_atual: number;
  dez_atual: number;
  tipo_atividade?: string;
  folha_pagamento_12m: number;
  lucro_liquido_anual: number;
  aliquota_iss: number;
  aliquota_icms: number;
  creditos_pis_cofins: number;
  rbaa: number;
  rba: number;
  created_by: string;
  created_at: Date;
}

// Request types com user autenticado
export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// ============================================
// TIPOS PARA CÁLCULO TRIBUTÁRIO
// ============================================

// Input do cálculo tributário
export interface TaxCalculationInput {
  company_id: string;
  tipo_empresa: 'comércio' | 'serviço' | 'indústria';
  cnae: string;
  tipo_atividade?: string;
  rba?: number;
  rbaa?: number;
  rbt12?: number;
  // rba será calculado dinamicamente como soma de jan até dez
  // rbaa será calculado dinamicamente como soma de jan_anterior até dez_anterior
  // rbt12 será calculado dinamicamente baseado nos dados mensais
  folha_pagamento_12m: number;
  lucro_liquido_anual: number;
  aliquota_iss: number; // De 0.02 a 0.05 (2% a 5%)
  aliquota_icms?: number; // De 0.02 a 0.20 (2% a 20%) - para comércio e indústria
  creditos_pis_cofins?: number; // Opcional para Lucro Real
  
  // Dados mensais do ano atual
  jan?: number;
  fev?: number;
  mar?: number;
  abr?: number;
  mai?: number;
  jun?: number;
  jul?: number;
  ago?: number;
  set?: number;
  out?: number;
  nov?: number;
  dez?: number;
  
  // Dados mensais do ano anterior
  jan_anterior?: number;
  fev_anterior?: number;
  mar_anterior?: number;
  abr_anterior?: number;
  mai_anterior?: number;
  jun_anterior?: number;
  jul_anterior?: number;
  ago_anterior?: number;
  set_anterior?: number;
  out_anterior?: number;
  nov_anterior?: number;
  dez_anterior?: number;
}

// Resultado do Simples Nacional
export interface SimplesNacionalResult {
  anexo: string;
  fator_r?: number;
  faixa_faturamento: string;
  aliquota_nominal: number;
  parcela_deduzir: number;
  aliquota_efetiva: number;
  imposto_total: number;
  economia_anual?: number;
}

// Resultado do Lucro Presumido
export interface LucroPresumidoResult {
  base_presuncao: number;
  percentual_presuncao: number;
  lucro_presumido: number;
  irpj: number;
  adicional_irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  iss: number;
  icms: number;
  imposto_total: number;
  aliquota_efetiva: number;
}

// Resultado do Lucro Real
export interface LucroRealResult {
  lucro_liquido: number;
  irpj: number;
  adicional_irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  creditos_pis_cofins: number;
  pis_cofins_liquido: number;
  iss: number;
  imposto_total: number;
  aliquota_efetiva: number;
}

// Evolução mensal da RBT12 e alíquota efetiva
export interface MonthlyEvolution {
  mes: string;
  mes_numero: number;
  faturamento_mes: number;
  rbt12: number;
  anexo: string;
  faixa_faturamento: string;
  aliquota_nominal: number;
  parcela_deduzir: number;
  aliquota_efetiva: number;
  imposto_mes: number;
}

// Comparação final entre os regimes
export interface TaxCalculationComparison {
  simples_nacional: SimplesNacionalResult;
  lucro_presumido: LucroPresumidoResult;
  lucro_real: LucroRealResult;
  best_regime: RegimeTributario;
  economia_melhor_regime: number;
  report_id: string;
  evolucao_mensal?: MonthlyEvolution[];
}

// Modelo do relatório no banco
export interface TaxCalculationReport {
  id: string;
  client_id: string;
  company_id: string;
  calculation_data: TaxCalculationInput;
  simples_nacional_result: SimplesNacionalResult;
  lucro_presumido_result: LucroPresumidoResult;
  lucro_real_result: LucroRealResult;
  best_regime: RegimeTributario;
  created_by: string;
  created_at: Date;
}

