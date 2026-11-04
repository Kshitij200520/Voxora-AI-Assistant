import { Router } from 'express';
import { interpretVoice } from '../controllers/ai.controller';

const router = Router();

router.post('/interpret', interpretVoice);

export default router;

