const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupUserSettingsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up user_settings table...');
    
    // Create user_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phone_number VARCHAR(20),
        sms_notifications_enabled BOOLEAN DEFAULT FALSE,
        notification_time TIME DEFAULT '07:00:00',
        timezone VARCHAR(50) DEFAULT 'America/New_York',
        last_notification_sent TIMESTAMP NULL,
        notification_frequency VARCHAR(20) DEFAULT 'daily',
        onboarding_completed BOOLEAN DEFAULT FALSE,
        onboarding_completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    
    console.log('✅ user_settings table created');
    
    // Add onboarding columns if they don't exist (for existing tables)
    await client.query(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE
    `);
    
    await client.query(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP NULL
    `);
    
    console.log('✅ Onboarding columns added/verified');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
      ON user_settings(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_sms_enabled 
      ON user_settings(sms_notifications_enabled)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_phone_number 
      ON user_settings(phone_number)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding_completed 
      ON user_settings(onboarding_completed)
    `);
    
    console.log('✅ Indexes created');
    
    // Create trigger to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_user_settings_updated_at ON user_settings;
      CREATE TRIGGER trigger_update_user_settings_updated_at
        BEFORE UPDATE ON user_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_user_settings_updated_at();
    `);
    
    console.log('✅ Triggers created');
    
    // Create notification_logs table to track sent notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phone_number VARCHAR(20) NOT NULL,
        message_content TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'daily_inspiration',
        status VARCHAR(20) DEFAULT 'sent',
        twilio_sid VARCHAR(100),
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ notification_logs table created');
    
    // Create indexes for notification_logs
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id 
      ON notification_logs(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
      ON notification_logs(sent_at DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_status 
      ON notification_logs(status)
    `);
    
    console.log('✅ Notification logs indexes created');
    
    console.log('🎉 User settings and notification system setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up user settings table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupUserSettingsTable()
  .then(() => {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });

