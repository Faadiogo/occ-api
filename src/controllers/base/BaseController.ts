import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { ApiResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';

export abstract class BaseController {
  /**
   * Método para tratar erros de forma padronizada
   */
  protected static handleError(error: unknown, req: AuthRequest, _res: Response, next: NextFunction): void {
    Logger.logError(error instanceof Error ? error : new Error(String(error)), {
      requestId: (req as any).requestId,
      userId: req.user?.id,
      userRole: req.user?.role,
      method: req.method,
      path: req.path
    });

    next(error);
  }

  /**
   * Método para logar operações de negócio
   */
  protected static logBusinessOperation(operation: string, context: Record<string, unknown> = {}): void {
    Logger.logBusiness(operation, context);
  }

  /**
   * Método para logar operações de performance
   */
  protected static logPerformance(operation: string, startTime: number, context: Record<string, unknown> = {}): void {
    const duration = Date.now() - startTime;
    Logger.logPerformance(operation, duration, context);
  }

  /**
   * Método para validar permissões
   */
  protected static validatePermission(
    userRole: string | undefined, 
    allowedRoles: string[], 
    resourceOwnerId?: string, 
    userId?: string
  ): void {
    if (!userRole) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!allowedRoles.includes(userRole)) {
      throw new AppError('Acesso negado', 403);
    }

    // Se não é admin, deve ser o dono do recurso
    if (!allowedRoles.includes('ADMIN') && !allowedRoles.includes('SUPER_ADMIN') && resourceOwnerId !== userId) {
      throw new AppError('Acesso negado ao recurso', 403);
    }
  }

  /**
   * Método para resposta de sucesso padronizada
   */
  protected static success<T>(
    res: Response, 
    data: T, 
    message: string = 'Operação realizada com sucesso',
    statusCode: number = 200
  ): Response {
    return ApiResponse.success(res, data, message, statusCode);
  }

  /**
   * Método para resposta de erro padronizada
   */
  protected static error(
    res: Response, 
    message: string = 'Erro interno do servidor',
    statusCode: number = 500
  ): Response {
    return ApiResponse.error(res, message, statusCode);
  }

  /**
   * Método para resposta paginada padronizada
   */
  protected static paginated<T>(
    res: Response, 
    data: T[], 
    page: number, 
    limit: number, 
    total: number,
    _message: string = 'Dados listados com sucesso'
  ): Response {
    return ApiResponse.paginated(res, data, page, limit, total);
  }
}
