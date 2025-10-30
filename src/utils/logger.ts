import winston from 'winston';
import { config } from '../config/env';

// Interface para dados de log estruturado
export interface LogContext {
  userId?: string;
  userRole?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'occ-api',
    version: '1.0.0',
    environment: config.nodeEnv
  },
  transports: [
    // Console para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Arquivo para erros
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Arquivo para todos os logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Logger estruturado para a API
export class Logger {
  /**
   * Log de requisição HTTP
   */
  static logRequest(method: string, path: string, context: LogContext = {}) {
    logger.info('HTTP Request', {
      type: 'request',
      method,
      path,
      ...context
    });
  }

  /**
   * Log de resposta HTTP
   */
  static logResponse(method: string, path: string, statusCode: number, responseTime: number, context: LogContext = {}) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(level, 'HTTP Response', {
      type: 'response',
      method,
      path,
      statusCode,
      responseTime,
      ...context
    });
  }

  /**
   * Log de erro
   */
  static logError(error: Error, context: LogContext = {}) {
    logger.error('Application Error', {
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context
    });
  }

  /**
   * Log de operação de negócio
   */
  static logBusiness(operation: string, context: LogContext = {}) {
    logger.info('Business Operation', {
      type: 'business',
      operation,
      ...context
    });
  }

  /**
   * Log de performance
   */
  static logPerformance(operation: string, duration: number, context: LogContext = {}) {
    logger.info('Performance Metric', {
      type: 'performance',
      operation,
      duration,
      ...context
    });
  }

  /**
   * Log de segurança
   */
  static logSecurity(event: string, context: LogContext = {}) {
    logger.warn('Security Event', {
      type: 'security',
      event,
      ...context
    });
  }

  /**
   * Log de cache
   */
  static logCache(operation: 'hit' | 'miss' | 'set' | 'clear', key: string, context: LogContext = {}) {
    logger.debug('Cache Operation', {
      type: 'cache',
      operation,
      key,
      ...context
    });
  }

  /**
   * Log de banco de dados
   */
  static logDatabase(operation: string, table: string, duration?: number, context: LogContext = {}) {
    logger.info('Database Operation', {
      type: 'database',
      operation,
      table,
      duration,
      ...context
    });
  }

  /**
   * Log de autenticação
   */
  static logAuth(event: 'login' | 'logout' | 'token_refresh' | 'failed_login', context: LogContext = {}) {
    const level = event === 'failed_login' ? 'warn' : 'info';
    
    logger.log(level, 'Authentication Event', {
      type: 'auth',
      event,
      ...context
    });
  }

  /**
   * Log de cálculo tributário
   */
  static logTaxCalculation(companyId: string, regime: string, result: string, context: LogContext = {}) {
    logger.info('Tax Calculation', {
      type: 'tax_calculation',
      companyId,
      regime,
      result,
      ...context
    });
  }
}

// Middleware de logging para Express
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Adicionar requestId ao request para rastreamento
  req.requestId = requestId;

  // Log da requisição
  Logger.logRequest(req.method, req.path, {
    requestId,
    userId: req.user?.id,
    userRole: req.user?.role
  });

  // Interceptar o res.end para logar a resposta
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const responseTime = Date.now() - startTime;
    
    Logger.logResponse(req.method, req.path, res.statusCode, responseTime, {
      requestId,
      userId: req.user?.id,
      userRole: req.user?.role
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

export default logger;
