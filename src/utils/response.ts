import { Response } from 'express';

// Interfaces para tipagem forte
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: PaginationInfo;
}

export class ApiResponse {
  static success<T = unknown>(
    res: Response, 
    data: T, 
    message: string = 'Sucesso', 
    statusCode: number = 200
  ): Response<ApiSuccessResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created<T = unknown>(
    res: Response, 
    data: T, 
    message: string = 'Criado com sucesso'
  ): Response<ApiSuccessResponse<T>> {
    return this.success(res, data, message, 201);
  }

  static error(
    res: Response, 
    message: string = 'Erro interno', 
    statusCode: number = 500, 
    errors?: Record<string, string[]>
  ): Response<ApiErrorResponse> {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static paginated<T = unknown>(
    res: Response, 
    data: T[], 
    page: number, 
    limit: number, 
    total: number
  ): Response<ApiPaginatedResponse<T>> {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}

