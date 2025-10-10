import app from './app';
import { config } from './config/env';

const PORT = config.port;

app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║              🚀 API OCC INICIADA! 🚀                 ║');
  console.log('║                                                       ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  Ambiente: ${config.nodeEnv.padEnd(44)}║`);
  console.log(`║  Porta: ${PORT.toString().padEnd(47)}║`);
  console.log(`║  URL: http://localhost:${PORT.toString().padEnd(31)}║`);
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║  Endpoints disponíveis:                               ║');
  console.log('║  - GET  /                    (Info da API)            ║');
  console.log('║  - GET  /api/health          (Health check)           ║');
  console.log('║  - POST /api/auth/register   (Registro)               ║');
  console.log('║  - POST /api/auth/login      (Login)                  ║');
  console.log('║  - GET  /api/posts           (Blog)                   ║');
  console.log('║  - GET  /api/clients         (Clientes)               ║');
  console.log('║  - GET  /api/surveys         (Pesquisas)              ║');
  console.log('║  - GET  /api/tax-plans       (Planejamento)           ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason: any) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

