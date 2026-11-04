import { z } from 'zod';

export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: 'Full name must be at least 2 characters' })
      .max(100),
    email: z.string().email({ message: 'Please provide a valid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(100),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    timezone: z.string().optional().default('Asia/Kolkata'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional().default(false),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter your registered email address' }),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: 'Reset token is required' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z
      .string()
      .min(8, { message: 'New password must be at least 8 characters' })
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  timezone: z.string().optional(),
  profileImage: z.string().optional(),
});

export const NotificationSettingsSchema = z.object({
  emailRemindersEnabled: z.boolean().optional(),
  taskDeadlineAlertsEnabled: z.boolean().optional(),
  upcomingReminderAlertsEnabled: z.boolean().optional(),
  timezone: z.string().optional(),
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, { message: 'Password is required to confirm account deletion' }),
});

