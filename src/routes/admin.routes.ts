import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
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

const createClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  regime_tributario: z.enum(['Simples Nacional', 'Lucro Presumido', 'Lucro Real']),
  cnae: z.string().min(1, 'CNAE é obrigatório'),
  cnaes_secundarios: z.array(z.string()).optional(),
});

const updateClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').optional(),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos').optional(),
  regime_tributario: z.enum(['Simples Nacional', 'Lucro Presumido', 'Lucro Real']).optional(),
  cnae: z.string().optional().or(z.literal('')),
  cnaes_secundarios: z.array(z.string()).optional(),
});

const createAdminSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

const updateAdminSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

// Rotas públicas
router.post('/login', validate(loginSchema), AdminController.login);
router.post('/refresh', validate(refreshTokenSchema), AdminController.refresh);

// Rotas autenticadas
router.get('/me', authenticate, AdminController.me);

// Gestão de clientes (todos os admins)
router.post('/clients', authenticate, validate(createClientSchema), AdminController.createClient);
router.get('/clients', authenticate, AdminController.listClients);
router.get('/clients/:id', authenticate, AdminController.getClientById);
router.put('/clients/:id', authenticate, validate(updateClientSchema), AdminController.updateClient);
router.delete('/clients/:id', authenticate, AdminController.deleteClient);

// Gestão de administradores (apenas SUPER_ADMIN)
router.post('/admins', authenticate, validate(createAdminSchema), AdminController.createAdmin);
router.get('/admins', authenticate, AdminController.listAdmins);
router.get('/admins/:id', authenticate, AdminController.getAdminById);
router.put('/admins/:id', authenticate, validate(updateAdminSchema), AdminController.updateAdmin);
router.delete('/admins/:id', authenticate, AdminController.deleteAdmin);

export default router;
