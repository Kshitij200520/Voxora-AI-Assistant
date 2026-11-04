import { Router } from 'express';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from '../controllers/reminder.controller';
import { requireDatabase } from '../middleware/dbCheck';
import { validateBody } from '../middleware/validateRequest';
import { CreateReminderSchema, UpdateReminderSchema } from '../validators/reminder.validator';

const router = Router();

router.use(requireDatabase);

router.get('/', getReminders);
router.post('/', validateBody(CreateReminderSchema), createReminder);
router.put('/:id', validateBody(UpdateReminderSchema), updateReminder);
router.delete('/:id', deleteReminder);

export default router;

