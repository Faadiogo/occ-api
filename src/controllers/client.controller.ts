import { Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { ApiResponse } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ClientController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { data: clients, error, count } = await supabase
        .from('clients')
        .select(`
          *,
          user:users(id, name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.paginated(res, clients || [], Number(page), Number(limit), count || 0);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      const { data: client, error } = await supabase
        .from('clients')
        .select(`
          *,
          user:users(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      // Verificar se o usuário pode acessar este cliente
      if (userRole !== 'ADMIN' && client.user_id !== userId) {
        throw new ForbiddenError('Você não tem permissão para acessar este cliente');
      }

      return ApiResponse.success(res, client, 'Cliente encontrado');
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { user_id, company_name, cnpj, regime_tributario } = req.body;

      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          user_id,
          company_name,
          cnpj,
          regime_tributario,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, client, 'Cliente criado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data: client, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      return ApiResponse.success(res, client, 'Cliente atualizado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        throw new NotFoundError('Cliente não encontrado');
      }

      return ApiResponse.success(res, null, 'Cliente deletado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  // Métodos para documentos
  static async listDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;

      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploaded_by_user:users!documents_uploaded_by_fkey(id, name)
        `)
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.success(res, documents || [], 'Documentos listados');
    } catch (error) {
      return next(error);
    }
  }

  static async createDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const { title, file_url } = req.body;
      const uploaded_by = req.user?.id;

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          client_id: clientId,
          title,
          file_url,
          uploaded_by,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, document, 'Documento criado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async deleteDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        throw new NotFoundError('Documento não encontrado');
      }

      return ApiResponse.success(res, null, 'Documento deletado com sucesso');
    } catch (error) {
      return next(error);
    }
  }
}

