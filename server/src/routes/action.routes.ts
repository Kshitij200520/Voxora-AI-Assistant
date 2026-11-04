import { Router } from 'express';
import { executeActions } from '../controllers/action.controller';
import { requireDatabase } from '../middleware/dbCheck';

const router = Router();

router.post('/execute', requireDatabase, executeActions);

export default router;

