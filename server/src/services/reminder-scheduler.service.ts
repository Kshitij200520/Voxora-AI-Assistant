import { Reminder, IReminder } from '../models/Reminder';
import { User, IUser } from '../models/User';
import { UserNotificationSettings } from '../models/UserNotificationSettings';
import { sendReminderEmail } from './email.service';
import { logActivity } from './activity.service';
import { getDatabaseStatus } from '../config/db';
import crypto from 'crypto';

let schedulerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

export const startReminderScheduler = () => {
  if (schedulerInterval) return;

  console.log('⏰ [Scheduler] Background multi-tenant reminder & email engine activated (15s interval)');

  schedulerInterval = setInterval(async () => {
    if (isProcessing) return; // Prevent overlapping runs
    isProcessing = true;

    try {
      const { connected } = getDatabaseStatus();
      if (!connected) return;

      const now = new Date();
      const claimId = crypto.randomBytes(8).toString('hex');
      const claimExpires = new Date(Date.now() + 60000); // 1-minute claim lock

      // 1. Find candidates due for alert
      const dueReminders = await Reminder.find({
        dueAt: { $lte: now },
        status: 'scheduled',
        emailNotificationEnabled: true,
        $or: [
          { emailStatus: 'pending' },
          { emailStatus: 'failed', claimExpires: { $lte: now } }, // Retry eligible failed items
        ],
      }).limit(20);

      for (const candidate of dueReminders) {
        // 2. Atomic claim to prevent race conditions or duplicate sends across workers
        const claimed = await Reminder.findOneAndUpdate(
          {
            _id: candidate._id,
            $or: [
              { emailStatus: 'pending' },
              { emailStatus: 'failed', claimExpires: { $lte: now } },
            ],
          },
          {
            $set: {
              emailStatus: 'processing',
              claimToken: claimId,
              claimExpires,
            },
          },
          { new: true }
        );

        if (!claimed) continue; // Claimed by another cycle

        try {
          // 3. Confirm owner exists
          if (!claimed.userId) {
            console.warn(`⚠️ [Scheduler] Reminder ${claimed._id} has no assigned userId. Skipping email.`);
            claimed.emailStatus = 'skipped';
            claimed.emailError = 'No user assigned';
            await claimed.save();
            continue;
          }

          const owner = await User.findById(claimed.userId);
          if (!owner) {
            console.warn(`⚠️ [Scheduler] Owner user ${claimed.userId} not found. Skipping.`);
            claimed.emailStatus = 'skipped';
            claimed.emailError = 'Owner user account not found';
            await claimed.save();
            continue;
          }

          // 4. Check user notification settings
          const settings = await UserNotificationSettings.findOne({ userId: owner._id });
          if (settings && settings.emailRemindersEnabled === false) {
            console.log(`ℹ️ [Scheduler] User ${owner.email} has disabled email reminders. Marking skipped.`);
            claimed.emailStatus = 'skipped';
            claimed.emailError = 'User disabled email reminders in settings';
            claimed.status = 'delivered';
            claimed.notificationSent = true;
            await claimed.save();
            continue;
          }

          // 5. Check if email is verified (enforced in production; permitted with warning in dev mode)
          if (!owner.isEmailVerified && process.env.NODE_ENV === 'production') {
            console.log(`ℹ️ [Scheduler] User ${owner.email} has not verified their email. Skipping alert.`);
            claimed.emailStatus = 'skipped';
            claimed.emailError = 'Owner email address is not verified';
            await claimed.save();
            continue;
          }

          // 6. Send email via unified provider
          console.log(`📧 [Scheduler] Sending reminder email to verified registered user: ${owner.email}`);
          const sendResult = await sendReminderEmail(claimed, owner);

          if (sendResult.success) {
            claimed.emailStatus = 'sent';
            claimed.emailSentAt = new Date();
            claimed.notificationSent = true;
            claimed.status = 'delivered';
            claimed.emailError = null;
            await claimed.save();

            await logActivity({
              userId: owner._id,
              actionType: 'REMINDER_EMAIL_SENT',
              description: `Automated email alert delivered for "${claimed.title}" to ${owner.email}`,
              entityType: 'reminder',
              entityId: claimed._id.toString(),
              status: 'success',
              metadata: { title: claimed.title, dueAt: claimed.dueAt, to: owner.email },
            });
          } else {
            claimed.emailStatus = 'failed';
            claimed.emailError = sendResult.message;
            await claimed.save();

            await logActivity({
              userId: owner._id,
              actionType: 'REMINDER_EMAIL_FAILED',
              description: `Failed to deliver reminder email for "${claimed.title}": ${sendResult.message}`,
              entityType: 'reminder',
              entityId: claimed._id.toString(),
              status: 'failed',
              metadata: { error: sendResult.message },
            });
          }
        } catch (itemErr: any) {
          console.error(`❌ [Scheduler Item Error]: ${itemErr.message}`);
          claimed.emailStatus = 'failed';
          claimed.emailError = itemErr.message;
          await claimed.save();
        }
      }
    } catch (err: any) {
      console.error('❌ [Scheduler Loop Error]:', err.message);
    } finally {
      isProcessing = false;
    }
  }, 15000);
};

export const stopReminderScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};
