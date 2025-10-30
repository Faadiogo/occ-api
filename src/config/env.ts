import dotenv from 'dotenv';
import path from 'path';

// Carregar .env do diretório raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'Zsw9L6NYYCEF/+QWfSQSmvPjLbUH64pnqxIOeqtMIl/x/ARpk4yVX+C2zol5hq1XCW4oPMS0rxP5tFe88yMebA==',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',')|| ['http://localhost:3000'],
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  },
};

// Validação de variáveis obrigatórias
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente ${envVar} não encontrada`);
  }
}

