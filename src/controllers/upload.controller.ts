import { Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from '../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { config } from '../config/env';

// Configurar Cloudinary apenas se as credenciais estiverem disponíveis
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export class UploadController {
  static async uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado',
        });
      }

      // Verificar se Cloudinary está configurado
      if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
        // Modo de desenvolvimento: retornar URL temporária
        const tempUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        return ApiResponse.success(
          res,
          {
            url: tempUrl,
            public_id: `temp_${Date.now()}`,
            width: 1200,
            height: 630,
          },
          'Imagem processada (modo desenvolvimento - Cloudinary não configurado)'
        );
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

      // Verificar se Cloudinary está configurado
      if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
        // Modo de desenvolvimento: apenas confirmar
        return ApiResponse.success(res, null, 'Imagem deletada (modo desenvolvimento - Cloudinary não configurado)');
      }

      await cloudinary.uploader.destroy(public_id);

      return ApiResponse.success(res, null, 'Imagem deletada com sucesso');
    } catch (error) {
      return next(error);
    }
  }
}

