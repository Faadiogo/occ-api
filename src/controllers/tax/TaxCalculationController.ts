import { Response, NextFunction } from 'express';
import { supabase } from '../../config/database';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { BaseController } from '../base/BaseController';
import { TaxCalculationService } from '../../services/tax-calculation.service';
import { Logger } from '../../utils/logger';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { UserRole } from '../../types';

export class TaxCalculationController extends BaseController {
  /**
   * Executa cálculo tributário comparativo
   */
  static async calculate(req: AuthRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    try {
      const calculationData = req.body;
      const userId = req.user?.id;

      // Log da operação
      Logger.logBusiness('tax_calculation_start', {
        userId,
        metadata: {
          companyId: calculationData.company_id,
          regime: calculationData.tipo_empresa
        }
      });

      // Executar cálculo
      const result = await TaxCalculationService.calcular(calculationData, userId!);

      // Log do resultado
      Logger.logTaxCalculation(
        calculationData.company_id,
        result.best_regime,
        'completed',
        { 
          userId, 
          metadata: { regime: result.best_regime } 
        }
      );

      // Log de performance
      this.logPerformance('tax_calculation', startTime, {
        userId,
        metadata: { companyId: calculationData.company_id }
      });

      return this.success(res, result, 'Cálculo tributário realizado com sucesso');
    } catch (error) {
      return this.handleError(error, req, res, next);
    }
  }

  /**
   * Lista relatórios de cálculo
   */
  static async listReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { company_id, year, page = 1, limit = 10 } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      let query = supabase
        .from('tax_calculation_reports')
        .select(`
          *,
          company:client_companies(id, company_name, client_id)
        `)
        .order('created_at', { ascending: false });

      if (company_id) {
        query = query.eq('company_id', company_id);
      }

      if (year) {
        query = query.eq('year', year);
      }

      // Aplicar paginação
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);

      const { data: reports, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Filtrar por permissão
      let filteredReports = reports || [];
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
        filteredReports = filteredReports.filter((report: any) => 
          report.company.client_id === userId
        );
      }

      return this.paginated(res, filteredReports, Number(page), Number(limit), count || 0);
    } catch (error) {
      return this.handleError(error, req, res, next);
    }
  }

  /**
   * Obtém relatório específico
   */
  static async getReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const { data: report, error } = await supabase
        .from('tax_calculation_reports')
        .select(`
          *,
          company:client_companies(id, company_name, client_id),
          client:client_companies!inner(clients(id, name, email))
        `)
        .eq('id', reportId)
        .single();

      if (error || !report) {
        throw new NotFoundError('Relatório não encontrado');
      }

      console.log('📊 Dados do relatório do banco:', {
        id: report.id,
        company_id: report.company_id,
        rba: report.rba,
        rbaa: report.rbaa,
        tipo_atividade: report.tipo_atividade,
        jan_atual: report.jan_atual,
        fev_atual: report.fev_atual,
        mar_atual: report.mar_atual,
        abr_atual: report.abr_atual,
        mai_atual: report.mai_atual,
        jun_atual: report.jun_atual,
        jul_atual: report.jul_atual,
        ago_atual: report.ago_atual,
        set_atual: report.set_atual,
        out_atual: report.out_atual,
        nov_atual: report.nov_atual,
        dez_atual: report.dez_atual
      });

      // Verificar permissão
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && report.company.client_id !== userId) {
        throw new ForbiddenError('Acesso negado ao relatório');
      }

      // Criar dados de resultado baseados nos dados salvos
      console.log('🔄 Criando dados de resultado para relatório:', reportId);
      console.log('📊 Dados do relatório:', {
        company_id: report.company_id,
        tipo_atividade: report.tipo_atividade,
        rba: report.rba,
        rbaa: report.rbaa
      });

      // Calcular RBT12 baseado nos dados mensais
      const rbt12 = (report.jan_atual || 0) + (report.fev_atual || 0) + (report.mar_atual || 0) + 
                   (report.abr_atual || 0) + (report.mai_atual || 0) + (report.jun_atual || 0) + 
                   (report.jul_atual || 0) + (report.ago_atual || 0) + (report.set_atual || 0) + 
                   (report.out_atual || 0) + (report.nov_atual || 0) + (report.dez_atual || 0);

      console.log('🧮 RBT12 calculado:', rbt12);

      // Criar dados de evolução mensal baseados nos dados salvos
      const dadosMensais = [
        { mes: 'Janeiro', mes_numero: 1, faturamento_mes: report.jan_atual || 0 },
        { mes: 'Fevereiro', mes_numero: 2, faturamento_mes: report.fev_atual || 0 },
        { mes: 'Março', mes_numero: 3, faturamento_mes: report.mar_atual || 0 },
        { mes: 'Abril', mes_numero: 4, faturamento_mes: report.abr_atual || 0 },
        { mes: 'Maio', mes_numero: 5, faturamento_mes: report.mai_atual || 0 },
        { mes: 'Junho', mes_numero: 6, faturamento_mes: report.jun_atual || 0 },
        { mes: 'Julho', mes_numero: 7, faturamento_mes: report.jul_atual || 0 },
        { mes: 'Agosto', mes_numero: 8, faturamento_mes: report.ago_atual || 0 },
        { mes: 'Setembro', mes_numero: 9, faturamento_mes: report.set_atual || 0 },
        { mes: 'Outubro', mes_numero: 10, faturamento_mes: report.out_atual || 0 },
        { mes: 'Novembro', mes_numero: 11, faturamento_mes: report.nov_atual || 0 },
        { mes: 'Dezembro', mes_numero: 12, faturamento_mes: report.dez_atual || 0 }
      ];

      // Calcular RBT12 para cada mês e criar dados de evolução mensal
      const evolucaoMensal = dadosMensais.map((dados, index) => {
        // Calcular RBT12 (soma dos últimos 12 meses a partir do mês atual)
        let rbt12 = 0;
        for (let i = 0; i <= index; i++) {
          rbt12 += dadosMensais[i].faturamento_mes;
        }

        // Se não é o primeiro mês, incluir dados do ano anterior se necessário
        if (index > 0) {
          const mesesAnoAnterior = [
            report.jan_anterior || 0, report.fev_anterior || 0, report.mar_anterior || 0,
            report.abr_anterior || 0, report.mai_anterior || 0, report.jun_anterior || 0,
            report.jul_anterior || 0, report.ago_anterior || 0, report.set_anterior || 0,
            report.out_anterior || 0, report.nov_anterior || 0, report.dez_anterior || 0
          ];

          // Adicionar meses do ano anterior se necessário para completar 12 meses
          const mesesRestantes = 12 - (index + 1);
          for (let i = 0; i < mesesRestantes && i < mesesAnoAnterior.length; i++) {
            rbt12 += mesesAnoAnterior[11 - i]; // Pegar do último mês do ano anterior
          }
        }

        // Calcular impostos baseados no faturamento do mês
        const aliquotaNominal = 0.06; // 6% para Anexo III
        const parcelaDeduzir = 0; // Sem parcela a deduzir na 1ª faixa
        const impostoMes = (dados.faturamento_mes * aliquotaNominal) - parcelaDeduzir;
        const aliquotaEfetiva = dados.faturamento_mes > 0 ? (impostoMes / dados.faturamento_mes) * 100 : 0;

        return {
          mes: dados.mes,
          mes_numero: dados.mes_numero,
          faturamento_mes: dados.faturamento_mes,
          rbt12: rbt12,
          anexo: 'Anexo III',
          faixa_faturamento: '1ª Faixa',
          aliquota_nominal: aliquotaNominal * 100,
          parcela_deduzir: parcelaDeduzir,
          aliquota_efetiva: aliquotaEfetiva,
          imposto_mes: impostoMes
        };
      });

      console.log('📈 Evolução mensal criada:', evolucaoMensal);

      // Criar dados de resultado mockados baseados nos dados salvos
      const mockResults = {
        best_regime: 'Simples Nacional',
        economia_melhor_regime: 0,
        calculation_data: {
          rba: report.rba || 0,
          rbaa: report.rbaa || 0,
          rbt12: rbt12,
          tipo_empresa: report.tipo_atividade ? 'serviço' : 'comércio'
        },
        simples_nacional_result: {
          anexo: 'Anexo III',
          faixa: '1ª Faixa',
          aliquota_nominal: 0.06,
          parcela_deduzir: 0,
          aliquota_efetiva: 0.06,
          imposto_total: rbt12 * 0.06
        },
        lucro_presumido_result: {
          percentual_presuncao: 8.0,
          lucro_presumido: (report.rba || 0) * 0.08,
          irpj: (report.rba || 0) * 0.08 * 0.15,
          csll: (report.rba || 0) * 0.08 * 0.09,
          pis: (report.rba || 0) * 0.0065,
          cofins: (report.rba || 0) * 0.03,
          iss: (report.rba || 0) * (report.aliquota_iss || 0),
          icms: (report.rba || 0) * (report.aliquota_icms || 0),
          imposto_total: 0,
          aliquota_efetiva: 0
        },
        lucro_real_result: {
          lucro_liquido: report.lucro_liquido_anual || 0,
          irpj: (report.lucro_liquido_anual || 0) * 0.15,
          csll: (report.lucro_liquido_anual || 0) * 0.09,
          pis: (report.rba || 0) * 0.0065,
          cofins: (report.rba || 0) * 0.03,
          creditos_pis_cofins: report.creditos_pis_cofins || 0,
          iss: (report.rba || 0) * (report.aliquota_iss || 0),
          imposto_total: 0,
          aliquota_efetiva: 0
        },
        faturamento_mensal: evolucaoMensal,
        evolucao_mensal: evolucaoMensal
      };

      // Calcular totais dos impostos
      mockResults.lucro_presumido_result.imposto_total = 
        mockResults.lucro_presumido_result.irpj + 
        mockResults.lucro_presumido_result.csll + 
        mockResults.lucro_presumido_result.pis + 
        mockResults.lucro_presumido_result.cofins + 
        mockResults.lucro_presumido_result.iss + 
        mockResults.lucro_presumido_result.icms;

      mockResults.lucro_real_result.imposto_total = 
        mockResults.lucro_real_result.irpj + 
        mockResults.lucro_real_result.csll + 
        mockResults.lucro_real_result.pis + 
        mockResults.lucro_real_result.cofins - 
        mockResults.lucro_real_result.creditos_pis_cofins + 
        mockResults.lucro_real_result.iss;

      // Calcular alíquotas efetivas
      if (report.rba > 0) {
        mockResults.lucro_presumido_result.aliquota_efetiva = (mockResults.lucro_presumido_result.imposto_total / report.rba) * 100;
        mockResults.lucro_real_result.aliquota_efetiva = (mockResults.lucro_real_result.imposto_total / report.rba) * 100;
      }

      // Determinar melhor regime
      const impostos = [
        { regime: 'Simples Nacional', valor: mockResults.simples_nacional_result.imposto_total },
        { regime: 'Lucro Presumido', valor: mockResults.lucro_presumido_result.imposto_total },
        { regime: 'Lucro Real', valor: mockResults.lucro_real_result.imposto_total }
      ];

      const melhorRegime = impostos.reduce((min, current) => 
        current.valor < min.valor ? current : min
      );

      mockResults.best_regime = melhorRegime.regime;
      mockResults.economia_melhor_regime = Math.max(...impostos.map(i => i.valor)) - melhorRegime.valor;

      console.log('✅ Dados de resultado criados:', {
        best_regime: mockResults.best_regime,
        economia: mockResults.economia_melhor_regime,
        has_simples: !!mockResults.simples_nacional_result,
        has_presumido: !!mockResults.lucro_presumido_result,
        has_real: !!mockResults.lucro_real_result
      });

      // Combinar dados do banco com resultados mockados
      const reportWithResults = {
        ...report,
        ...mockResults
      };

      console.log('📋 Relatório final combinado:', {
        id: reportWithResults.id,
        company_id: reportWithResults.company_id,
        best_regime: reportWithResults.best_regime,
        has_simples: !!reportWithResults.simples_nacional_result,
        has_presumido: !!reportWithResults.lucro_presumido_result,
        has_real: !!reportWithResults.lucro_real_result,
        has_evolucao: !!reportWithResults.evolucao_mensal,
        has_calculation_data: !!reportWithResults.calculation_data
      });

      return this.success(res, reportWithResults, 'Relatório encontrado');
    } catch (error) {
      return this.handleError(error, req, res, next);
    }
  }

  /**
   * Deleta relatório
   */
  static async deleteReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Verificar se o relatório existe e se o usuário tem permissão
      const { data: existingReport, error: fetchError } = await supabase
        .from('tax_calculation_reports')
        .select(`
          *,
          company:client_companies(id, client_id)
        `)
        .eq('id', reportId)
        .single();

      if (fetchError || !existingReport) {
        throw new NotFoundError('Relatório não encontrado');
      }

      if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && existingReport.company.client_id !== userId) {
        throw new ForbiddenError('Acesso negado ao relatório');
      }

      const { error } = await supabase
        .from('tax_calculation_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        throw new Error(error.message);
      }

      return this.success(res, null, 'Relatório deletado com sucesso');
    } catch (error) {
      return this.handleError(error, req, res, next);
    }
  }
}
