import app from './app';
import { ENV } from './config/env';
import { connectDatabase } from './config/db';
import { startReminderScheduler } from './services/reminder-scheduler.service';

const startServer = async () => {
  console.log('🚀 [VOXORA AI] Initializing backend services...');
  
  // Attempt database connection
  await connectDatabase();

  // Start background reminder email scheduler
  startReminderScheduler();

  const server = app.listen(ENV.PORT, () => {
    console.log(`✨ [VOXORA AI] Server listening on port ${ENV.PORT} (${ENV.NODE_ENV})`);
    console.log(`🔗 [API Base] http://localhost:${ENV.PORT}/api`);
    console.log(`🤖 [Groq Model] ${ENV.GROQ_MODEL} (Key Configured: ${Boolean(ENV.GROQ_API_KEY)})`);
  });

  const shutdown = async () => {
    console.log('\n🛑 [VOXORA AI] Shutting down gracefully...');
    server.close(() => {
      console.log('👋 [VOXORA AI] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});

