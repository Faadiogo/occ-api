import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createCategorySchema } from '../schemas/post.schema';
import { UserRole } from '../types';

const router = Router();

// Rotas públicas
router.get('/', CategoryController.list);
router.get('/:id', CategoryController.getById);

// Rotas protegidas (apenas admin)
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createCategorySchema),
  CategoryController.create
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createCategorySchema),
  CategoryController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  CategoryController.delete
);

export default router;

