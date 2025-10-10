import { Router } from 'express';
import adminRoutes from './admin.routes';
import clientAuthRoutes from './client_auth.routes';
import postRoutes from './post.routes';
import categoryRoutes from './category.routes';
import clientRoutes from './client.routes';
import surveyRoutes from './survey.routes';
import taxRoutes from './tax.routes';
import uploadRoutes from './upload.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'API OCC V2 rodando!', 
    timestamp: new Date().toISOString() 
  });
});

// Rotas da API V2
router.use('/admin', adminRoutes);           // Autenticação e gestão de admins
router.use('/client-auth', clientAuthRoutes); // Autenticação de clientes
router.use('/posts', postRoutes);
router.use('/categories', categoryRoutes);
router.use('/clients', clientRoutes);        // Gestão de clientes (admin)
router.use('/surveys', surveyRoutes);
router.use('/tax-plans', taxRoutes);
router.use('/upload', uploadRoutes);         // Upload de imagens

export default router;

