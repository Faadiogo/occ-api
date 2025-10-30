import { ALIQUOTAS, PRESUNCAO_LUCRO_REAL, getTipoAtividadeLucroReal } from '../constants/tax-tables';
import { LucroRealResult, TaxCalculationInput } from '../types';

export class LucroRealService {
  /**
   * Calcula o imposto devido no regime Lucro Real
   */
  static calcular(input: TaxCalculationInput): LucroRealResult {
    const {
      cnae,
      tipo_empresa,
      lucro_liquido_anual,
      aliquota_iss,
      creditos_pis_cofins = 0,
    } = input;

    // Calcular RBA dinamicamente
    const rba = this.calcularRBA(input);

    // 1. Determinar tipo de atividade baseado no CNAE e faturamento
    const tipoAtividade = getTipoAtividadeLucroReal(cnae, rba);
    const presuncoes = PRESUNCAO_LUCRO_REAL[tipoAtividade];

    // 2. Calcular lucro presumido baseado no tipo de atividade
    const lucroPresumidoIrpj = rba * presuncoes.IRPJ;
    const lucroPresumidoCsll = rba * presuncoes.CSLL;

    // 3. Usar o menor valor entre lucro real e lucro presumido
    const lucroLiquido = Math.min(lucro_liquido_anual, lucroPresumidoIrpj);

    // 4. Calcular IRPJ (15% sobre o lucro)
    const irpj = lucroLiquido * ALIQUOTAS.IRPJ;

    // 5. Calcular adicional de IRPJ (10% sobre o que exceder R$ 20.000/mês)
    // Limite anual = R$ 20.000 x 12 = R$ 240.000
    const limiteAnual = ALIQUOTAS.LIMITE_ADICIONAL_ANUAL;
    const adicionalIrpj = lucroLiquido > limiteAnual
      ? (lucroLiquido - limiteAnual) * ALIQUOTAS.IRPJ_ADICIONAL
      : 0;

    // 6. Calcular CSLL (9% sobre o lucro)
    const csll = Math.min(lucro_liquido_anual, lucroPresumidoCsll) * ALIQUOTAS.CSLL;

    // 7. Calcular PIS (1,65% sobre o faturamento - regime não-cumulativo)
    const pis = rba * ALIQUOTAS.PIS_NAO_CUMULATIVO;

    // 8. Calcular COFINS (7,6% sobre o faturamento - regime não-cumulativo)
    const cofins = rba * ALIQUOTAS.COFINS_NAO_CUMULATIVO;

    // 9. Aplicar créditos de PIS/COFINS (direito a créditos no regime não-cumulativo)
    const pisCofinsLiquido = Math.max(0, (pis + cofins) - creditos_pis_cofins);

    // 10. Calcular ISS (alíquota municipal sobre o faturamento de serviços)
    const iss = tipo_empresa === 'serviço'
      ? rba * aliquota_iss
      : 0;

    // 11. Somar todos os impostos
    const impostoTotal = irpj + adicionalIrpj + csll + pisCofinsLiquido + iss;

    // 12. Calcular alíquota efetiva
    const aliquotaEfetiva = (impostoTotal / rba) * 100;

    // 13. Montar resultado
    const resultado: LucroRealResult = {
      lucro_liquido: lucroLiquido,
      irpj,
      adicional_irpj: adicionalIrpj,
      csll,
      pis,
      cofins,
      creditos_pis_cofins,
      pis_cofins_liquido: pisCofinsLiquido,
      iss,
      imposto_total: impostoTotal,
      aliquota_efetiva: aliquotaEfetiva,
    };

    return resultado;
  }

  /**
   * Verifica se a empresa está obrigada ao Lucro Real
   */
  static isObrigatorioLucroReal(rba: number): boolean {
    return rba > ALIQUOTAS.LIMITE_ANUAL_REAL;
  }

  /**
   * Calcula a economia potencial com créditos de PIS/COFINS
   */
  static calcularCreditosPotenciais(despesasDedutiveis: number): number {
    // Créditos potenciais sobre despesas dedutíveis (aproximado)
    const creditoPis = despesasDedutiveis * ALIQUOTAS.PIS_NAO_CUMULATIVO;
    const creditoCofins = despesasDedutiveis * ALIQUOTAS.COFINS_NAO_CUMULATIVO;
    return creditoPis + creditoCofins;
  }

  /**
   * Demonstra o cálculo do Lucro Real com presunções
   */
  static demonstrarCalculo(input: TaxCalculationInput): {
    tipoAtividade: string;
    presuncoes: { IRPJ: number; CSLL: number };
    lucroPresumidoIrpj: number;
    lucroPresumidoCsll: number;
    lucroUtilizado: number;
    detalhes: string;
  } {
    const rba = this.calcularRBA(input);
    const tipoAtividade = getTipoAtividadeLucroReal(input.cnae, rba);
    const presuncoes = PRESUNCAO_LUCRO_REAL[tipoAtividade];
    
    const lucroPresumidoIrpj = rba * presuncoes.IRPJ;
    const lucroPresumidoCsll = rba * presuncoes.CSLL;
    const lucroUtilizado = Math.min(input.lucro_liquido_anual, lucroPresumidoIrpj);
    
    const detalhes = `
      Tipo de Atividade: ${tipoAtividade}
      Presunção IRPJ: ${(presuncoes.IRPJ * 100).toFixed(1)}%
      Presunção CSLL: ${(presuncoes.CSLL * 100).toFixed(1)}%
      Lucro Presumido IRPJ: R$ ${lucroPresumidoIrpj.toLocaleString('pt-BR')}
      Lucro Presumido CSLL: R$ ${lucroPresumidoCsll.toLocaleString('pt-BR')}
      Lucro Real: R$ ${input.lucro_liquido_anual.toLocaleString('pt-BR')}
      Lucro Utilizado: R$ ${lucroUtilizado.toLocaleString('pt-BR')}
    `;
    
    return {
      tipoAtividade,
      presuncoes,
      lucroPresumidoIrpj,
      lucroPresumidoCsll,
      lucroUtilizado,
      detalhes
    };
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

