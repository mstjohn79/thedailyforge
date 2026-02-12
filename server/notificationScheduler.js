const cron = require('node-cron');
const { Pool } = require('pg');
const smsService = require('./smsService');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

class NotificationScheduler {
  constructor() {
    this.isRunning = false;
    this.jobs = new Map();
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('📅 Notification scheduler is already running');
      return;
    }

    console.log('🚀 Starting Daily David notification scheduler...');
    
    // Schedule daily notifications at 7:00 AM EST (default)
    this.scheduleDailyNotifications();
    
    // Schedule cleanup job to run weekly
    this.scheduleCleanup();
    
    this.isRunning = true;
    console.log('✅ Notification scheduler started successfully');
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      console.log('📅 Notification scheduler is not running');
      return;
    }

    console.log('🛑 Stopping notification scheduler...');
    
    // Stop all cron jobs
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️  Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ Notification scheduler stopped');
  }

  // Schedule daily notifications
  scheduleDailyNotifications() {
    // Run every minute to check for users who should receive notifications
    // This allows for different time zones and notification times
    const job = cron.schedule('* * * * *', async () => {
      await this.sendDailyNotifications();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    this.jobs.set('daily-notifications', job);
    job.start();
    console.log('⏰ Daily notifications scheduled (runs every minute)');
  }

  // Schedule cleanup job
  scheduleCleanup() {
    // Run cleanup every Sunday at 2 AM
    const job = cron.schedule('0 2 * * 0', async () => {
      await this.cleanupOldLogs();
    }, {
      scheduled: false,
      timezone: 'America/New_York'
    });

    this.jobs.set('cleanup', job);
    job.start();
    console.log('🧹 Cleanup job scheduled (runs weekly on Sunday at 2 AM)');
  }

  // Send daily notifications to eligible users
  async sendDailyNotifications() {
    const client = await pool.connect();
    
    try {
      // Get current time in different timezones
      const now = new Date();
      
      // Find users who should receive notifications now
      const result = await client.query(`
        SELECT 
          us.user_id,
          us.phone_number,
          us.notification_time,
          us.timezone,
          us.notification_frequency,
          us.last_notification_sent,
          u.display_name
        FROM user_settings us
        JOIN users u ON us.user_id = u.id
        WHERE 
          us.sms_notifications_enabled = true
          AND us.phone_number IS NOT NULL
          AND us.phone_number != ''
          AND (
            us.last_notification_sent IS NULL 
            OR us.last_notification_sent < CURRENT_DATE
            OR us.notification_frequency = 'daily'
          )
      `);

      console.log(`📱 Found ${result.rows.length} users eligible for notifications`);

      for (const user of result.rows) {
        try {
          // Check if it's time to send notification for this user
          if (await this.shouldSendNotification(user, now)) {
            await this.sendUserNotification(user, client);
          }
        } catch (error) {
          console.error(`❌ Error sending notification to user ${user.user_id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in sendDailyNotifications:', error);
    } finally {
      client.release();
    }
  }

  // Check if we should send notification to a specific user
  async shouldSendNotification(user, now) {
    try {
      // Parse notification time
      const [hours, minutes] = user.notification_time.split(':').map(Number);
      
      // Get current time in user's timezone
      const userTime = new Date(now.toLocaleString("en-US", {timeZone: user.timezone}));
      const currentHour = userTime.getHours();
      const currentMinute = userTime.getMinutes();
      
      // Check if it's the right time (within 1 minute window)
      const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (hours * 60 + minutes));
      
      if (timeDiff <= 1) {
        // Check if we already sent today
        const lastSent = user.last_notification_sent;
        if (lastSent) {
          const lastSentDate = new Date(lastSent);
          const today = new Date();
          
          // If we already sent today, skip
          if (lastSentDate.toDateString() === today.toDateString()) {
            return false;
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking notification time:', error);
      return false;
    }
  }

  // Send notification to a specific user
  async sendUserNotification(user, client) {
    try {
      console.log(`📤 Sending daily notification to ${user.display_name} (${user.phone_number})`);
      
      // Send the daily inspiration message
      const result = await smsService.sendDailyInspiration(user.phone_number, user.display_name);
      
      // Log the notification
      await client.query(`
        INSERT INTO notification_logs (
          user_id, phone_number, message_content, message_type, status, twilio_sid
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        user.user_id,
        user.phone_number,
        'Daily inspiration message sent',
        'daily_inspiration',
        result.success ? 'sent' : 'failed',
        result.sid || null
      ]);
      
      if (result.success) {
        // Update last notification sent time
        await client.query(`
          UPDATE user_settings 
          SET last_notification_sent = NOW() 
          WHERE user_id = $1
        `, [user.user_id]);
        
        console.log(`✅ Notification sent successfully to ${user.display_name}`);
      } else {
        console.error(`❌ Failed to send notification to ${user.display_name}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error sending notification to user ${user.user_id}:`, error);
    }
  }

  // Cleanup old notification logs
  async cleanupOldLogs() {
    const client = await pool.connect();
    
    try {
      console.log('🧹 Starting cleanup of old notification logs...');
      
      // Delete logs older than 90 days
      const result = await client.query(`
        DELETE FROM notification_logs 
        WHERE sent_at < NOW() - INTERVAL '90 days'
      `);
      
      console.log(`🗑️  Cleaned up ${result.rowCount} old notification logs`);
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    } finally {
      client.release();
    }
  }

  // Manual trigger for testing
  async triggerDailyNotifications() {
    console.log('🔔 Manually triggering daily notifications...');
    await this.sendDailyNotifications();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }
}

// Create singleton instance
const scheduler = new NotificationScheduler();

// Export the scheduler
module.exports = scheduler;

// Auto-start scheduler if this file is run directly
if (require.main === module) {
  scheduler.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });
}


