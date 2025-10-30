import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/database';
import { JWTUtils } from '../utils/jwt';
import { ApiResponse } from '../utils/response';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

export class AuthController {
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;

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
          created_by: '00000000-0000-0000-0000-000000000000', // TODO: Implementar lógica de created_by
        })
        .select('id, name, email')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Gerar tokens
      const tokens = JWTUtils.generateTokenPair({
        id: client.id,
        email: client.email,
        role: UserRole.CLIENT,
      });

      return ApiResponse.created(res, { user: client, ...tokens }, 'Cliente registrado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

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
          password_hash
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
        role: UserRole.CLIENT,
      });

      return ApiResponse.success(res, {
        user: {
          id: client.id,
          name: client.name,
          email: client.email,
          role: UserRole.CLIENT,
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
      const userId = req.user?.id;

      const { data: client, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          created_at
        `)
        .eq('id', userId)
        .single();

      if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      return ApiResponse.success(res, client, 'Dados do cliente');
    } catch (error) {
      return next(error);
    }
  }
}

