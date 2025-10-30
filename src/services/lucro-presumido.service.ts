import {
  TipoEmpresa,
  getBasePresuncao,
  ALIQUOTAS,
} from '../constants/tax-tables';
import { LucroPresumidoResult, TaxCalculationInput } from '../types';

export class LucroPresumidoService {
  /**
   * Calcula o imposto devido no regime Lucro Presumido
   */
  static calcular(input: TaxCalculationInput): LucroPresumidoResult {
    const {
      tipo_empresa,
      aliquota_iss,
    } = input;

    // Calcular RBA dinamicamente
    const rba = this.calcularRBA(input);

    // 1. Definir percentual de presunção baseado no tipo de empresa
    // Converter string para enum
    let tipoEmpresaEnum: TipoEmpresa;
    switch (tipo_empresa) {
      case 'comércio':
        tipoEmpresaEnum = TipoEmpresa.COMERCIO;
        break;
      case 'indústria':
        tipoEmpresaEnum = TipoEmpresa.INDUSTRIA;
        break;
      case 'serviço':
        tipoEmpresaEnum = TipoEmpresa.SERVICO;
        break;
      default:
        tipoEmpresaEnum = TipoEmpresa.SERVICO;
    }
    
    const percentualPresuncao = getBasePresuncao(tipoEmpresaEnum);

    // 2. Calcular lucro presumido (base de cálculo)
    const lucroPresumido = rba * percentualPresuncao;

    // 3. Calcular IRPJ (15% sobre o lucro presumido)
    const irpj = lucroPresumido * ALIQUOTAS.IRPJ;

    // 4. Calcular adicional de IRPJ (10% sobre o que exceder R$ 20.000/mês)
    // Limite anual = R$ 20.000 x 12 = R$ 240.000
    const limiteAnual = ALIQUOTAS.IRPJ_ADICIONAL_LIMITE * 12;
    const adicionalIrpj = lucroPresumido > limiteAnual
      ? (lucroPresumido - limiteAnual) * ALIQUOTAS.IRPJ_ADICIONAL
      : 0;

    // 5. Calcular CSLL (9% sobre o lucro presumido)
    const csll = lucroPresumido * ALIQUOTAS.CSLL;

    // 6. Calcular PIS (0,65% sobre o faturamento - regime cumulativo)
    const pis = rba * ALIQUOTAS.PIS_CUMULATIVO;

    // 7. Calcular COFINS (3% sobre o faturamento - regime cumulativo)
    const cofins = rba * ALIQUOTAS.COFINS_CUMULATIVO;

    // 8. Calcular ISS (alíquota municipal sobre o faturamento de serviços)
    const iss = tipo_empresa === 'serviço'
      ? rba * aliquota_iss
      : 0;

    // 9. Calcular ICMS (alíquota estadual sobre o faturamento de comércio e indústria)
    const icms = (tipo_empresa === 'comércio' || tipo_empresa === 'indústria')
      ? rba * (input.aliquota_icms || 0)
      : 0;

    // 10. Somar todos os impostos
    const impostoTotal = irpj + adicionalIrpj + csll + pis + cofins + iss + icms;

    // 10. Calcular alíquota efetiva
    const aliquotaEfetiva = (impostoTotal / rba) * 100;

    // 11. Montar resultado
    const resultado: LucroPresumidoResult = {
      base_presuncao: rba,
      percentual_presuncao: percentualPresuncao * 100, // Converter para percentual
      lucro_presumido: lucroPresumido,
      irpj,
      adicional_irpj: adicionalIrpj,
      csll,
      pis,
      cofins,
      iss,
      icms,
      imposto_total: impostoTotal,
      aliquota_efetiva: aliquotaEfetiva,
    };

    return resultado;
  }

  /**
   * Calcula o imposto trimestral (para análise detalhada)
   */
  static calcularTrimestral(faturamentoTrimestral: number, percentualPresuncao: number): number {
    const lucroPresumidoTrimestral = faturamentoTrimestral * percentualPresuncao;
    
    // IRPJ trimestral
    const irpjTrimestral = lucroPresumidoTrimestral * ALIQUOTAS.IRPJ;
    
    // Adicional de IRPJ (10% sobre o que exceder R$ 60.000 no trimestre)
    const limiteTrimestral = ALIQUOTAS.IRPJ_ADICIONAL_LIMITE * 3; // R$ 60.000
    const adicionalIrpjTrimestral = lucroPresumidoTrimestral > limiteTrimestral
      ? (lucroPresumidoTrimestral - limiteTrimestral) * ALIQUOTAS.IRPJ_ADICIONAL
      : 0;
    
    return irpjTrimestral + adicionalIrpjTrimestral;
  }

  /**
   * Testa o cálculo com dados de exemplo
   */
  static testarCalculo(): LucroPresumidoResult {
    const inputTeste: TaxCalculationInput = {
      company_id: 'test',
      tipo_empresa: 'comércio', // Mudando para comércio para testar ICMS
      cnae: '4711',
      folha_pagamento_12m: 0,
      lucro_liquido_anual: 0,
      aliquota_iss: 0.03,
      aliquota_icms: 0.10,
      creditos_pis_cofins: 0
    };

    return this.calcular(inputTeste);
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
}

