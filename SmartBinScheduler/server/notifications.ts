import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { User, Bin } from '@shared/schema';
import { storage } from './storage';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  throw new Error("Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) must be set");
}

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function formatMessage(username: string, bin: Bin): string {
  return `Hello ${username}! Your ${bin.color} ${bin.binType} bin is due tomorrow!`;
}

async function sendEmail(to: string, message: string) {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Bin Collection Reminder',
      text: message,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

async function sendSMS(to: string, message: string) {
  try {
    await twilioClient.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    console.log(`SMS sent to ${to}: "${message}"`);
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}

export async function sendBinReminder(user: User, bin: Bin) {
  const message = formatMessage(user.username, bin);
  console.log(`Preparing to send reminder for ${bin.binType} bin to ${user.username}`);

  try {
    if (bin.notificationType === 'Email') {
      await sendEmail(user.email, message);
    } else if (bin.notificationType === 'SMS' && bin.phoneNumber) {
      await sendSMS(bin.phoneNumber, message);
    }
  } catch (error) {
    console.error('Failed to send reminder:', error);
  }
}

function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

export async function scheduleReminders() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Get all bins with collections tomorrow
    const bins = await storage.getAllBins();
    console.log(`Scheduling reminders for ${bins.length} bins`);

    for (const bin of bins) {
      try {
        if (!bin.collectionDay || !bin.notificationTime) {
          console.log(`Skipping bin ${bin.id}: Missing collection day or notification time`);
          continue;
        }

        if (!isValidTimeFormat(bin.notificationTime)) {
          console.error(`Invalid time format for bin ${bin.id}: ${bin.notificationTime}`);
          continue;
        }

        const collectionDates = bin.collectionDay.split(',')
          .map(d => d.trim())
          .filter(d => isValidDate(d))
          .map(d => new Date(d).toISOString().split('T')[0]); // Format: YYYY-MM-DD

        if (collectionDates.length === 0) {
          console.error(`No valid collection dates for bin ${bin.id}`);
          continue;
        }

        // Check if tomorrow is a collection day
        if (collectionDates.includes(tomorrowStr)) {
          const user = await storage.getUser(bin.userId);
          if (!user) {
            console.log(`User not found for bin ${bin.id}`);
            continue;
          }

          // Schedule notification at the specified time today
          const [hours, minutes] = bin.notificationTime.split(':');
          const notificationTime = new Date(now);
          notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Only schedule if the notification time hasn't passed yet
          if (notificationTime > now) {
            console.log(`Scheduling reminder for bin ${bin.id} (${bin.binType}) at ${notificationTime.toISOString()}`);

            const delay = notificationTime.getTime() - now.getTime();
            setTimeout(() => {
              console.log(`Sending reminder for bin ${bin.id} (${bin.binType})`);
              sendBinReminder(user, bin);
            }, delay);
          } else {
            console.log(`Notification time ${bin.notificationTime} has already passed for today, skipping bin ${bin.id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing bin ${bin.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in scheduleReminders:', error);
  }
}