import { Router } from 'express';
import { TaxController } from '../controllers/tax.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTaxPlanSchema, createRevenueSchema, createExpenseSchema } from '../schemas/tax.schema';
import { UserRole } from '../types';

const router = Router();

// Rotas de Plan. Tributário
router.get('/', authenticate, TaxController.list);
router.get('/:id', authenticate, TaxController.getById);

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createTaxPlanSchema),
  TaxController.create
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  TaxController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  TaxController.delete
);

// Rotas de receitas
router.post(
  '/:id/revenues',
  authenticate,
  validate(createRevenueSchema),
  TaxController.addRevenue
);

router.delete(
  '/:id/revenues/:revenueId',
  authenticate,
  TaxController.deleteRevenue
);

// Rotas de despesas
router.post(
  '/:id/expenses',
  authenticate,
  validate(createExpenseSchema),
  TaxController.addExpense
);

router.delete(
  '/:id/expenses/:expenseId',
  authenticate,
  TaxController.deleteExpense
);

export default router;

