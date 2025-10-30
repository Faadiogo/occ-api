import { Router } from 'express';
import { TaxController } from '../controllers/tax.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { taxCalculationSchema } from '../schemas/tax-calculation.schema';
import { UserRole } from '../types';

const router = Router();


// ============================================
// ROTAS DE CÁLCULO TRIBUTÁRIO
// ============================================

// Calcular planejamento tributário comparativo
router.post(
  '/calculate',
  authenticate,
  validate(taxCalculationSchema),
  TaxController.calculate
);

// Listar relatórios de uma empresa
router.get(
  '/reports/company/:companyId',
  authenticate,
  TaxController.getReportsByCompany
);

// Buscar detalhes de um relatório específico
router.get(
  '/reports/detail/:reportId',
  authenticate,
  TaxController.getReportDetail
);

// Deletar relatório
router.delete(
  '/reports/:reportId',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TaxController.deleteReport
);

export default router;

