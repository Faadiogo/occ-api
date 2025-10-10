import { z } from 'zod';

export const createSurveySchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  is_active: z.boolean().optional().default(true),
});

export const createQuestionSchema = z.object({
  question_text: z.string().min(5, 'Texto da pergunta deve ter pelo menos 5 caracteres'),
  type: z.enum(['ALTERNATIVA', 'DISSERTATIVA', 'RATING']),
  options: z.array(z.string()).optional(),
  order: z.number().int().min(1),
});

export const surveyWithQuestionsSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  is_active: z.boolean().optional().default(true),
  questions: z.array(createQuestionSchema),
});

export const submitResponseSchema = z.object({
  answers: z.array(
    z.object({
      question_id: z.string().uuid('ID da pergunta inválido'),
      answer_text: z.string().min(1, 'Resposta não pode estar vazia'),
    })
  ).min(1, 'Pelo menos uma resposta é obrigatória'),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type SurveyWithQuestionsInput = z.infer<typeof surveyWithQuestionsSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

