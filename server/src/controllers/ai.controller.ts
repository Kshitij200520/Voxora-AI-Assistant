import { Request, Response, NextFunction } from 'express';
import { interpretVoiceCommand } from '../services/groq.service';

export const interpretVoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, userTimezone, referenceDate, language, conversationHistory } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text prompt is required',
      });
    }

    const result = await interpretVoiceCommand({
      text,
      userTimezone: userTimezone || req.user?.timezone || 'Asia/Kolkata',
      referenceDate,
      language,
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
