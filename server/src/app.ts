import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import notificationsRoutes from './routes/notifications.routes';
import dashboardRoutes from './routes/dashboard.routes';
import aiRoutes from './routes/ai.routes';
import actionRoutes from './routes/action.routes';
import expenseRoutes from './routes/expense.routes';
import taskRoutes from './routes/task.routes';
import reminderRoutes from './routes/reminder.routes';
import activityRoutes from './routes/activity.routes';
import settingsRoutes from './routes/settings.routes';
import { requireAuth } from './middleware/auth.middleware';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security & Parsing Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or dev tools)
      if (!origin) return callback(null, true);
      // Allow localhost dev servers or configured CLIENT_URL
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin === ENV.CLIENT_URL
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Dev hackathon mode: permit origin
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (ENV.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Public API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Protected API Routes (require verified JWT session)
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/actions', requireAuth, actionRoutes);
app.use('/api/expenses', requireAuth, expenseRoutes);
app.use('/api/tasks', requireAuth, taskRoutes);
app.use('/api/reminders', requireAuth, reminderRoutes);
app.use('/api/activity', requireAuth, activityRoutes);

// 404 Fallback for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
