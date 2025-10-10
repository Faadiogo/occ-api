import { Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { ApiResponse } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export class TaxController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { client_id, year } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      let query = supabase
        .from('tax_plans')
        .select(`
          *,
          client:clients(id, company_name, user_id)
        `)
        .order('created_at', { ascending: false });

      if (client_id) {
        query = query.eq('client_id', client_id);
      }

      if (year) {
        query = query.eq('year', year);
      }

      const { data: taxPlans, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Filtrar apenas planos que o usuário pode ver
      let filteredPlans = taxPlans || [];
      if (userRole !== 'ADMIN') {
        filteredPlans = filteredPlans.filter((plan: any) => plan.client.user_id === userId);
      }

      return ApiResponse.success(res, filteredPlans, 'Planejamentos listados');
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const { data: taxPlan, error } = await supabase
        .from('tax_plans')
        .select(`
          *,
          client:clients(id, company_name, user_id, regime_tributario),
          revenues:revenues(*),
          expenses:expenses(*)
        `)
        .eq('id', id)
        .single();

      if (error || !taxPlan) {
        throw new NotFoundError('Plan. Tributário não encontrado');
      }

      // Verificar permissão
      if (userRole !== 'ADMIN' && (taxPlan.client as any).user_id !== userId) {
        throw new ForbiddenError('Você não tem permissão para acessar este planejamento');
      }

      return ApiResponse.success(res, taxPlan, 'Planejamento encontrado');
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { client_id, year } = req.body;

      const { data: taxPlan, error } = await supabase
        .from('tax_plans')
        .insert({
          client_id,
          year,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, taxPlan, 'Planejamento criado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { year } = req.body;

      const { data: taxPlan, error } = await supabase
        .from('tax_plans')
        .update({ year })
        .eq('id', id)
        .select()
        .single();

      if (error || !taxPlan) {
        throw new NotFoundError('Planejamento não encontrado');
      }

      return ApiResponse.success(res, taxPlan, 'Planejamento atualizado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('tax_plans')
        .delete()
        .eq('id', id);

      if (error) {
        throw new NotFoundError('Planejamento não encontrado');
      }

      return ApiResponse.success(res, null, 'Planejamento deletado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  // Receitas
  static async addRevenue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { description, amount, date } = req.body;

      const { data: revenue, error } = await supabase
        .from('revenues')
        .insert({
          tax_plan_id: id,
          description,
          amount,
          date,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, revenue, 'Receita adicionada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async deleteRevenue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { revenueId } = req.params;

      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('id', revenueId);

      if (error) {
        throw new NotFoundError('Receita não encontrada');
      }

      return ApiResponse.success(res, null, 'Receita deletada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  // Despesas
  static async addExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { description, amount, date, category } = req.body;

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          tax_plan_id: id,
          description,
          amount,
          date,
          category,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, expense, 'Despesa adicionada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async deleteExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { expenseId } = req.params;

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        throw new NotFoundError('Despesa não encontrada');
      }

      return ApiResponse.success(res, null, 'Despesa deletada com sucesso');
    } catch (error) {
      return next(error);
    }
  }
}

