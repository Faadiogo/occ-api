import { supabase } from '../config/database';
import {
  TaxCalculationInput,
  TaxCalculationComparison,
  RegimeTributario,
  SimplesNacionalResult,
  LucroPresumidoResult,
  LucroRealResult,
} from '../types';
import { SimplesNacionalService } from './simples-nacional.service';
import { LucroPresumidoService } from './lucro-presumido.service';
import { LucroRealService } from './lucro-real.service';
import { MonthlyEvolutionService } from './monthly-evolution.service';
import { NotFoundError } from '../utils/errors';

export class TaxCalculationService {
  /**
   * Executa o cálculo comparativo entre os três regimes tributários
   */
  static async calcular(
    input: TaxCalculationInput,
    createdBy: string
  ): Promise<TaxCalculationComparison> {
    // 0. Calcular RBA, RBAA e RBT12 dinamicamente baseado nos dados mensais
    const rbaCalculado = this.calcularRBA(input);
    const rbaaCalculado = this.calcularRBAA(input);
    const rbt12Calculado = this.calcularRBT12(input);
    
    // Adicionar valores calculados ao input
    const inputComValores = { 
      ...input, 
      rba: rbaCalculado,
      rbaa: rbaaCalculado,
      rbt12: rbt12Calculado 
    };

    // 1. Validar que a empresa existe e pertence ao cliente
    const { data: company, error: companyError } = await supabase
      .from('client_companies')
      .select('id, client_id, company_name')
      .eq('id', input.company_id)
      .single();

    if (companyError || !company) {
      throw new NotFoundError('Empresa não encontrada');
    }

    // 2. Calcular Simples Nacional
    const simplesNacionalResult = SimplesNacionalService.calcular(inputComValores);

    // 3. Calcular Lucro Presumido
    const lucroPresumidoResult = LucroPresumidoService.calcular(inputComValores);

    // 4. Calcular Lucro Real
    const lucroRealResult = LucroRealService.calcular(inputComValores);

    // 5. Calcular evolução mensal (se dados mensais disponíveis)
    const evolucaoMensal = this.calcularEvolucaoMensalSeDisponivel(inputComValores);

    // 6. Identificar o regime mais vantajoso (menor imposto)
    const { bestRegime, economiaRegime } = this.identificarMelhorRegime(
      simplesNacionalResult,
      lucroPresumidoResult,
      lucroRealResult
    );

    // 7. Organizar dados mensais (se necessário no futuro)
    // const faturamentoMensal = this.organizarDadosMensais(input);

    // 8. Salvar relatório no banco de dados
    console.log('💾 Salvando relatório no banco de dados...');
    console.log('📊 Dados para inserção:', {
      company_id: company.id,
      rba: rbaCalculado,
      rbaa: rbaaCalculado,
      best_regime: bestRegime,
      economia_melhor_regime: economiaRegime
    });
    
    const { data: report, error: reportError } = await supabase
      .from('tax_calculation_reports')
      .insert({
        company_id: company.id,
        // Dados mensais - Ano anterior
        jan_anterior: input.jan_anterior || 0,
        fev_anterior: input.fev_anterior || 0,
        mar_anterior: input.mar_anterior || 0,
        abr_anterior: input.abr_anterior || 0,
        mai_anterior: input.mai_anterior || 0,
        jun_anterior: input.jun_anterior || 0,
        jul_anterior: input.jul_anterior || 0,
        ago_anterior: input.ago_anterior || 0,
        set_anterior: input.set_anterior || 0,
        out_anterior: input.out_anterior || 0,
        nov_anterior: input.nov_anterior || 0,
        dez_anterior: input.dez_anterior || 0,
        // Dados mensais - Ano atual
        jan_atual: input.jan || 0,
        fev_atual: input.fev || 0,
        mar_atual: input.mar || 0,
        abr_atual: input.abr || 0,
        mai_atual: input.mai || 0,
        jun_atual: input.jun || 0,
        jul_atual: input.jul || 0,
        ago_atual: input.ago || 0,
        set_atual: input.set || 0,
        out_atual: input.out || 0,
        nov_atual: input.nov || 0,
        dez_atual: input.dez || 0,
        // Dados específicos para cálculo
        tipo_atividade: input.tipo_atividade || '',
        folha_pagamento_12m: input.folha_pagamento_12m || 0,
        lucro_liquido_anual: input.lucro_liquido_anual || 0,
        aliquota_iss: input.aliquota_iss || 0,
        aliquota_icms: input.aliquota_icms || 0,
        creditos_pis_cofins: input.creditos_pis_cofins || 0,
        // Totais calculados
        rbaa: rbaaCalculado,
        rba: rbaCalculado,
        // Resultados dos cálculos (removidos temporariamente - colunas não existem na tabela atual)
        // best_regime: bestRegime,
        // economia_melhor_regime: economiaRegime,
        // calculation_data: inputComValores,
        // simples_nacional_result: simplesNacionalResult,
        // lucro_presumido_result: lucroPresumidoResult,
        // lucro_real_result: lucroRealResult,
        // faturamento_mensal: evolucaoMensal,
        // evolucao_mensal: evolucaoMensal,
        created_by: createdBy,
      })
      .select()
      .single();

    if (reportError || !report) {
      console.error('❌ Erro ao salvar relatório:', reportError);
      throw new Error('Erro ao salvar relatório: ' + reportError?.message);
    }
    
    console.log('✅ Relatório salvo com sucesso:', report.id);

    // 8. Montar e retornar comparação completa
    const comparison: TaxCalculationComparison = {
      simples_nacional: simplesNacionalResult,
      lucro_presumido: lucroPresumidoResult,
      lucro_real: lucroRealResult,
      best_regime: bestRegime,
      economia_melhor_regime: economiaRegime,
      report_id: report.id,
      evolucao_mensal: evolucaoMensal,
    };

    console.log('📋 Comparação final montada:', {
      best_regime: comparison.best_regime,
      has_simples: !!comparison.simples_nacional,
      has_presumido: !!comparison.lucro_presumido,
      has_real: !!comparison.lucro_real,
      report_id: comparison.report_id
    });

    return comparison;
  }

  /**
   * Calcula a evolução mensal se dados mensais estiverem disponíveis
   */
  private static calcularEvolucaoMensalSeDisponivel(input: TaxCalculationInput): any[] | undefined {
    // Verificar se temos dados mensais do ano atual
    const temDadosMensais = input.jan !== undefined || input.fev !== undefined || 
                           input.mar !== undefined || input.abr !== undefined;
    
    if (!temDadosMensais) {
      return undefined;
    }

    return MonthlyEvolutionService.calcularEvolucaoMensal(input);
  }

  // (método de organização de dados mensais removido por não uso)

  /**
   * Identifica qual regime é mais vantajoso (menor carga tributária)
   */
  private static identificarMelhorRegime(
    simples: SimplesNacionalResult,
    presumido: LucroPresumidoResult,
    real: LucroRealResult
  ): { bestRegime: RegimeTributario; economiaRegime: number } {
    const regimes = [
      { nome: RegimeTributario.SIMPLES_NACIONAL, valor: simples.imposto_total },
      { nome: RegimeTributario.LUCRO_PRESUMIDO, valor: presumido.imposto_total },
      { nome: RegimeTributario.LUCRO_REAL, valor: real.imposto_total },
    ];

    // Ordenar por menor valor de imposto
    regimes.sort((a, b) => a.valor - b.valor);

    const melhorRegime = regimes[0];
    const segundoMelhor = regimes[1];

    // Economia em relação ao segundo melhor
    const economia = segundoMelhor.valor - melhorRegime.valor;

    return {
      bestRegime: melhorRegime.nome,
      economiaRegime: economia,
    };
  }

  /**
   * Lista relatórios de uma empresa específica
   */
  static async listarRelatoriosPorEmpresa(
    companyId: string
  ): Promise<any[]> {
    // Validar acesso à empresa
    const { data: company, error: companyError } = await supabase
      .from('client_companies')
      .select('id, client_id, company_name, clients(id, name)')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new NotFoundError('Empresa não encontrada');
    }

    // Buscar relatórios
    const { data: reports, error: reportsError } = await supabase
      .from('tax_calculation_reports')
      .select(`
        id,
        best_regime,
        calculation_data,
        created_at,
        created_by,
        admins:created_by(name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (reportsError) {
      throw new Error('Erro ao buscar relatórios: ' + reportsError.message);
    }

    return reports || [];
  }

  /**
   * Busca detalhes completos de um relatório específico
   */
  static async buscarRelatorio(
    reportId: string
  ): Promise<any> {
    const { data: report, error } = await supabase
      .from('tax_calculation_reports')
      .select(`
        *,
        client:clients(id, name, email),
        company:client_companies(id, company_name, cnpj),
        admin:admins!tax_calculation_reports_created_by_fkey(name, email)
      `)
      .eq('id', reportId)
      .single();

    if (error || !report) {
      throw new NotFoundError('Relatório não encontrado');
    }

    return report;
  }

  /**
   * Deleta um relatório
   */
  static async deletarRelatorio(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('tax_calculation_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      throw new Error('Erro ao deletar relatório: ' + error.message);
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
   * Calcula RBAA (Receita Bruta Ano Anterior) dinamicamente baseado nos dados mensais do ano anterior
   */
  private static calcularRBAA(input: TaxCalculationInput): number {
    const mesesAnterior = [
      input.jan_anterior || 0, input.fev_anterior || 0, input.mar_anterior || 0, input.abr_anterior || 0,
      input.mai_anterior || 0, input.jun_anterior || 0, input.jul_anterior || 0, input.ago_anterior || 0,
      input.set_anterior || 0, input.out_anterior || 0, input.nov_anterior || 0, input.dez_anterior || 0
    ];

    return mesesAnterior.reduce((sum, val) => sum + val, 0);
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

