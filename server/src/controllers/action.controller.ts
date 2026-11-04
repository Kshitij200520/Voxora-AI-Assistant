import { Request, Response, NextFunction } from 'express';
import { ActionExecutorService } from '../services/action-executor.service';
import { ActionItem } from '../validators/ai.validator';

export const executeActions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actions, confirmed, language, timezone } = req.body;

    if (!Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        error: 'actions must be an array of ActionItem objects',
      });
    }

    const result = await ActionExecutorService.executeActions(actions as ActionItem[], {
      confirmed: Boolean(confirmed),
      language,
      userId: req.user?.id,
      timezone: timezone || req.user?.timezone || 'Asia/Kolkata',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
