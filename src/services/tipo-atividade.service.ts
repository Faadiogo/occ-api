import { supabase } from '../config/database';
import { TipoAtividade } from '../types';

export class TipoAtividadeService {
  /**
   * Lista todos os tipos de atividade ativos
   */
  static async list(): Promise<TipoAtividade[]> {
    try {
      const { data, error } = await supabase
        .from('tipo_atividade')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        throw new Error(`Erro ao buscar tipos de atividade: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro no TipoAtividadeService.list:', error);
      throw error;
    }
  }

  /**
   * Busca um tipo de atividade por ID
   */
  static async findById(id: string): Promise<TipoAtividade | null> {
    try {
      const { data, error } = await supabase
        .from('tipo_atividade')
        .select('*')
        .eq('id', id)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw new Error(`Erro ao buscar tipo de atividade: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro no TipoAtividadeService.findById:', error);
      throw error;
    }
  }

  /**
   * Cria um novo tipo de atividade
   */
  static async create(tipoAtividade: Omit<TipoAtividade, 'id' | 'created_at' | 'updated_at'>): Promise<TipoAtividade> {
    try {
      const { data, error } = await supabase
        .from('tipo_atividade')
        .insert(tipoAtividade)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar tipo de atividade: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro no TipoAtividadeService.create:', error);
      throw error;
    }
  }

  /**
   * Atualiza um tipo de atividade
   */
  static async update(id: string, updates: Partial<Omit<TipoAtividade, 'id' | 'created_at' | 'updated_at'>>): Promise<TipoAtividade> {
    try {
      const { data, error } = await supabase
        .from('tipo_atividade')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar tipo de atividade: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro no TipoAtividadeService.update:', error);
      throw error;
    }
  }

  /**
   * Desativa um tipo de atividade (soft delete)
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tipo_atividade')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao desativar tipo de atividade: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no TipoAtividadeService.delete:', error);
      throw error;
    }
  }
}
