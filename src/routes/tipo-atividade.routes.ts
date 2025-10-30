import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { TipoAtividadeService } from '../services/tipo-atividade.service';
import { ApiResponse } from '../utils/response';
import { 
  tipoAtividadeListSchema, 
  tipoAtividadeIdSchema, 
  tipoAtividadeCreateSchema, 
  tipoAtividadeUpdateSchema, 
  tipoAtividadeDeleteSchema 
} from '../schemas/tipo-atividade.schema';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// Listar todos os tipos de atividade
router.get('/', validate(tipoAtividadeListSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ativo } = req.query as any;
    
    let tiposAtividade;
    if (ativo !== undefined) {
      tiposAtividade = await TipoAtividadeService.list();
    } else {
      tiposAtividade = await TipoAtividadeService.list();
    }
    
    return ApiResponse.success(res, tiposAtividade, 'Tipos de atividade encontrados');
  } catch (error) {
    console.error('Erro no endpoint listar tipos de atividade:', error);
    return next(error);
  }
});

// Buscar tipo de atividade por ID
router.get('/:id', validate(tipoAtividadeIdSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const tipoAtividade = await TipoAtividadeService.findById(id);
    
    if (!tipoAtividade) {
      return ApiResponse.success(res, null, 'Tipo de atividade não encontrado');
    }

    return ApiResponse.success(res, tipoAtividade, 'Tipo de atividade encontrado');
  } catch (error) {
    console.error('Erro no endpoint buscar tipo de atividade:', error);
    return next(error);
  }
});

// Criar novo tipo de atividade (apenas admin)
router.post('/', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(tipoAtividadeCreateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipoAtividadeData = req.body;
    
    const novoTipoAtividade = await TipoAtividadeService.create(tipoAtividadeData);
    
    return ApiResponse.success(res, novoTipoAtividade, 'Tipo de atividade criado com sucesso');
  } catch (error) {
    console.error('Erro no endpoint criar tipo de atividade:', error);
    return next(error);
  }
});

// Atualizar tipo de atividade (apenas admin)
router.put('/:id', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(tipoAtividadeUpdateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const tipoAtividadeAtualizado = await TipoAtividadeService.update(id, updates);
    
    return ApiResponse.success(res, tipoAtividadeAtualizado, 'Tipo de atividade atualizado com sucesso');
  } catch (error) {
    console.error('Erro no endpoint atualizar tipo de atividade:', error);
    return next(error);
  }
});

// Deletar tipo de atividade (apenas admin)
router.delete('/:id', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(tipoAtividadeDeleteSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await TipoAtividadeService.delete(id);
    
    return ApiResponse.success(res, null, 'Tipo de atividade deletado com sucesso');
  } catch (error) {
    console.error('Erro no endpoint deletar tipo de atividade:', error);
    return next(error);
  }
});

export default router;
