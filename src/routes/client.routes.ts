import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createClientSchema, updateClientSchema, createDocumentSchema } from '../schemas/client.schema';
import { UserRole } from '../types';

const router = Router();

// Rotas de clientes
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
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
  authorize(UserRole.ADMIN),
  validate(createClientSchema),
  ClientController.create
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateClientSchema),
  ClientController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  ClientController.delete
);

// Rotas de documentos
router.get(
  '/:clientId/documents',
  authenticate,
  ClientController.listDocuments
);

router.post(
  '/:clientId/documents',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createDocumentSchema),
  ClientController.createDocument
);

router.delete(
  '/:clientId/documents/:documentId',
  authenticate,
  authorize(UserRole.ADMIN),
  ClientController.deleteDocument
);

export default router;

