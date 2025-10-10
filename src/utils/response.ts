import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any, message: string = 'Sucesso', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res: Response, data: any, message: string = 'Criado com sucesso') {
    return this.success(res, data, message, 201);
  }

  static error(res: Response, message: string = 'Erro interno', statusCode: number = 500, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static paginated(res: Response, data: any[], page: number, limit: number, total: number) {
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

