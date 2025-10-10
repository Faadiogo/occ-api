import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/database';
import { JWTUtils } from '../utils/jwt';
import { ApiResponse } from '../utils/response';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ClientAuthController {
  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Buscar cliente
      const { data: client, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          password_hash,
          company:client_companies(*)
        `)
        .eq('email', email)
        .single();

      if (error || !client) {
        throw new UnauthorizedError('Email ou senha inválidos');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, client.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Email ou senha inválidos');
      }

      // Gerar tokens
      const tokens = JWTUtils.generateTokenPair({
        id: client.id,
        email: client.email,
        role: 'CLIENT',
      });

      return ApiResponse.success(res, {
        user: {
          id: client.id,
          name: client.name,
          email: client.email,
          role: 'CLIENT',
          company: client.company
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
      const clientId = req.user?.id;

      const { data: client, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          created_at,
          updated_at,
          company:client_companies(*)
        `)
        .eq('id', clientId)
        .single();

      if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      return ApiResponse.success(res, client, 'Dados do cliente');
    } catch (error) {
      return next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.user?.id;
      const { name, email, company_name, cnpj, regime_tributario } = req.body;

      // Atualizar dados do cliente
      const { data: client, error } = await supabase
        .from('clients')
        .update({ name, email })
        .eq('id', clientId)
        .select()
        .single();

      if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      // Atualizar dados da empresa
      const { data: company, error: companyError } = await supabase
        .from('client_companies')
        .update({ company_name, cnpj, regime_tributario })
        .eq('client_id', clientId)
        .select()
        .single();

      if (companyError) {
        throw new Error(companyError.message);
      }

      return ApiResponse.success(res, {
        ...client,
        company: company
      }, 'Perfil atualizado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clientId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      // Buscar cliente atual
      const { data: client, error } = await supabase
        .from('clients')
        .select('password_hash')
        .eq('id', clientId)
        .single();

      if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, client.password_hash);

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError('Senha atual incorreta');
      }

      // Hash da nova senha
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Atualizar senha
      const { error: updateError } = await supabase
        .from('clients')
        .update({ password_hash: newPasswordHash })
        .eq('id', clientId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return ApiResponse.success(res, null, 'Senha alterada com sucesso');
    } catch (error) {
      return next(error);
    }
  }
}
