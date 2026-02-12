const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
})

async function setupSermonNotesTable() {
  const client = await pool.connect()
  
  try {
    console.log('Creating sermon_notes table...')
    
    // Create the sermon_notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sermon_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    console.error('❌ Error setting up sermon_notes table:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run the setup
setupSermonNotesTable()
  .then(() => {
    console.log('Database setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Database setup failed:', error)
    process.exit(1)
  })