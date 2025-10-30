import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createClientSchema, updateClientSchema } from '../schemas/client.schema';
import { UserRole } from '../types';

const router = Router();

// Rotas de clientes
router.get(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  ClientController.list
);

router.get(
  '/:id',
  authenticate,
  ClientController.getById
);

router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createClientSchema),
  ClientController.create
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateClientSchema),
  ClientController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  ClientController.delete
);


export default router;

