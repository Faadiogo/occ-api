import {
  AnexoSimples,
  TipoEmpresa,
  getAnexoByCNAE,
  getTabelaAnexo,
  getFaixaFaturamentoByTable,
  calcularFatorR,
  getTipoEmpresaByCNAE,
} from '../constants/tax-tables';
import { SimplesNacionalResult, TaxCalculationInput } from '../types';

export class SimplesNacionalService {
  /**
   * Calcula o imposto devido no regime Simples Nacional
   */
  static calcular(input: TaxCalculationInput): SimplesNacionalResult {
    const {
      cnae,
      tipo_empresa,
      folha_pagamento_12m,
    } = input;

    // Calcular RBA e RBT12 dinamicamente
    const rba = this.calcularRBA(input);
    const rbt12 = this.calcularRBT12(input);

    // 1. Identificar anexo baseado no CNAE
    let anexoString = getAnexoByCNAE(cnae);
    let anexo: AnexoSimples;

    // Se não encontrou o CNAE, usa regra geral por tipo de empresa
    if (!anexoString) {
      anexo = this.getAnexoPorTipoEmpresa(tipo_empresa as TipoEmpresa);
    } else {
      // Converter string para enum
      switch (anexoString) {
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
    }

    // 2. Para serviços, calcular Fator R para decidir entre Anexo III ou V
    let fatorR: number | undefined;
    const tipoEmpresaFromCNAE = getTipoEmpresaByCNAE(cnae);
    
    if (tipoEmpresaFromCNAE === 'serviço') {
      fatorR = calcularFatorR(folha_pagamento_12m, rbt12);
      
      // Se Fator R >= 28%, usa Anexo III, senão usa Anexo V
      if (fatorR >= 0.28) {
        anexo = AnexoSimples.ANEXO_III;
      } else {
        anexo = AnexoSimples.ANEXO_V;
      }
    }

    // 3. Obter tabela do anexo correspondente
    const tabelaAnexo = getTabelaAnexo(anexo);

    // 4. Encontrar faixa de faturamento
    const faixa = getFaixaFaturamentoByTable(rbt12, tabelaAnexo);

    if (!faixa) {
      throw new Error(`Faturamento RBT12 de R$ ${rbt12.toLocaleString('pt-BR')} não se enquadra em nenhuma faixa do ${anexo}`);
    }

    // 5. Calcular alíquota efetiva
    // Fórmula: ((RBT12 x Alíquota Nominal) - Parcela a Deduzir) / RBT12
    const aliquotaEfetiva = ((rbt12 * (faixa.aliquotaNominal / 100)) - faixa.parcelaADeduzir) / rbt12;

    // 6. Calcular imposto anual
    const impostoTotal = rba * aliquotaEfetiva;

    // 7. Montar resultado
    const resultado: SimplesNacionalResult = {
      anexo,
      fator_r: fatorR,
      faixa_faturamento: faixa.nomeFaixa,
      aliquota_nominal: faixa.aliquotaNominal,
      parcela_deduzir: faixa.parcelaADeduzir,
      aliquota_efetiva: aliquotaEfetiva * 100, // Converter para percentual
      imposto_total: impostoTotal,
    };

    return resultado;
  }

  /**
   * Define anexo padrão baseado no tipo de empresa quando CNAE não é encontrado
   */
  private static getAnexoPorTipoEmpresa(tipo: TipoEmpresa): AnexoSimples {
    switch (tipo) {
      case TipoEmpresa.COMERCIO:
        return AnexoSimples.ANEXO_I;
      case TipoEmpresa.INDUSTRIA:
        return AnexoSimples.ANEXO_II;
      case TipoEmpresa.SERVICO:
        // Para serviços, o Fator R decidirá entre III ou V
        return AnexoSimples.ANEXO_III;
      default:
        return AnexoSimples.ANEXO_I;
    }
  }

  /**
   * Calcula RBA (Receita Bruta Anual) dinamicamente baseado nos dados mensais do ano atual
   */
  private static calcularRBA(input: TaxCalculationInput): number {
    const mesesAtual = [
      input.jan || 0, input.fev || 0, input.mar || 0, input.abr || 0,
      input.mai || 0, input.jun || 0, input.jul || 0, input.ago || 0,
      input.set || 0, input.out || 0, input.nov || 0, input.dez || 0
    ];

    return mesesAtual.reduce((sum, val) => sum + val, 0);
  }


  /**
   * Calcula RBT12 dinamicamente baseado nos dados mensais
   */
  private static calcularRBT12(input: TaxCalculationInput): number {
    // Dados mensais do ano atual
    const mesesAtual = [
      input.jan || 0, input.fev || 0, input.mar || 0, input.abr || 0,
      input.mai || 0, input.jun || 0, input.jul || 0, input.ago || 0,
      input.set || 0, input.out || 0, input.nov || 0, input.dez || 0
    ];

    // Dados mensais do ano anterior
    const mesesAnterior = [
      input.jan_anterior || 0, input.fev_anterior || 0, input.mar_anterior || 0, input.abr_anterior || 0,
      input.mai_anterior || 0, input.jun_anterior || 0, input.jul_anterior || 0, input.ago_anterior || 0,
      input.set_anterior || 0, input.out_anterior || 0, input.nov_anterior || 0, input.dez_anterior || 0
    ];

    // Calcular RBT12 (últimos 12 meses)
    const rbt12 = [...mesesAnterior, ...mesesAtual].slice(-12).reduce((sum, val) => sum + val, 0);
    
    return rbt12;
  }
}

