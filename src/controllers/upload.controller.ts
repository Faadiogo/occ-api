import { Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { config } from '../config/env';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export class UploadController {
  static async uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado',
        });
      }

      // Upload para Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'occ-blog',
            transformation: [
              { width: 1200, height: 630, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(req.file!.buffer);
      });

      const uploadResult = result as any;

      return ApiResponse.success(
        res,
        {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
        },
        'Imagem enviada com sucesso'
      );
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return next(error);
    }
  }

  static async deleteImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { public_id } = req.body;

      if (!public_id) {
        return res.status(400).json({
          success: false,
          message: 'public_id é obrigatório',
        });
      }

      await cloudinary.uploader.destroy(public_id);

      return ApiResponse.success(res, null, 'Imagem deletada com sucesso');
    } catch (error) {
      return next(error);
    }
  }
}

