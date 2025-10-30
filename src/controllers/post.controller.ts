import { Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { ApiResponse } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env';

// Configurar Cloudinary apenas se as credenciais estiverem disponíveis
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export class PostController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, published, category_id } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabase
        .from('posts')
        .select(`
          *,
          author:admins(id, name, email),
          category:categories(id, name, slug)
        `, { count: 'exact' });

      if (published !== undefined) {
        query = query.eq('published', published === 'true');
      }

      if (category_id) {
        query = query.eq('category_id', category_id);
      }

      const { data: posts, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.paginated(res, posts || [], Number(page), Number(limit), count || 0);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:admins(id, name, email),
          category:categories(id, name, slug)
        `)
        .eq('id', id)
        .single();

      if (error || !post) {
        throw new NotFoundError('Post não encontrado');
      }

      return ApiResponse.success(res, post, 'Post encontrado');
    } catch (error) {
      return next(error);
    }
  }

  static async getBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:admins(id, name, email),
          category:categories(id, name, slug)
        `)
        .eq('slug', slug)
        .single();

      if (error || !post) {
        throw new NotFoundError('Post não encontrado');
      }

      return ApiResponse.success(res, post, 'Post encontrado');
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, slug, content, cover_image, category_id, published } = req.body;
      const author_id = req.user?.id;

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          title,
          slug,
          content,
          cover_image,
          author_id,
          category_id,
          published: published || false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.created(res, post, 'Post criado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data: post, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !post) {
        throw new NotFoundError('Post não encontrado');
      }

      return ApiResponse.success(res, post, 'Post atualizado com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Primeiro, buscar o post para obter as imagens
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('id, cover_image, content')
        .eq('id', id)
        .single();

      if (fetchError || !post) {
        throw new NotFoundError('Post não encontrado');
      }

      // Deletar imagens do Cloudinary se estiver configurado
      console.log('🔍 Verificando configuração do Cloudinary...');
      console.log('Cloudinary configurado:', !!(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret));
      
      if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
        console.log('✅ Cloudinary configurado, iniciando exclusão de imagens...');
        
        try {
          // Deletar cover_image se existir
          if (post.cover_image) {
            console.log('🖼️ Cover image encontrada:', post.cover_image);
            const publicId = PostController.extractPublicIdFromUrl(post.cover_image);
            console.log('🔑 Public ID extraído:', publicId);
            
            if (publicId) {
              const result = await cloudinary.uploader.destroy(publicId);
              console.log('✅ Cover image deletada do Cloudinary:', result);
            } else {
              console.log('⚠️ Não foi possível extrair public_id da cover image');
            }
          } else {
            console.log('ℹ️ Nenhuma cover image encontrada');
          }

          // Buscar e deletar imagens do conteúdo do post
          const contentImages = PostController.extractImagesFromContent(post.content || '');
          console.log('📝 Imagens do conteúdo encontradas:', contentImages.length);
          
          for (const imageUrl of contentImages) {
            console.log('🖼️ Processando imagem do conteúdo:', imageUrl);
            const publicId = PostController.extractPublicIdFromUrl(imageUrl);
            console.log('🔑 Public ID extraído:', publicId);
            
            if (publicId) {
              const result = await cloudinary.uploader.destroy(publicId);
              console.log('✅ Imagem do conteúdo deletada do Cloudinary:', result);
            } else {
              console.log('⚠️ Não foi possível extrair public_id da imagem do conteúdo');
            }
          }
        } catch (cloudinaryError) {
          console.error('❌ Erro ao deletar imagens do Cloudinary:', cloudinaryError);
          // Não falhar a operação se houver erro no Cloudinary
        }
      } else {
        console.log('⚠️ Cloudinary não configurado, pulando exclusão de imagens');
      }

      // Deletar o post do banco
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return ApiResponse.success(res, null, 'Post e imagens deletados com sucesso');
    } catch (error) {
      return next(error);
    }
  }

  // Método auxiliar para extrair public_id de uma URL do Cloudinary
  private static extractPublicIdFromUrl(url: string): string | null {
    if (!url || !url.includes('cloudinary.com')) {
      console.log('⚠️ URL não é do Cloudinary:', url);
      return null;
    }

    try {
      console.log('🔍 Analisando URL do Cloudinary:', url);
      
      // Extrair o public_id da URL do Cloudinary
      // Formato: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
      // ou: https://res.cloudinary.com/cloud_name/image/upload/folder/public_id.jpg
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|gif|webp)$/i);
      
      if (match) {
        const publicId = match[1];
        console.log('✅ Public ID extraído com sucesso:', publicId);
        return publicId;
      } else {
        console.log('⚠️ Não foi possível extrair public_id da URL');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao extrair public_id:', error);
      return null;
    }
  }

  // Método auxiliar para extrair imagens do conteúdo HTML
  private static extractImagesFromContent(content: string): string[] {
    if (!content) return [];

    try {
      // Regex para encontrar URLs de imagens do Cloudinary no conteúdo
      const imageRegex = /https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi;
      const matches = content.match(imageRegex);
      return matches || [];
    } catch (error) {
      console.error('Erro ao extrair imagens do conteúdo:', error);
      return [];
    }
  }
}

