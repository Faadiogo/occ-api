import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createPostSchema, updatePostSchema } from '../schemas/post.schema';
import { UserRole } from '../types';

const router = Router();

// Rotas públicas
router.get('/', PostController.list);
router.get('/:id', PostController.getById);
router.get('/slug/:slug', PostController.getBySlug);

// Rotas protegidas (apenas admin)
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createPostSchema),
  PostController.create
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updatePostSchema),
  PostController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  PostController.delete
);

export default router;

