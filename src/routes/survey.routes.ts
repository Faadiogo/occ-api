import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { surveyWithQuestionsSchema, submitResponseSchema } from '../schemas/survey.schema';
import { UserRole } from '../types';

const router = Router();

// Rotas de pesquisas
router.get('/', authenticate, SurveyController.list);
router.get('/:id', authenticate, SurveyController.getById);

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(surveyWithQuestionsSchema),
  SurveyController.create
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  SurveyController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  SurveyController.delete
);

// Rotas de respostas
router.post(
  '/:id/responses',
  authenticate,
  validate(submitResponseSchema),
  SurveyController.submitResponse
);

router.get(
  '/:id/responses',
  authenticate,
  authorize(UserRole.ADMIN),
  SurveyController.getResponses
);

export default router;

