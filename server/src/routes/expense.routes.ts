import { Router } from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expense.controller';
import { requireDatabase } from '../middleware/dbCheck';
import { validateBody } from '../middleware/validateRequest';
import { CreateExpenseSchema, UpdateExpenseSchema } from '../validators/expense.validator';

const router = Router();

router.use(requireDatabase);

router.get('/', getExpenses);
router.post('/', validateBody(CreateExpenseSchema), createExpense);
router.get('/:id', getExpenseById);
router.put('/:id', validateBody(UpdateExpenseSchema), updateExpense);
router.delete('/:id', deleteExpense);

export default router;

