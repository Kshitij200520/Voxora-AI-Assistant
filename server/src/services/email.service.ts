import nodemailer, { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { ENV } from '../config/env';
import { IReminder } from '../models/Reminder';
import { IUser } from '../models/User';

let cachedTransporter: Transporter | null = null;
let resendClient: Resend | null = null;

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY || ENV.RESEND_API_KEY;
  if (apiKey && !resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const getSmtpTransporter = (): Transporter | null => {
  const user = process.env.EMAIL_USER || ENV.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || ENV.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // Support custom SMTP Host/Port if provided, or default to Gmail service
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
};

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendSystemEmail = async (params: SendEmailParams): Promise<{ success: boolean; message: string; messageId?: string }> => {
  const { to, subject, html, text } = params;

  // 1. Try Resend if configured
  const resend = getResendClient();
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: ENV.EMAIL_FROM,
        to: [to],
        subject,
        html,
        text: text || subject,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log(`✅ [Email/Resend] Sent to ${to}: "${subject}" (ID: ${response.data?.id})`);
      return { success: true, message: 'Email sent successfully via Resend', messageId: response.data?.id };
    } catch (err: any) {
      console.warn(`⚠️ [Email/Resend Error]: ${err.message}. Trying SMTP fallback...`);
    }
  }

  // 2. Try SMTP if configured
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const info = await smtp.sendMail({
        from: `"VOXORA AI" <${ENV.EMAIL_USER}>`,
        to,
        subject,
        text: text || subject,
        html,
      });

      console.log(`✅ [Email/SMTP] Sent to ${to}: "${subject}" (ID: ${info.messageId})`);
      return { success: true, message: 'Email sent successfully via SMTP', messageId: info.messageId };
    } catch (err: any) {
      console.error(`❌ [Email/SMTP Error]: ${err.message}`);
      return { success: false, message: `Failed to deliver email: ${err.message}` };
    }
  }

  // 3. Simulated Dev Mode: Log email to console
  console.log(`\n================== 📧 VOXORA EMAIL DISPATCH ==================`);
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`STATUS: Delivered (Simulated Dev Mode - Add RESEND_API_KEY in .env for live cloud delivery)`);
  console.log(`===============================================================\n`);

  return {
    success: true,
    message: `Email dispatched to ${to} (Simulated mode: view server log for contents)`,
    messageId: `sim_${Date.now()}`,
  };
};

// 1. Verification Email
export const sendVerificationEmail = async (user: IUser, token: string) => {
  const verifyUrl = `${ENV.APP_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0B0F19; color: #f1f5f9; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px; color: #ffffff; letter-spacing: 0.5px;">VOXORA AI</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff;">Your Voice. Your Personal AI Action Assistant.</p>
      </div>

      <div style="padding: 32px 24px;">
        <h2 style="font-size: 20px; color: #ffffff; margin-top: 0;">Welcome, ${user.fullName}!</h2>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Thank you for joining VOXORA AI. To activate automated email reminders and protect your account, please verify your email address.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background-color: #6366F1; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
            Verify My Email
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 4px;">
          Or copy and paste this link in your browser:
        </p>
        <p style="font-size: 12px; color: #818cf8; word-break: break-all; margin-top: 0;">
          ${verifyUrl}
        </p>

        <p style="font-size: 12px; color: #475569; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); pt: 16px;">
          This link will expire in 24 hours. If you did not create this account, please ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendSystemEmail({
    to: user.email,
    subject: 'Verify Your Email Address — VOXORA AI',
    html,
  });
};

// 2. Password Reset Email
export const sendPasswordResetEmail = async (user: IUser, token: string) => {
  const resetUrl = `${ENV.APP_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0B0F19; color: #f1f5f9; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <div style="background: linear-gradient(135deg, #e11d48 0%, #9333ea 100%); padding: 28px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px; color: #ffffff; letter-spacing: 0.5px;">VOXORA AI</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffe4e6;">Security & Account Recovery</p>
      </div>

      <div style="padding: 32px 24px;">
        <h2 style="font-size: 20px; color: #ffffff; margin-top: 0;">Password Reset Request</h2>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Hello ${user.fullName}, we received a request to reset your password for your VOXORA AI account.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #e11d48; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">
            Reset My Password
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          This link will expire in 1 hour. If you did not request a password reset, no further action is required; your password remains secure.
        </p>
      </div>
    </div>
  `;

  return sendSystemEmail({
    to: user.email,
    subject: 'Reset Your Password — VOXORA AI',
    html,
  });
};

// 3. Automated Reminder Alert Email
export const sendReminderEmail = async (reminder: IReminder, user: IUser) => {
  const tz = user.timezone || 'Asia/Kolkata';
  const dueFormatted = new Date(reminder.dueAt).toLocaleString('en-IN', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0B0F19; color: #f1f5f9; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 0.5px;">VOXORA AI</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #e0e7ff;">Speak. Understand. Act.</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #cbd5e1; margin-top: 0;">
          Hello <strong>${user.fullName}</strong>,
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
          This is your scheduled reminder from VOXORA AI:
        </p>

        <div style="background-color: #151C2C; border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 14px; padding: 20px; margin: 24px 0;">
          <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #818cf8; margin-bottom: 6px;">⏰ Reminder Alert</span>
          <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #ffffff;">${reminder.title}</h2>
          ${reminder.description ? `<p style="margin: 0 0 14px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">${reminder.description}</p>` : ''}
          <div style="display: inline-block; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #a5b4fc; font-weight: 600;">
            📅 ${dueFormatted} (${tz})
          </div>
        </div>

        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
          Your personal AI assistant is here to help you stay organized and never miss important deadlines.
        </p>

        <div style="text-align: center; margin-top: 28px;">
          <a href="${ENV.APP_URL}" style="background-color: #1e293b; color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 10px; font-size: 12px; font-weight: 600; text-decoration: none; display: inline-block;">
            Open VOXORA AI Dashboard
          </a>
        </div>
      </div>

      <div style="background-color: #080C14; padding: 16px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #475569;">
        Regards,<br><strong>The VOXORA AI Team</strong> • Automated registered-email notification
      </div>
    </div>
  `;

  return sendSystemEmail({
    to: user.email,
    subject: `Reminder: ${reminder.title} — VOXORA AI`,
    html,
  });
};

// 4. Test Notification Email
export const sendTestNotificationEmail = async (user: IUser) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0B0F19; color: #f1f5f9; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff;">VOXORA AI Test Notification</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #d1fae5;">Email Service Operational</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #cbd5e1; margin-top: 0;">
          Hello <strong>${user.fullName}</strong>,
        </p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
          Your registered email (<strong>${user.email}</strong>) is successfully configured to receive automated reminder alerts from VOXORA AI!
        </p>
        <p style="font-size: 13px; color: #10b981; font-weight: 600;">
          ✔ Delivery channel is verified and active.
        </p>
      </div>
    </div>
  `;

  return sendSystemEmail({
    to: user.email,
    subject: '🧪 VOXORA AI Email Notification Test',
    html,
  });
};
