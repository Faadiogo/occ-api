import { Router } from 'express';
import { ClientAuthController } from '../controllers/client_auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').optional(),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos').optional(),
  regime_tributario: z.enum(['Simples Nacional', 'Lucro Presumido', 'Lucro Real']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Senha atual deve ter pelo menos 6 caracteres'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
});

// Rotas públicas
router.post('/login', validate(loginSchema), ClientAuthController.login);
router.post('/refresh', validate(refreshTokenSchema), ClientAuthController.refresh);

// Rotas autenticadas
router.get('/me', authenticate, ClientAuthController.me);
router.put('/profile', authenticate, validate(updateProfileSchema), ClientAuthController.updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), ClientAuthController.changePassword);

export default router;
