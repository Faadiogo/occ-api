import { Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { ApiResponse } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export class PostController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, published, category_id } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabase
        .from('posts')
        .select(`
          *,
          author:admins(id, name, email),
          category:categories(id, name, slug)
        `, { count: 'exact' });

      if (published !== undefined) {
        query = query.eq('published', published === 'true');
      }

      if (category_id) {
        query = query.eq('category_id', category_id);
      }

      const { data: posts, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.paginated(res, posts || [], Number(page), Number(limit), count || 0);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:admins(id, name, email),
          category:categories(id, name, slug)
        `)
        .eq('id', id)
        .single();

      if (error || !post) {
        throw new NotFoundError('Post não encontrado');
      }

      return ApiResponse.success(res, post, 'Post encontrado');
    } catch (error) {
      return next(error);
    }
  }

  static async getBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:admins(id, name, email),
          category:categories(id, name, slug)
        `)
        .eq('slug', slug)
        .single();

      if (error || !post) {
        throw new NotFoundError('Post não encontrado');
      }

      return ApiResponse.success(res, post, 'Post encontrado');
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, slug, content, cover_image, category_id, published } = req.body;
      const author_id = req.user?.id;

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          title,
          slug,
          content,
          cover_image,
          author_id,
          category_id,
          published: published || false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, post, 'Post criado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data: post, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !post) {
        throw new NotFoundError('Post não encontrado');
      }

      return ApiResponse.success(res, post, 'Post atualizado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new NotFoundError('Post não encontrado');
      }

      return ApiResponse.success(res, null, 'Post deletado com sucesso');
    } catch (error) {
      return next(error);
    }
  }
}

