import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { requireDatabase } from '../middleware/dbCheck';
import { validateBody } from '../middleware/validateRequest';
import { CreateTaskSchema, UpdateTaskSchema } from '../validators/task.validator';

const router = Router();

router.use(requireDatabase);

router.get('/', getTasks);
router.post('/', validateBody(CreateTaskSchema), createTask);
router.get('/:id', getTaskById);
router.put('/:id', validateBody(UpdateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;

