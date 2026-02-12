require('dotenv').config();
const { Pool } = require('pg');

// Use the DATABASE_URL from your environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createSupportRequestsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🗄️  Creating support_requests table in Neon database...');
    
    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Table created successfully');

    // Create indexes
    console.log('📊 Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_requests_user_id 
      ON support_requests(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_requests_status 
      ON support_requests(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_requests_created_at 
      ON support_requests(created_at DESC);
    `);

    console.log('✅ All indexes created successfully');

    // Verify the table exists
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'support_requests' 
      ORDER BY ordinal_position;
    `);

    console.log('📋 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('🎉 Support requests table is ready!');
    
  } catch (error) {
    console.error('❌ Error creating support requests table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSupportRequestsTable()
  .then(() => {
    console.log('✅ Database setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
