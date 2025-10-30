import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { CNAEService } from '../services/cnae.service';
import { ApiResponse } from '../utils/response';
import { cnaeSearchSchema, cnaeCodeSchema } from '../schemas/cnae.schema';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Endpoint para buscar CNAEs com filtro, cache e paginação
router.get('/search', validate(cnaeSearchSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page, limit } = req.query as any;
    
    const result = CNAEService.search(q, page, limit);
    
    return ApiResponse.success(res, result, 'CNAEs encontrados');
  } catch (error) {
    console.error('Erro no endpoint CNAE search:', error);
    return next(error);
  }
});

// Endpoint para buscar CNAE por código específico
router.get('/code/:code', validate(cnaeCodeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    
    const cnae = CNAEService.findByCode(code);
    
    if (!cnae) {
      return ApiResponse.success(res, null, 'CNAE não encontrado');
    }

    return ApiResponse.success(res, cnae, 'CNAE encontrado');
  } catch (error) {
    return next(error);
  }
});

// Endpoint para buscar faixas de um anexo específico
router.get('/faixas/:anexo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { anexo } = req.params;
    
    // Validar anexo manualmente
    if (!anexo || !/^[IVX]+$/.test(anexo)) {
      return ApiResponse.error(res, 'Anexo inválido. Deve ser I, II, III, IV ou V', 400);
    }
    
    const faixas = CNAEService.getFaixasByAnexo(anexo);

    if (faixas.length === 0) {
      return ApiResponse.success(res, [], 'Nenhuma faixa encontrada para este anexo');
    }

    return ApiResponse.success(res, faixas, 'Faixas encontradas');
  } catch (error) {
    return next(error);
  }
});

// Endpoint para estatísticas do cache (apenas para desenvolvimento)
router.get('/cache/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = CNAEService.getCacheStats();
    return ApiResponse.success(res, stats, 'Estatísticas do cache');
  } catch (error) {
    return next(error);
  }
});


// Endpoint para limpar cache (apenas para desenvolvimento)
router.delete('/cache', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    CNAEService.clearCache();
    return ApiResponse.success(res, null, 'Cache limpo com sucesso');
  } catch (error) {
    return next(error);
  }
});

export default router;

