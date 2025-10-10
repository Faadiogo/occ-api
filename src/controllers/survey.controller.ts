import { Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { ApiResponse } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export class SurveyController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { is_active } = req.query;

      let query = supabase
        .from('surveys')
        .select(`
          *,
          created_by_user:users!surveys_created_by_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      if (is_active !== undefined) {
        query = query.eq('is_active', is_active === 'true');
      }

      const { data: surveys, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.success(res, surveys || [], 'Pesquisas listadas');
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: survey, error } = await supabase
        .from('surveys')
        .select(`
          *,
          created_by_user:users!surveys_created_by_fkey(id, name),
          questions:survey_questions(*)
        `)
        .eq('id', id)
        .single();

      if (error || !survey) {
        throw new NotFoundError('Pesquisa não encontrada');
      }

      return ApiResponse.success(res, survey, 'Pesquisa encontrada');
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, is_active, questions } = req.body;
      const created_by = req.user?.id;

      // Criar pesquisa
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          title,
          description,
          created_by,
          is_active: is_active ?? true,
        })
        .select()
        .single();

      if (surveyError) {
        throw new Error(surveyError.message);
      }

      // Se houver perguntas, criar todas
      if (questions && questions.length > 0) {
        const questionsData = questions.map((q: any) => ({
          survey_id: survey.id,
          question_text: q.question_text,
          type: q.type,
          options: q.options,
          order: q.order,
        }));

        const { error: questionsError } = await supabase
          .from('survey_questions')
          .insert(questionsData);

        if (questionsError) {
          throw new Error(questionsError.message);
        }
      }

      // Buscar pesquisa completa com perguntas
      const { data: completeSurvey } = await supabase
        .from('surveys')
        .select(`
          *,
          questions:survey_questions(*)
        `)
        .eq('id', survey.id)
        .single();

      return ApiResponse.created(res, completeSurvey, 'Pesquisa criada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, is_active } = req.body;

      const { data: survey, error } = await supabase
        .from('surveys')
        .update({ title, description, is_active })
        .eq('id', id)
        .select()
        .single();

      if (error || !survey) {
        throw new NotFoundError('Pesquisa não encontrada');
      }

      return ApiResponse.success(res, survey, 'Pesquisa atualizada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', id);

      if (error) {
        throw new NotFoundError('Pesquisa não encontrada');
      }

      return ApiResponse.success(res, null, 'Pesquisa deletada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  // Submeter resposta de pesquisa
  static async submitResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: survey_id } = req.params;
      const { answers } = req.body;
      const userId = req.user?.id;

      // Buscar o cliente associado ao usuário
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!client) {
        throw new NotFoundError('Cliente não encontrado para este usuário');
      }

      // Criar resposta
      const { data: response, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_id,
          client_id: client.id,
        })
        .select()
        .single();

      if (responseError) {
        throw new Error(responseError.message);
      }

      // Criar respostas individuais
      const answersData = answers.map((a: any) => ({
        response_id: response.id,
        question_id: a.question_id,
        answer_text: a.answer_text,
      }));

      const { error: answersError } = await supabase
        .from('survey_answers')
        .insert(answersData);

      if (answersError) {
        throw new Error(answersError.message);
      }

      return ApiResponse.created(res, response, 'Resposta enviada com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  // Listar respostas de uma pesquisa
  static async getResponses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select(`
          *,
          client:clients(id, company_name),
          answers:survey_answers(
            *,
            question:survey_questions(question_text, type)
          )
        `)
        .eq('survey_id', id)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.success(res, responses || [], 'Respostas listadas');
    } catch (error) {
      return next(error);
    }
  }
}

