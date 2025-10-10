import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/database';
import { JWTUtils } from '../utils/jwt';
import { ApiResponse } from '../utils/response';
import { UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;

      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new ConflictError('Email já cadastrado');
      }

      // Buscar role_id
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role || 'CLIENT')
        .single();

      if (roleError || !roleData) {
        throw new NotFoundError('Role não encontrada');
      }

      // Hash da senha
      const password_hash = await bcrypt.hash(password, 10);

      // Criar usuário
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          password_hash,
          role_id: roleData.id,
        })
        .select('id, name, email')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Gerar tokens
      const tokens = JWTUtils.generateTokenPair({
        id: user.id,
        email: user.email,
        role: role || 'CLIENT',
      });

      return ApiResponse.created(res, { user, ...tokens }, 'Usuário registrado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Buscar usuário com role
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          password_hash,
          role:roles(name)
        `)
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new UnauthorizedError('Email ou senha inválidos');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Email ou senha inválidos');
      }

      // Gerar tokens
      const tokens = JWTUtils.generateTokenPair({
        id: user.id,
        email: user.email,
        role: (user.role as any).name,
      });

      return ApiResponse.success(res, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user.role as any).name,
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

      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          created_at,
          role:roles(name, description)
        `)
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new NotFoundError('Usuário não encontrado');
      }

      return ApiResponse.success(res, user, 'Dados do usuário');
    } catch (error) {
      return next(error);
    }
  }
}

