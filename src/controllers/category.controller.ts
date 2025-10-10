import { Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { ApiResponse } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export class CategoryController {
  static async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.success(res, categories || [], 'Categorias listadas');
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: category, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !category) {
        throw new NotFoundError('Categoria não encontrada');
      }

      return ApiResponse.success(res, category, 'Categoria encontrada');
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, slug } = req.body;

      const { data: category, error } = await supabase
        .from('categories')
        .insert({ name, slug })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, category, 'Categoria criada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, slug } = req.body;

      const { data: category, error } = await supabase
        .from('categories')
        .update({ name, slug })
        .eq('id', id)
        .select()
        .single();

      if (error || !category) {
        throw new NotFoundError('Categoria não encontrada');
      }

      return ApiResponse.success(res, category, 'Categoria atualizada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw new NotFoundError('Categoria não encontrada');
      }

      return ApiResponse.success(res, null, 'Categoria deletada com sucesso');
    } catch (error) {
      return next(error);
    }
  }
}

