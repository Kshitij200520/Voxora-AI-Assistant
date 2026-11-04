import { Router } from 'express';
import {
  getNotificationSettings,
  updateNotificationSettings,
  sendTestNotification,
  getNotificationHistory,
} from '../controllers/notifications.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);
router.post('/test', sendTestNotification);
router.get('/history', getNotificationHistory);

export default router;

