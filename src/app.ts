import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Application = express();

// Middlewares de segurança e parsing
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging simples
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API
app.use('/api', routes);

// Rota raiz
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Bem-vindo à API OCC',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      posts: '/api/posts',
      categories: '/api/categories',
      clients: '/api/clients',
      surveys: '/api/surveys',
      taxPlans: '/api/tax-plans',
    },
  });
});

// Tratamento de erros
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

