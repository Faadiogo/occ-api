import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/database';
import { JWTUtils } from '../utils/jwt';
import { ApiResponse } from '../utils/response';
import { UnauthorizedError, ConflictError, NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AdminController {
  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Buscar administrador
      const { data: admin, error } = await supabase
        .from('admins')
        .select('id, name, email, password_hash, role')
        .eq('email', email)
        .single();

      if (error || !admin) {
        throw new UnauthorizedError('Email ou senha inválidos');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Email ou senha inválidos');
      }

      // Gerar tokens
      const tokens = JWTUtils.generateTokenPair({
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });

      return ApiResponse.success(res, {
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        ...tokens,
      }, 'Login realizado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      const payload = JWTUtils.verifyToken(refreshToken);

      const tokens = JWTUtils.generateTokenPair({
        id: payload.id,
        email: payload.email,
        role: payload.role,
      });

      return ApiResponse.success(res, tokens, 'Token renovado com sucesso');
    } catch (error) {
      return next(new UnauthorizedError('Refresh token inválido'));
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.id;

      const { data: admin, error } = await supabase
        .from('admins')
        .select('id, name, email, role, created_at, updated_at')
        .eq('id', adminId)
        .single();

      if (error || !admin) {
        throw new NotFoundError('Administrador não encontrado');
      }

      return ApiResponse.success(res, admin, 'Dados do administrador');
    } catch (error) {
      return next(error);
    }
  }

  static async createClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, company_name, cnpj, regime_tributario, cnae, cnaes_secundarios } = req.body;
      const created_by = req.user?.id;

      // Verificar se o email já existe
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email)
        .single();

      if (existingClient) {
        throw new ConflictError('Email já cadastrado');
      }

      // Hash da senha
      const password_hash = await bcrypt.hash(password, 10);

      // Criar cliente
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          name,
          email,
          password_hash,
          created_by,
        })
        .select('id, name, email, created_at')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Criar empresa do cliente
      const { data: company, error: companyError } = await supabase
        .from('client_companies')
        .insert({
          client_id: client.id,
          company_name,
          cnpj,
          regime_tributario,
          cnae,
          cnaes_secundarios: cnaes_secundarios || [],
        })
        .select()
        .single();

      if (companyError) {
        // Se falhou ao criar empresa, deletar cliente
        await supabase.from('clients').delete().eq('id', client.id);
        throw new Error(companyError.message);
      }

      return ApiResponse.created(res, {
        client: {
          ...client,
          company: company
        }
      }, 'Cliente criado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async listClients(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;

      // Se não houver parâmetros de paginação, retorna todos
      if (!page && !limit) {
        const { data: clients, error } = await supabase
          .from('clients')
          .select(`
            *,
            company:client_companies(*),
            created_by_admin:admins!clients_created_by_fkey(id, name, email)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        // Transformar company de array para objeto (relação 1:1)
        const clientsFormatted = (clients || []).map((client: any) => ({
          ...client,
          company: Array.isArray(client.company) ? client.company[0] : client.company,
        }));

        return ApiResponse.success(res, clientsFormatted, 'Clientes listados');
      }

      // Com paginação
      const offset = (Number(page) - 1) * Number(limit);

      const { data: clients, error, count } = await supabase
        .from('clients')
        .select(`
          *,
          company:client_companies(*),
          created_by_admin:admins!clients_created_by_fkey(id, name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        throw new Error(error.message);
      }

      // Transformar company de array para objeto (relação 1:1)
      const clientsFormatted = (clients || []).map((client: any) => ({
        ...client,
        company: Array.isArray(client.company) ? client.company[0] : client.company,
      }));

      return ApiResponse.paginated(res, clientsFormatted, Number(page), Number(limit), count || 0);
    } catch (error) {
      return next(error);
    }
  }

  static async getClientById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: client, error } = await supabase
        .from('clients')
        .select(`
          *,
          company:client_companies(*),
          created_by_admin:admins!clients_created_by_fkey(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      // Transformar company de array para objeto (relação 1:1)
      const clientFormatted = {
        ...client,
        company: Array.isArray(client.company) ? client.company[0] : client.company,
      };

      return ApiResponse.success(res, clientFormatted, 'Cliente encontrado');
    } catch (error) {
      return next(error);
    }
  }

  static async updateClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, email, company_name, cnpj, regime_tributario, cnae, cnaes_secundarios } = req.body;

      // Atualizar dados do cliente
      const { data: client, error } = await supabase
        .from('clients')
        .update({ name, email })
        .eq('id', id)
        .select()
        .single();

      if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      // Atualizar dados da empresa
      const { data: company, error: companyError } = await supabase
        .from('client_companies')
        .update({ 
          company_name, 
          cnpj, 
          regime_tributario, 
          cnae,
          cnaes_secundarios: cnaes_secundarios || []
        })
        .eq('client_id', id)
        .select()
        .single();

      if (companyError) {
        throw new Error(companyError.message);
      }

      return ApiResponse.success(res, {
        ...client,
        company: company
      }, 'Cliente atualizado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async deleteClient(req: AuthRequest, res: Response, next: NextFunction) {
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

  // ============================================
  // GESTÃO DE ADMINISTRADORES (SUPER_ADMIN)
  // ============================================

  static async createAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role;
      
      // Apenas SUPER_ADMIN pode criar outros admins
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Apenas super administradores podem criar outros admins');
      }

      const { name, email, password, role } = req.body;

      // Verificar se o email já existe
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .single();

      if (existingAdmin) {
        throw new ConflictError('Email já cadastrado');
      }

      // Validar role (apenas ADMIN ou SUPER_ADMIN são permitidos)
      const adminRole = role && (role === 'SUPER_ADMIN' || role === 'ADMIN') ? role : 'ADMIN';

      // Hash da senha
      const password_hash = await bcrypt.hash(password, 10);

      // Criar admin
      const { data: admin, error } = await supabase
        .from('admins')
        .insert({
          name,
          email,
          password_hash,
          role: adminRole
        })
        .select('id, name, email, role, created_at')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, admin, 'Administrador criado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async listAdmins(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role;
      
      // Apenas SUPER_ADMIN pode listar outros admins
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Apenas super administradores podem listar outros admins');
      }

      const { data: admins, error } = await supabase
        .from('admins')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.success(res, admins || [], 'Administradores listados');
    } catch (error) {
      return next(error);
    }
  }

  static async getAdminById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role;
      
      // Apenas SUPER_ADMIN pode ver outros admins
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Apenas super administradores podem ver outros admins');
      }

      const { id } = req.params;

      const { data: admin, error } = await supabase
        .from('admins')
        .select('id, name, email, role, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error || !admin) {
        throw new NotFoundError('Administrador não encontrado');
      }

      return ApiResponse.success(res, admin, 'Administrador encontrado');
    } catch (error) {
      return next(error);
    }
  }

  static async updateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role;
      
      // Apenas SUPER_ADMIN pode atualizar outros admins
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Apenas super administradores podem atualizar outros admins');
      }

      const { id } = req.params;
      const { name, email, password, role } = req.body;

      // Verificar se o admin existe
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('id, role')
        .eq('id', id)
        .single();

      if (!existingAdmin) {
        throw new NotFoundError('Administrador não encontrado');
      }

      // Preparar dados para atualização
      const updateData: any = { name, email };
      
      // Se uma nova senha foi fornecida, hashear e adicionar
      if (password) {
        updateData.password_hash = await bcrypt.hash(password, 10);
      }
      
      // Se um role foi fornecido e é válido, adicionar
      if (role && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
        updateData.role = role;
      }

      const { data: admin, error } = await supabase
        .from('admins')
        .update(updateData)
        .eq('id', id)
        .select('id, name, email, role, updated_at')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.success(res, admin, 'Administrador atualizado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async deleteAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role;
      
      // Apenas SUPER_ADMIN pode deletar outros admins
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Apenas super administradores podem deletar outros admins');
      }

      const { id } = req.params;

      // Verificar se o admin existe e não é SUPER_ADMIN
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('id, role')
        .eq('id', id)
        .single();

      if (!existingAdmin) {
        throw new NotFoundError('Administrador não encontrado');
      }

      // Não permitir deletar SUPER_ADMIN
      if (existingAdmin.role === 'SUPER_ADMIN') {
        throw new ForbiddenError('Não é possível deletar o super administrador');
      }

      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.success(res, null, 'Administrador deletado com sucesso');
    } catch (error) {
      return next(error);
    }
  }
}
