import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { requireDatabase } from '../middleware/dbCheck';

const router = Router();

router.get('/', requireDatabase, getDashboardSummary);

export default router;

