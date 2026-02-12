const { Pool } = require('pg')

// Use the connection string from SETUP_NEON.md
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function createSermonNotesTable() {
  const client = await pool.connect()
  
  try {
    console.log('Creating sermon_notes table...')
    
    // Create the sermon_notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sermon_notes (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        church_name VARCHAR(255) NOT NULL,
        sermon_title VARCHAR(500) NOT NULL,
        speaker_name VARCHAR(255) NOT NULL,
        bible_passage TEXT NOT NULL,
        notes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('Creating indexes...')
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sermon_notes_user_date 
      ON sermon_notes(user_id, date DESC)
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sermon_notes_search 
      ON sermon_notes(user_id, church_name, speaker_name, sermon_title)
    `)
    
    console.log('✅ sermon_notes table and indexes created successfully!')
    
    // Test the table by checking if it exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sermon_notes'
    `)
    
    if (result.rows.length > 0) {
      console.log('✅ Table verification successful - sermon_notes table exists')
    } else {
      console.log('❌ Table verification failed - sermon_notes table not found')
    }
    
  } catch (error) {
    console.error('❌ Error creating sermon_notes table:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run the setup
createSermonNotesTable()
  .then(() => {
    console.log('Database setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Database setup failed:', error)
    process.exit(1)
  })
