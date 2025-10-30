import { TaxCalculationInput, MonthlyEvolution } from '../types';
import { SimplesNacionalService } from './simples-nacional.service';

export class MonthlyEvolutionService {
  /**
   * Calcula a evolução mensal da RBT12 e alíquota efetiva do Simples Nacional
   */
  static calcularEvolucaoMensal(input: TaxCalculationInput): MonthlyEvolution[] {
    const evolucao: MonthlyEvolution[] = [];
    
    // Dados mensais do ano atual
    const mesesAtual = [
      { nome: 'Janeiro', numero: 1, valor: input.jan || 0 },
      { nome: 'Fevereiro', numero: 2, valor: input.fev || 0 },
      { nome: 'Março', numero: 3, valor: input.mar || 0 },
      { nome: 'Abril', numero: 4, valor: input.abr || 0 },
      { nome: 'Maio', numero: 5, valor: input.mai || 0 },
      { nome: 'Junho', numero: 6, valor: input.jun || 0 },
      { nome: 'Julho', numero: 7, valor: input.jul || 0 },
      { nome: 'Agosto', numero: 8, valor: input.ago || 0 },
      { nome: 'Setembro', numero: 9, valor: input.set || 0 },
      { nome: 'Outubro', numero: 10, valor: input.out || 0 },
      { nome: 'Novembro', numero: 11, valor: input.nov || 0 },
      { nome: 'Dezembro', numero: 12, valor: input.dez || 0 }
    ];

    // Dados mensais do ano anterior
    const mesesAnterior = [
      { nome: 'Janeiro', numero: 1, valor: input.jan_anterior || 0 },
      { nome: 'Fevereiro', numero: 2, valor: input.fev_anterior || 0 },
      { nome: 'Março', numero: 3, valor: input.mar_anterior || 0 },
      { nome: 'Abril', numero: 4, valor: input.abr_anterior || 0 },
      { nome: 'Maio', numero: 5, valor: input.mai_anterior || 0 },
      { nome: 'Junho', numero: 6, valor: input.jun_anterior || 0 },
      { nome: 'Julho', numero: 7, valor: input.jul_anterior || 0 },
      { nome: 'Agosto', numero: 8, valor: input.ago_anterior || 0 },
      { nome: 'Setembro', numero: 9, valor: input.set_anterior || 0 },
      { nome: 'Outubro', numero: 10, valor: input.out_anterior || 0 },
      { nome: 'Novembro', numero: 11, valor: input.nov_anterior || 0 },
      { nome: 'Dezembro', numero: 12, valor: input.dez_anterior || 0 }
    ];

    // Calcular RBT12 para cada mês
    for (let i = 0; i < 12; i++) {
      const mesAtual = mesesAtual[i];
      const faturamentoMes = mesAtual.valor;
      
      // Calcular RBT12: soma dos últimos 12 meses a partir do mês atual
      let rbt12 = 0;
      
      // Para janeiro (i=0): usar apenas meses do ano anterior (jan_anterior até dez_anterior)
      if (i === 0) {
        // Janeiro: soma todos os 12 meses do ano anterior
        for (let k = 0; k < 12; k++) {
          rbt12 += mesesAnterior[k].valor;
        }
      } else {
        // Para os outros meses: combinar meses do ano anterior e atual
        // RBT12 = soma dos 12 meses ANTERIORES ao mês atual (não incluindo o mês atual)
        
        // Adicionar meses do ano atual (do mês ANTERIOR para trás, não incluindo o mês atual)
        for (let j = i - 1; j >= 0; j--) {
          rbt12 += mesesAtual[j].valor;
        }
        
        // Adicionar meses do ano anterior (completando os 12 meses)
        // Para fevereiro (i=1): apenas dez_anterior (índice 11) = 1 mês
        // Para março (i=2): nov_anterior + dez_anterior (índices 10, 11) = 2 meses
        // Para abril (i=3): out_anterior + nov_anterior + dez_anterior (índices 9, 10, 11) = 3 meses
        // E assim por diante...
        const mesesAnteriorNecessarios = 12 - i;
        for (let k = 11; k >= 12 - mesesAnteriorNecessarios; k--) {
          rbt12 += mesesAnterior[k].valor;
        }
      }

      // Calcular alíquota efetiva para este mês
      const inputMes = {
        ...input,
        rbt12: rbt12,
        rba: faturamentoMes * 12 // Estimativa anual baseada no mês
      };

      const resultadoSimples = SimplesNacionalService.calcular(inputMes);
      
      // Calcular imposto do mês (alíquota efetiva sobre o faturamento do mês)
      const impostoMes = faturamentoMes * (resultadoSimples.aliquota_efetiva / 100);

      evolucao.push({
        mes: mesAtual.nome,
        mes_numero: mesAtual.numero,
        faturamento_mes: faturamentoMes,
        rbt12: rbt12,
        anexo: resultadoSimples.anexo,
        faixa_faturamento: resultadoSimples.faixa_faturamento,
        aliquota_nominal: resultadoSimples.aliquota_nominal,
        parcela_deduzir: resultadoSimples.parcela_deduzir,
        aliquota_efetiva: resultadoSimples.aliquota_efetiva,
        imposto_mes: impostoMes
      });
    }

    return evolucao;
  }

  /**
   * Calcula apenas a RBT12 para um mês específico
   */
  static calcularRBT12ParaMes(
    mes: number, 
    mesesAtual: number[], 
    mesesAnterior: number[]
  ): number {
    let rbt12 = 0;
    
    // Para janeiro (mes=1): usar apenas meses do ano anterior
    if (mes === 1) {
      // Janeiro: soma todos os 12 meses do ano anterior
      for (let k = 0; k < 12; k++) {
        rbt12 += mesesAnterior[k] || 0;
      }
    } else {
      // Para os outros meses: combinar meses do ano anterior e atual
      // Adicionar meses do ano atual (do mês atual para trás)
      for (let j = mes - 1; j >= 0; j--) {
        rbt12 += mesesAtual[j] || 0;
      }
      
      // Adicionar meses do ano anterior (completando os 12 meses)
      const mesesRestantes = 11 - (mes - 1);
      for (let k = 11; k >= 12 - mesesRestantes; k--) {
        rbt12 += mesesAnterior[k] || 0;
      }
    }

    return rbt12;
  }
}
