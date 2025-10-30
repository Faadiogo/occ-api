// Interface para contexto de erro
export interface ErrorContext {
  field?: string;
  value?: unknown;
  code?: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly timestamp: string;

  constructor(
    message: string, 
    statusCode: number = 500, 
    isOperational: boolean = true,
    context?: ErrorContext
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // Método para serializar o erro para logs
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado', context?: ErrorContext) {
    super(message, 404, true, context);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado', context?: ErrorContext) {
    super(message, 401, true, context);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado', context?: ErrorContext) {
    super(message, 403, true, context);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Dados inválidos', context?: ErrorContext) {
    super(message, 400, true, context);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados', context?: ErrorContext) {
    super(message, 409, true, context);
    this.name = 'ConflictError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Requisição inválida', context?: ErrorContext) {
    super(message, 400, true, context);
    this.name = 'BadRequestError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Erro interno do servidor', context?: ErrorContext) {
    super(message, 500, false, context);
    this.name = 'InternalServerError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Erro de banco de dados', context?: ErrorContext) {
    super(message, 500, true, context);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'Erro em serviço externo', context?: ErrorContext) {
    super(message, 502, true, context);
    this.name = 'ExternalServiceError';
  }
}

// Função utilitária para criar erros padronizados
export const createError = {
  notFound: (message: string, context?: ErrorContext) => new NotFoundError(message, context),
  unauthorized: (message: string, context?: ErrorContext) => new UnauthorizedError(message, context),
  forbidden: (message: string, context?: ErrorContext) => new ForbiddenError(message, context),
  validation: (message: string, context?: ErrorContext) => new ValidationError(message, context),
  conflict: (message: string, context?: ErrorContext) => new ConflictError(message, context),
  badRequest: (message: string, context?: ErrorContext) => new BadRequestError(message, context),
  internal: (message: string, context?: ErrorContext) => new InternalServerError(message, context),
  database: (message: string, context?: ErrorContext) => new DatabaseError(message, context),
  external: (message: string, context?: ErrorContext) => new ExternalServiceError(message, context)
};

