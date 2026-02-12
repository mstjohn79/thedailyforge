const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function addScriptureModePreference() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding soap_scripture_mode column to user_settings table...');
    
    // Add the new column
    await client.query(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS soap_scripture_mode VARCHAR(20) DEFAULT 'plan'
    `);
    
    console.log('✅ soap_scripture_mode column added successfully');
    
    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_soap_scripture_mode 
      ON user_settings(soap_scripture_mode)
    `);
    
    console.log('✅ Index created for soap_scripture_mode');
    
  } catch (error) {
    console.error('❌ Error adding scripture mode preference:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
addScriptureModePreference()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
