import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/db';
import { ENV } from '../config/env';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  res.json({
    status: 'ok',
    app: 'VOXORA AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    ai: {
      provider: 'Groq',
      model: ENV.GROQ_MODEL,
      configured: Boolean(ENV.GROQ_API_KEY && ENV.GROQ_API_KEY.length > 5),
    },
  });
});

router.get('/health/db', (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  if (!dbStatus.connected) {
    return res.status(503).json({
      success: false,
      status: 'disconnected',
      error: dbStatus.error || 'Database is not connected',
      details: dbStatus,
    });
  }
  res.json({
    success: true,
    status: 'connected',
    details: dbStatus,
  });
});

export default router;

