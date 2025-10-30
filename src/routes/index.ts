import { Router } from 'express';
import adminRoutes from './admin.routes';
import clientAuthRoutes from './client_auth.routes';
import postRoutes from './post.routes';
import categoryRoutes from './category.routes';
import clientRoutes from './client.routes';
import surveyRoutes from './survey.routes';
import taxRoutes from './tax.routes';
import uploadRoutes from './upload.routes';
import cnaeRoutes from './cnae.routes';
import tipoAtividadeRoutes from './tipo-atividade.routes';
import emailRoutes from './email.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'API OCC rodando!', 
    timestamp: new Date().toISOString() 
  });
});

// Rotas da API
router.use('/admin', adminRoutes);           // Autenticação e gestão de admins
router.use('/client-auth', clientAuthRoutes); // Autenticação de clientes
router.use('/posts', postRoutes);
router.use('/categories', categoryRoutes);
router.use('/clients', clientRoutes);        // Gestão de clientes (admin)
router.use('/surveys', surveyRoutes);
router.use('/tax-plans', taxRoutes);
router.use('/upload', uploadRoutes);         // Upload de imagens
router.use('/cnae', cnaeRoutes);             // Busca de CNAEs
router.use('/tipo-atividade', tipoAtividadeRoutes); // Tipos de atividade
router.use('/email', emailRoutes);              // Envio de e-mails

export default router;

