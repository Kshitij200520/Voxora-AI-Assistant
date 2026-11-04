import { Router } from 'express';
import { getActivityLogs } from '../controllers/activity.controller';
import { requireDatabase } from '../middleware/dbCheck';

const router = Router();

router.use(requireDatabase);

router.get('/', getActivityLogs);

export default router;

