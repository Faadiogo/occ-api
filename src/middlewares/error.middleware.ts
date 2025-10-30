import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import { Logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log estruturado do erro
  Logger.logError(error, {
    requestId: (req as any).requestId,
    userId: (req as any).user?.id,
    userRole: (req as any).user?.role,
    method: req.method,
    path: req.path
  });

  // Erros de validação do Zod
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    });
    return;
  }

  // Erros operacionais (AppError)
  if (error instanceof AppError) {
    const response: any = {
      success: false,
      message: error.message,
      timestamp: error.timestamp,
    };

    // Adicionar contexto se disponível
    if (error.context) {
      response.context = error.context;
    }

    // Adicionar stack trace em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Erros não tratados
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      name: error.name 
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.path} não encontrada`,
  });
};

