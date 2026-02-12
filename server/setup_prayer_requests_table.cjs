const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupPrayerRequestsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Setting up prayer_requests table...');
    
    // Create prayer_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prayer_requests (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        person_name VARCHAR(255),
        category VARCHAR(100) DEFAULT 'other',
        status VARCHAR(50) DEFAULT 'active',
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        answered_at TIMESTAMP NULL,
        praise_report TEXT NULL
      )
    `);
    
    console.log('✅ prayer_requests table created');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id 
      ON prayer_requests(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_status 
      ON prayer_requests(user_id, status)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_category 
      ON prayer_requests(user_id, category)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at 
      ON prayer_requests(created_at DESC)
    `);
    
    console.log('✅ Indexes created');
    
    // Create trigger to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_prayer_requests_updated_at ON prayer_requests
    `);
    
    await client.query(`
      CREATE TRIGGER update_prayer_requests_updated_at
      BEFORE UPDATE ON prayer_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);
    
    console.log('✅ Triggers created');
    
    // Test the table with a sample query
    const result = await client.query(`
      SELECT COUNT(*) as count FROM prayer_requests
    `);
    
    console.log(`📊 Current prayer requests count: ${result.rows[0].count}`);
    
    console.log('🎉 Prayer requests table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up prayer_requests table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the setup
setupPrayerRequestsTable()
  .then(() => {
    console.log('✅ Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
