// ============================================
// CONSTANTES TRIBUTÁRIAS DO BRASIL
// ============================================
// Dados centralizados dos arquivos JSON

import fs from 'fs';
import path from 'path';

export enum TipoEmpresa {
  COMERCIO = 'comércio',
  SERVICO = 'serviço',
  INDUSTRIA = 'indústria'
}

export enum AnexoSimples {
  ANEXO_I = 'Anexo I',
  ANEXO_II = 'Anexo II',
  ANEXO_III = 'Anexo III',
  ANEXO_IV = 'Anexo IV',
  ANEXO_V = 'Anexo V'
}

// ============================================
// INTERFACES DOS DADOS JSON
// ============================================

export interface CNAEItem {
  CNAE: number;
  Descrição: string;
  Anexo: string;
  'Fator R': string;
  Alíquota: number;
  Tipo: string;
}

export interface FaixaItem {
  Anexo: string;
  Faixa: string;
  'Receita de': number;
  'Receita até': number;
  Alíquota: number;
  'Valor a Deduzir': number;
}

export interface FaixaSimples {
  faixaInicio: number;
  faixaFim: number;
  aliquotaNominal: number;
  parcelaADeduzir: number;
  nomeFaixa: string;
}

// ============================================
// CARREGAMENTO DE DADOS DOS JSONs
// ============================================

let cnaeData: CNAEItem[] = [];
let faixasData: FaixaItem[] = [];

// Carregar dados do CNAE
try {
  const cnaePath = path.join(__dirname, '../../data/cnae.json');
  const cnaeRaw = fs.readFileSync(cnaePath, 'utf-8');
  cnaeData = JSON.parse(cnaeRaw);
} catch (error) {
  console.error('Erro ao carregar cnae.json:', error);
}

// Carregar dados das faixas
try {
  const faixasPath = path.join(__dirname, '../../data/faixas.json');
  const faixasRaw = fs.readFileSync(faixasPath, 'utf-8');
  faixasData = JSON.parse(faixasRaw);
} catch (error) {
  console.error('Erro ao carregar faixas.json:', error);
}

// ============================================
// FUNÇÕES DE BUSCA E CONVERSÃO
// ============================================

/**
 * Converte FaixaItem para FaixaSimples
 * Converte alíquota de decimal para percentual (0.11 -> 11)
 */
function convertFaixaItem(faixa: FaixaItem): FaixaSimples {
  return {
    faixaInicio: faixa['Receita de'] as number,
    faixaFim: faixa['Receita até'] as number,
    aliquotaNominal: (faixa.Alíquota as number) * 100, // Converte 0.11 para 11
    parcelaADeduzir: faixa['Valor a Deduzir'] as number,
    nomeFaixa: faixa.Faixa as string
  };
}

/**
 * Busca informações de um CNAE específico ou por descrição
 */
export function getCNAEInfo(searchTerm: string): CNAEItem[] {
  const cleanSearchTerm = searchTerm.toLowerCase().trim();
  
  // Se não há termo de busca, retornar todos os CNAEs
  if (!cleanSearchTerm) {
    return cnaeData;
  }
  
  // Se o termo de busca é apenas números, buscar por código CNAE
  if (/^\d+$/.test(cleanSearchTerm)) {
    return cnaeData.filter(item => item.CNAE.toString().includes(cleanSearchTerm));
  }
  
  // Normalizar termo de busca para remover acentos
  const normalizeString = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };
  
  const normalizedSearchTerm = normalizeString(cleanSearchTerm);
  
  // Caso contrário, buscar por descrição
  return cnaeData.filter(item => {
    const normalizedDescription = normalizeString(item.Descrição);
    return normalizedDescription.includes(normalizedSearchTerm) ||
           item.CNAE.toString().includes(cleanSearchTerm);
  });
}

/**
 * Busca anexo por CNAE
 */
export function getAnexoByCNAE(cnae: string): string | null {
  const cnaeInfo = getCNAEInfo(cnae);
  return cnaeInfo.length > 0 ? cnaeInfo[0].Anexo : null;
}

/**
 * Verifica se CNAE tem Fator R
 */
export function hasFatorR(cnae: string): boolean {
  const cnaeInfo = getCNAEInfo(cnae);
  return cnaeInfo.some(item => item['Fator R'] === 'Sim');
}

/**
 * Busca faixas por anexo
 */
export function getFaixasByAnexo(anexo: string): FaixaItem[] {
  return faixasData.filter(faixa => faixa.Anexo === anexo);
}

/**
 * Encontra faixa de faturamento
 */
export function getFaixaFaturamento(rbt12: number, anexo: string): FaixaItem | null {
  const faixas = getFaixasByAnexo(anexo);
  
  return faixas.find(faixa => {
    return rbt12 >= faixa['Receita de'] && rbt12 <= faixa['Receita até'];
  }) || null;
}

// ============================================
// TABELAS DO SIMPLES NACIONAL (GERADAS DOS JSONs)
// ============================================

export const ANEXO_I: FaixaSimples[] = getFaixasByAnexo('I').map(convertFaixaItem);
export const ANEXO_II: FaixaSimples[] = getFaixasByAnexo('II').map(convertFaixaItem);
export const ANEXO_III: FaixaSimples[] = getFaixasByAnexo('III').map(convertFaixaItem);
export const ANEXO_IV: FaixaSimples[] = getFaixasByAnexo('IV').map(convertFaixaItem);
export const ANEXO_V: FaixaSimples[] = getFaixasByAnexo('V').map(convertFaixaItem);

// ============================================
// MAPEAMENTO CNAE → ANEXO (GERADO DOS JSONs)
// ============================================

export const CNAE_TO_ANEXO: Record<string, AnexoSimples> = {};

// Gerar mapeamento automaticamente dos dados JSON
cnaeData.forEach(item => {
  const cnaeKey = item.CNAE.toString();
  let anexo: AnexoSimples;
  
  switch (item.Anexo) {
    case 'I':
      anexo = AnexoSimples.ANEXO_I;
      break;
    case 'II':
      anexo = AnexoSimples.ANEXO_II;
      break;
    case 'III':
      anexo = AnexoSimples.ANEXO_III;
      break;
    case 'IV':
      anexo = AnexoSimples.ANEXO_IV;
      break;
    case 'V':
      anexo = AnexoSimples.ANEXO_V;
      break;
    default:
      anexo = AnexoSimples.ANEXO_I;
  }
  
  CNAE_TO_ANEXO[cnaeKey] = anexo;
});

// ============================================
// LUCRO PRESUMIDO - BASES DE PRESUNÇÃO
// ============================================

export const PRESUNCAO_LUCRO = {
  COMERCIO: 0.08,        // 8% para comércio e indústria
  INDUSTRIA: 0.08,       // 8% para comércio e indústria
  SERVICO_GERAL: 0.32,   // 32% para serviços em geral
  SERVICO_BAIXO: 0.16,   // 16% para alguns serviços (transporte, etc)
};

// ============================================
// LUCRO REAL - PRESUNÇÃO POR TIPO DE ATIVIDADE
// ============================================

export const PRESUNCAO_LUCRO_REAL = {
  // Revenda de Combustíveis e Gás Natural
  COMBUSTIVEIS: {
    IRPJ: 0.016,  // 1,6%
    CSLL: 0.12    // 12%
  },
  
  // Comércio e Indústria (Regra Geral)
  COMERCIO_INDUSTRIA: {
    IRPJ: 0.08,   // 8%
    CSLL: 0.12    // 12%
  },
  
  // Atividades Imobiliárias
  IMOBILIARIAS: {
    IRPJ: 0.08,   // 8%
    CSLL: 0.12    // 12%
  },
  
  // Serviços Hospitalares
  HOSPITALARES: {
    IRPJ: 0.08,   // 8%
    CSLL: 0.12    // 12%
  },
  
  // Transporte de Cargas
  TRANSPORTE_CARGAS: {
    IRPJ: 0.08,   // 8%
    CSLL: 0.12    // 12%
  },
  
  // Transporte (Exceto Cargas - Passageiros)
  TRANSPORTE_PASSAGEIROS: {
    IRPJ: 0.16,   // 16%
    CSLL: 0.12    // 12%
  },
  
  // Serviços em Geral (Faturamento anual até R$ 120.000,00)
  SERVICOS_GERAL_BAIXO: {
    IRPJ: 0.16,   // 16%
    CSLL: 0.32    // 32%
  },
  
  // Serviços em Geral (Faturamento anual acima de R$ 120.000,00)
  SERVICOS_GERAL_ALTO: {
    IRPJ: 0.32,   // 32%
    CSLL: 0.32    // 32%
  },
  
  // Serviços Profissionais Regulamentados
  SERVICOS_PROFISSIONAIS: {
    IRPJ: 0.32,   // 32%
    CSLL: 0.32    // 32%
  },
  
  // Intermediação de Negócios (Corretagem)
  INTERMEDIACAO: {
    IRPJ: 0.32,   // 32%
    CSLL: 0.32    // 32%
  },
  
  // Administração, Locação ou Cessão de Bens/Direitos
  ADMINISTRACAO_LOCACAO: {
    IRPJ: 0.32,   // 32%
    CSLL: 0.32    // 32%
  },
  
  // Operações de Crédito (ESC)
  OPERACOES_CREDITO: {
    IRPJ: 0.384,  // 38,4%
    CSLL: 0.384   // 38,4%
  }
};

// ============================================
// ALÍQUOTAS DE IMPOSTOS
// ============================================

export const ALIQUOTAS = {
  // IRPJ
  IRPJ: 0.15,                    // 15% sobre o lucro
  IRPJ_ADICIONAL: 0.10,          // 10% sobre lucro > R$ 20.000/mês (R$ 60.000/trimestre)
  IRPJ_ADICIONAL_LIMITE: 20000,  // Limite mensal
  
  // CSLL
  CSLL: 0.09,                    // 9% sobre o lucro
  
  // PIS e COFINS
  PIS_CUMULATIVO: 0.0065,        // 0,65% (Lucro Presumido)
  COFINS_CUMULATIVO: 0.03,       // 3% (Lucro Presumido)
  PIS_NAO_CUMULATIVO: 0.0165,    // 1,65% (Lucro Real)
  COFINS_NAO_CUMULATIVO: 0.076,  // 7,6% (Lucro Real)
  
  // ISS (varia por município, mas usamos uma faixa)
  ISS_MIN: 0.02,                 // 2% mínimo
  ISS_MAX: 0.05,                 // 5% máximo
  
  // Limites
  LIMITE_ANUAL_REAL: 78000000,   // R$ 78 milhões - limite para Lucro Real obrigatório
  LIMITE_ADICIONAL_ANUAL: 240000, // R$ 240 mil - limite para adicional de IRPJ anual
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Retorna a tabela de faixas correspondente ao anexo
 */
export function getTabelaAnexo(anexo: AnexoSimples): FaixaSimples[] {
  switch (anexo) {
    case AnexoSimples.ANEXO_I:
      return ANEXO_I;
    case AnexoSimples.ANEXO_II:
      return ANEXO_II;
    case AnexoSimples.ANEXO_III:
      return ANEXO_III;
    case AnexoSimples.ANEXO_IV:
      return ANEXO_IV;
    case AnexoSimples.ANEXO_V:
      return ANEXO_V;
    default:
      return ANEXO_I;
  }
}

/**
 * Encontra a faixa de faturamento correspondente
 */
export function getFaixaFaturamentoByTable(rbt12: number, tabela: FaixaSimples[]): FaixaSimples | null {
  return tabela.find(faixa => rbt12 >= faixa.faixaInicio && rbt12 <= faixa.faixaFim) || null;
}

/**
 * Calcula o Fator R (Folha / Receita Bruta)
 */
export function calcularFatorR(folhaPagamento12m: number, rbt12: number): number {
  if (rbt12 === 0) return 0;
  return folhaPagamento12m / rbt12;
}

/**
 * Retorna a base de presunção conforme o tipo de empresa
 */
export function getBasePresuncao(tipoEmpresa: TipoEmpresa): number {
  switch (tipoEmpresa) {
    case TipoEmpresa.COMERCIO:
      return PRESUNCAO_LUCRO.COMERCIO;
    case TipoEmpresa.INDUSTRIA:
      return PRESUNCAO_LUCRO.INDUSTRIA;
    case TipoEmpresa.SERVICO:
      return PRESUNCAO_LUCRO.SERVICO_GERAL;
    default:
      return PRESUNCAO_LUCRO.SERVICO_GERAL;
  }
}

/**
 * Busca tipo de empresa diretamente do CNAE
 */
export function getTipoEmpresaByCNAE(cnae: string): string {
  const cnaeInfo = getCNAEInfo(cnae);
  if (cnaeInfo.length > 0) {
    return cnaeInfo[0].Tipo.toLowerCase();
  }
  return 'serviço'; // Default
}

/**
 * Determina o tipo de atividade para cálculo do Lucro Real
 * baseado no CNAE e faturamento anual
 */
export function getTipoAtividadeLucroReal(cnae: string, rba: number): keyof typeof PRESUNCAO_LUCRO_REAL {
  const cnaeCode = parseInt(cnae);
  const descricao = getCNAEInfo(cnae)[0]?.Descrição?.toLowerCase() || '';
  
  // Revenda de Combustíveis e Gás Natural
  if (descricao.includes('combustível') || descricao.includes('gás natural') || 
      cnaeCode >= 4711 && cnaeCode <= 4719) {
    return 'COMBUSTIVEIS';
  }
  
  // Comércio e Indústria (Regra Geral)
  if (descricao.includes('comércio') || descricao.includes('indústria') || 
      cnaeCode >= 1000 && cnaeCode <= 4799) {
    return 'COMERCIO_INDUSTRIA';
  }
  
  // Atividades Imobiliárias
  if (descricao.includes('imobiliária') || descricao.includes('construção') || 
      descricao.includes('loteamento') || cnaeCode >= 4100 && cnaeCode <= 4399) {
    return 'IMOBILIARIAS';
  }
  
  // Serviços Hospitalares
  if (descricao.includes('hospitalar') || descricao.includes('saúde') || 
      cnaeCode >= 8601 && cnaeCode <= 8699) {
    return 'HOSPITALARES';
  }
  
  // Transporte de Cargas
  if (descricao.includes('transporte de carga') || descricao.includes('frete') || 
      cnaeCode >= 4920 && cnaeCode <= 4929) {
    return 'TRANSPORTE_CARGAS';
  }
  
  // Transporte de Passageiros
  if (descricao.includes('transporte de passageiro') || 
      cnaeCode >= 4910 && cnaeCode <= 4919) {
    return 'TRANSPORTE_PASSAGEIROS';
  }
  
  // Serviços Profissionais Regulamentados
  if (descricao.includes('advogado') || descricao.includes('contador') || 
      descricao.includes('engenheiro') || descricao.includes('consultor') ||
      cnaeCode >= 6201 && cnaeCode <= 6299) {
    return 'SERVICOS_PROFISSIONAIS';
  }
  
  // Intermediação de Negócios (Corretagem)
  if (descricao.includes('corretagem') || descricao.includes('intermediação') || 
      cnaeCode >= 4610 && cnaeCode <= 4699) {
    return 'INTERMEDIACAO';
  }
  
  // Administração, Locação ou Cessão de Bens/Direitos
  if (descricao.includes('locação') || descricao.includes('administração') || 
      cnaeCode >= 6810 && cnaeCode <= 6829) {
    return 'ADMINISTRACAO_LOCACAO';
  }
  
  // Operações de Crédito (ESC)
  if (descricao.includes('crédito') || descricao.includes('financeira') || 
      cnaeCode >= 6410 && cnaeCode <= 6499) {
    return 'OPERACOES_CREDITO';
  }
  
  // Serviços em Geral - baseado no faturamento
  if (rba <= 120000) {
    return 'SERVICOS_GERAL_BAIXO';
  } else {
    return 'SERVICOS_GERAL_ALTO';
  }
}


