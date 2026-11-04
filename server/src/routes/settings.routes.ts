import { Router } from 'express';
import { getSettingsStatus, updateSettings } from '../controllers/settings.controller';

const router = Router();

router.get('/', getSettingsStatus);
router.post('/', updateSettings);

export default router;
