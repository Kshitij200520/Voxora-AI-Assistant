import Groq from 'groq-sdk';
import { ENV } from '../config/env';
import {
  GroqInterpretationResponseSchema,
  GroqInterpretationResponse,
} from '../validators/ai.validator';

let groqClient: Groq | null = null;

const getGroqClient = (): Groq | null => {
  if (!ENV.GROQ_API_KEY) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: ENV.GROQ_API_KEY });
  }
  return groqClient;
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const interpretVoiceCommand = async (params: {
  text: string;
  userTimezone?: string;
  referenceDate?: string;
  language?: string;
  conversationHistory?: ChatMessage[];
}): Promise<GroqInterpretationResponse> => {
  const {
    text,
    userTimezone = 'Asia/Kolkata',
    referenceDate,
    language = 'en',
    conversationHistory = [],
  } = params;

  if (!text || text.trim().length === 0) {
    return {
      actions: [],
      response: 'I could not hear any command. Please speak clearly or type your request.',
      detectedLanguage: 'en',
    };
  }

  const client = getGroqClient();
  if (!client) {
    return {
      actions: [],
      response:
        'Groq API key is not configured. Please add GROQ_API_KEY to your server .env file or Settings.',
      detectedLanguage: 'en',
    };
  }

  const now = referenceDate ? new Date(referenceDate) : new Date();
  const nowIso = now.toISOString();
  const currentDayOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][now.getDay()];

  const systemPrompt = `You are the core AI Natural Language Understanding engine for VOXORA AI, a voice-first intelligent productivity and expense assistant.

CURRENT CONTEXT:
- Exact Current Timestamp: ${nowIso}
- Current Day of Week: ${currentDayOfWeek}
- User Timezone: ${userTimezone}
- User Preferred Language: ${language}

CONTINUOUS CONVERSATION RULES:
1. You are having an ongoing, real-time voice conversation with the user.
2. The user can speak multiple commands sequentially without restarting the session.
3. Use the previous conversation history to understand context, references, pronouns, and modifications:
   - "Add another 200" -> Contextual CREATE_EXPENSE with previous category or UPDATE_EXPENSE.
   - "Actually change it to 700" -> Contextual UPDATE_EXPENSE targeting the item just discussed.
   - "Mark that task as completed" -> COMPLETE_TASK referencing the task just discussed.
   - "Delete that reminder" -> DELETE_REMINDER referencing the reminder just discussed.
   - "What about yesterday?" / "How much did I spend?" -> Contextual QUERY_EXPENSES.
4. If the user greets ("Hi", "Hello", "Kaise ho", "Kya haal chal"), reply warmly and naturally as a personal AI assistant using CHAT action.
5. If the user indicates they want to end the session ("End conversation", "Stop session", "Bye", "Exit", "Goodnight", "Stop listening"):
   - Return type CHAT.
   - Return response: "Voice session ended. Have a great day!" or matching language farewell.
   - Include special flag in response if appropriate.

SUPPORTED ACTION TYPES:
1. CREATE_EXPENSE:
   - payload: { amount: number (positive), currency: "INR", category: "Food"|"Travel"|"Shopping"|"Education"|"Entertainment"|"Health"|"Bills"|"Other", description: string, date: "ISO 8601 string" }
   - Rule: NEVER invent missing financial amounts. If no amount is mentioned, DO NOT create this action; instead ask for the amount in response.
   - Categorize accurately: e.g. "lunch", "dinner", "coffee" -> "Food"; "uber", "flight", "metro", "fuel" -> "Travel"; "wifi", "electricity", "rent" -> "Bills".

2. UPDATE_EXPENSE:
   - payload: { targetSearch?: string (e.g. "lunch"), amount?: number, category?: string, description?: string }
   - Example: "change my lunch expense to 300" -> { targetSearch: "lunch", amount: 300 }

3. DELETE_EXPENSE:
   - payload: { targetSearch: string (e.g. "lunch"), amount?: number, category?: string }
   - requiresConfirmation: true (Destructive action)
   - confirmationMessage: "Are you sure you want to delete your [description] expense?"

4. CREATE_TASK:
   - payload: { title: string, description?: string, priority: "low"|"medium"|"high", dueDate?: "ISO 8601 string or null" }
   - Rule: Resolve relative dates accurately (e.g., "by Friday" -> next Friday from current context).

5. UPDATE_TASK:
   - payload: { targetSearch?: string, newTitle?: string, priority?: "low"|"medium"|"high", dueDate?: "ISO 8601 string or null", status?: "pending"|"in_progress"|"completed" }
   - Example: "change my resume task to high priority" -> { targetSearch: "resume", priority: "high" }

6. COMPLETE_TASK:
   - payload: { targetSearch: string (keywords to match task title, e.g. "resume") }
   - requiresConfirmation: false

7. DELETE_TASK:
   - payload: { targetSearch: string }
   - requiresConfirmation: true
   - confirmationMessage: "Are you sure you want to delete this task?"

8. CREATE_REMINDER:
   - payload: { title: string, dueAt: "ISO 8601 string", description?: string }
   - Rule: Extract the actual subject as title (e.g. "Submit assignment", "Gym session", "Call Mom"). NEVER set title to just "Reminder"!
   - Rule: Resolve relative times (e.g. "tomorrow at 10 AM", "in 2 hours", "today at 5 PM") to full ISO datetime string in the context timezone.

9. UPDATE_REMINDER:
   - payload: { targetSearch?: string (e.g. "assignment" or leave empty if recent), newDueAt?: "ISO 8601 string", newTitle?: string, description?: string }
   - Example: "change my reminder to 5 PM" -> { newDueAt: "RESOLVED_TODAY_5PM_ISO" }

10. DELETE_REMINDER:
   - payload: { targetSearch: string }
   - requiresConfirmation: true
   - confirmationMessage: "Are you sure you want to delete this reminder?"

11. QUERY_EXPENSES:
   - payload: { period: "today"|"this_week"|"this_month"|"all_time", category?: string, question: string }

12. QUERY_TASKS:
   - payload: { status?: "pending"|"completed"|"all", question: string }

13. QUERY_SUMMARY:
   - payload: { question: string }

14. CHAT:
   - payload: {}
   - Use when user greets, asks casual questions, gives acknowledgments ("ok", "great", "cool"), or wants to end conversation.
   - Reply with a warm, energetic, and helpful spoken response matching the user's language (Hindi/Hinglish/English).

15. UNKNOWN:
   - payload: {}
   - Use only when completely uninterpretable.

STRICT JSON OUTPUT FORMAT (No markdown, no commentary, only raw JSON):
CRITICAL: You MUST ALWAYS respond with a valid JSON object matching the exact structure below. NEVER return plain text or conversational speech outside the JSON. Even for casual greetings ("Kya haal chal", "Hello", "How are you"), you MUST return the JSON structure with the greeting in the "response" property and actions as [].

Example for "Kya haal chal":
{
  "actions": [],
  "response": "Bas badhiya! Aap sunao, kya chal raha hai? Main aapki kya madad kar sakta hoon?",
  "detectedLanguage": "hi"
}

Example for "Hi":
{
  "actions": [],
  "response": "Hello! I am VOXORA AI. How can I help you today?",
  "detectedLanguage": "en"
}

Standard Schema:
{
  "actions": [
    {
      "type": "CREATE_EXPENSE",
      "requiresConfirmation": false,
      "confirmationMessage": "",
      "payload": { ... }
    }
  ],
  "response": "Brief natural spoken confirmation or question in clear English or Hindi/Hinglish matching user language.",
  "detectedLanguage": "en" | "hi" | "hinglish"
}
`;

  try {
    // Format conversation history (capped to last 10 messages for token safety)
    // IMPORTANT: Assistant turns must be formatted as JSON so Groq maintains strict JSON output format
    const recentHistory = conversationHistory.slice(-10).map((msg) => {
      if (msg.role === 'assistant') {
        const isJson = msg.content.trim().startsWith('{') && msg.content.trim().endsWith('}');
        return {
          role: 'assistant' as const,
          content: isJson
            ? msg.content
            : JSON.stringify({
                actions: [],
                response: msg.content,
              }),
        };
      }
      return {
        role: 'user' as const,
        content: msg.content,
      };
    });

    const completion = await client.chat.completions.create({
      model: ENV.GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ [Groq] Failed to parse model response JSON:', content);
      return {
        actions: [],
        response:
          'I understood your request but received an irregular response format from the AI model. Please try again.',
        detectedLanguage: 'en',
      };
    }

    // Validate with Zod
    const validated = GroqInterpretationResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn('⚠️ [Groq] Schema validation warning:', validated.error.format());
      return {
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        response:
          typeof parsed.response === 'string'
            ? parsed.response
            : 'Actions recognized, ready to execute.',
        detectedLanguage: parsed.detectedLanguage || 'en',
      };
    }

    return validated.data;
  } catch (apiError: any) {
    console.error('❌ [Groq API Error]:', apiError?.message || apiError);

    // Resilience: Check if Groq failed JSON validation but returned a text answer in failed_generation
    let recoveredText: string | null = null;

    if (apiError?.error?.failed_generation) {
      recoveredText = String(apiError.error.failed_generation).trim();
    } else if (typeof apiError?.message === 'string') {
      try {
        const jsonMatch = apiError.message.match(/\{[\s\S]*"failed_generation":\s*"([^"]+)"[\s\S]*\}/);
        if (jsonMatch && jsonMatch[1]) {
          recoveredText = jsonMatch[1];
        } else {
          const parsedErr = JSON.parse(apiError.message.replace(/^[^{]*/, ''));
          if (parsedErr?.error?.failed_generation) {
            recoveredText = String(parsedErr.error.failed_generation).trim();
          }
        }
      } catch {
        // Not a JSON error string
      }
    }

    if (recoveredText && recoveredText.length > 0) {
      console.log('💡 [Groq] Successfully recovered conversational response from failed_generation:', recoveredText);
      const isHindi = /[\u0900-\u097F]/.test(recoveredText) || /\b(kya|haal|chal|aap|badhiya|kaise|haan|theek)\b/i.test(recoveredText);
      return {
        actions: [],
        response: recoveredText,
        detectedLanguage: isHindi ? 'hi' : 'en',
      };
    }

    return {
      actions: [],
      response: `AI service error: ${apiError?.message || 'Unable to communicate with Groq AI'}. Please check your connection and API key.`,
      detectedLanguage: 'en',
    };
  }
};
