export type ExpenseCategory =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Education'
  | 'Entertainment'
  | 'Health'
  | 'Bills'
  | 'Other';

export interface Expense {
  _id: string;
  userId?: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  _id: string;
  userId?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReminderStatus = 'scheduled' | 'completed' | 'delivered';
export type EmailDeliveryStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'skipped';

export interface Reminder {
  _id: string;
  userId?: string;
  title: string;
  description: string;
  dueAt: string;
  status: ReminderStatus;
  notificationSent: boolean;
  emailNotificationEnabled?: boolean;
  emailStatus?: EmailDeliveryStatus;
  emailSentAt?: string | null;
  emailError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  userId?: string;
  actionType: string;
  description: string;
  entityType: 'expense' | 'task' | 'reminder' | 'system' | 'query' | 'auth';
  entityId?: string | null;
  status: 'success' | 'failed' | 'partial' | 'pending_confirmation';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DashboardSummary {
  totalExpenses: number;
  totalExpensesCount: number;
  currentMonthExpenses: number;
  currentMonthExpensesCount: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingReminders: number;
  categoryBreakdown: { category: ExpenseCategory; total: number; count: number }[];
  monthlyTrend: { name: string; total: number; count: number }[];
  recentExpenses: Expense[];
  recentActivities: ActivityLog[];
}

export type VoiceState =
  | 'IDLE'
  | 'STARTING'
  | 'LISTENING'
  | 'USER_SPEAKING'
  | 'PROCESSING'
  | 'PROCESSING_AI'
  | 'EXECUTING'
  | 'AI_SPEAKING'
  | 'SPEAKING'
  | 'RESTARTING'
  | 'AWAITING_CONFIRMATION'
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'ERROR'
  | 'STOPPED';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: ActionItem[];
  results?: ActionResult[];
}

export interface ActionItem {
  id?: string;
  type: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  payload: Record<string, any>;
}

export interface ActionResult {
  id?: string;
  type: string;
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'AWAITING_CONFIRMATION';
  message: string;
  data?: any;
  requiresConfirmation?: boolean;
  confirmationDetails?: {
    entityType: string;
    entityId: string;
    title: string;
    message: string;
  };
}

export interface ExecutionResponse {
  overallStatus: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'AWAITING_CONFIRMATION';
  results: ActionResult[];
  spokenResponse: string;
  timestamp: string;
}

export interface ServerHealth {
  status: string;
  app: string;
  version: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    state: string;
    host?: string;
    databaseName?: string;
    error?: string | null;
    lastChecked: string;
  };
  ai: {
    provider: string;
    model: string;
    configured: boolean;
  };
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  timezone: string;
  profileImage?: string;
  createdAt?: string;
}

export interface UserNotificationSettings {
  _id?: string;
  userId?: string;
  emailRemindersEnabled: boolean;
  taskDeadlineAlertsEnabled: boolean;
  upcomingReminderAlertsEnabled: boolean;
  timezone: string;
}

export interface NotificationHistoryItem {
  _id: string;
  title: string;
  dueAt: string;
  status: string;
  emailStatus: EmailDeliveryStatus;
  emailSentAt?: string | null;
  emailError?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}
