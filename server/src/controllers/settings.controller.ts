import { Request, Response } from 'express';
import { ENV } from '../config/env';
import { connectDatabase, getDatabaseStatus } from '../config/db';
import fs from 'fs';
import path from 'path';

export const getSettingsStatus = (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  res.json({
    success: true,
    data: {
      port: ENV.PORT,
      nodeEnv: ENV.NODE_ENV,
      groqModel: ENV.GROQ_MODEL,
      groqKeyConfigured: Boolean(ENV.GROQ_API_KEY && ENV.GROQ_API_KEY.length > 5),
      groqKeyMasked: ENV.GROQ_API_KEY
        ? `${ENV.GROQ_API_KEY.slice(0, 6)}...${ENV.GROQ_API_KEY.slice(-4)}`
        : '',
      mongodbUriConfigured: Boolean(ENV.MONGODB_URI),
      mongodbUriMasked: ENV.MONGODB_URI
        ? ENV.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')
        : '',
      emailService: {
        configured: Boolean(ENV.RESEND_API_KEY || (ENV.EMAIL_USER && ENV.EMAIL_PASS)),
        provider: ENV.RESEND_API_KEY ? 'Resend' : ENV.EMAIL_USER ? 'SMTP' : 'Simulated (Dev)',
        fromAddress: ENV.EMAIL_FROM,
      },
      database: dbStatus,
    },
  });
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { mongodbUri, groqApiKey, groqModel } = req.body;

    let envUpdated = false;
    const envPath = path.resolve(__dirname, '../../.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    if (mongodbUri && typeof mongodbUri === 'string' && !mongodbUri.includes('****')) {
      ENV.MONGODB_URI = mongodbUri.trim();
      process.env.MONGODB_URI = mongodbUri.trim();

      if (envContent.includes('MONGODB_URI=')) {
        envContent = envContent.replace(/MONGODB_URI=.*(\r?\n|$)/, `MONGODB_URI=${mongodbUri.trim()}\n`);
      } else {
        envContent += `\nMONGODB_URI=${mongodbUri.trim()}\n`;
      }
      envUpdated = true;

      console.log('🔄 [Settings] Reconnecting to updated MongoDB URI...');
      await connectDatabase();
    } else if (mongodbUri && mongodbUri.includes('****')) {
      // User submitted without changing masked value - just trigger a fresh reconnect
      console.log('🔄 [Settings] Re-triggering database connection check...');
      await connectDatabase();
    }

    if (groqApiKey && typeof groqApiKey === 'string' && !groqApiKey.includes('...')) {
      ENV.GROQ_API_KEY = groqApiKey.trim();
      process.env.GROQ_API_KEY = groqApiKey.trim();

      if (envContent.includes('GROQ_API_KEY=')) {
        envContent = envContent.replace(/GROQ_API_KEY=.*(\r?\n|$)/, `GROQ_API_KEY=${groqApiKey.trim()}\n`);
      } else {
        envContent += `\nGROQ_API_KEY=${groqApiKey.trim()}\n`;
      }
      envUpdated = true;
    }

    if (groqModel && typeof groqModel === 'string') {
      ENV.GROQ_MODEL = groqModel.trim();
      process.env.GROQ_MODEL = groqModel.trim();

      if (envContent.includes('GROQ_MODEL=')) {
        envContent = envContent.replace(/GROQ_MODEL=.*(\r?\n|$)/, `GROQ_MODEL=${groqModel.trim()}\n`);
      } else {
        envContent += `\nGROQ_MODEL=${groqModel.trim()}\n`;
      }
      envUpdated = true;
    }

    if (envUpdated) {
      try {
        fs.writeFileSync(envPath, envContent, 'utf8');
      } catch (fErr) {
        console.warn('Could not write to .env file directly:', fErr);
      }
    }

    const currentDbStatus = getDatabaseStatus();

    res.json({
      success: true,
      message: 'System settings updated successfully',
      database: currentDbStatus,
      groqConfigured: Boolean(ENV.GROQ_API_KEY && ENV.GROQ_API_KEY.length > 5),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update settings',
    });
  }
};
