const { Pool } = require('pg')
require('dotenv').config()

// Database connection
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function updateSermonNotesSchema() {
  try {
    console.log('Updating sermon_notes table schema...')
    
    // Add verse metadata columns
    const alterQueries = [
      'ALTER TABLE sermon_notes ADD COLUMN IF NOT EXISTS bible_book VARCHAR(10)',
      'ALTER TABLE sermon_notes ADD COLUMN IF NOT EXISTS bible_chapter INTEGER',
      'ALTER TABLE sermon_notes ADD COLUMN IF NOT EXISTS verse_start INTEGER',
      'ALTER TABLE sermon_notes ADD COLUMN IF NOT EXISTS verse_end INTEGER',
      'ALTER TABLE sermon_notes ADD COLUMN IF NOT EXISTS bible_version VARCHAR(50)',
      'ALTER TABLE sermon_notes ADD COLUMN IF NOT EXISTS verse_reference TEXT',
      'ALTER TABLE sermon_notes ADD COLUMN IF NOT EXISTS verse_content TEXT'
    ]
    
    for (const query of alterQueries) {
      await pool.query(query)
      console.log(`✅ Added column: ${query.split(' ')[5]}`)
    }
    
    // Create indexes for better search performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_sermon_notes_bible_book ON sermon_notes(bible_book)',
      'CREATE INDEX IF NOT EXISTS idx_sermon_notes_bible_chapter ON sermon_notes(bible_chapter)',
      'CREATE INDEX IF NOT EXISTS idx_sermon_notes_verse_range ON sermon_notes(verse_start, verse_end)',
      'CREATE INDEX IF NOT EXISTS idx_sermon_notes_bible_version ON sermon_notes(bible_version)'
    ]
    
    for (const query of indexQueries) {
      await pool.query(query)
      console.log(`✅ Created index: ${query.split(' ')[4]}`)
    }
    
    console.log('🎉 Sermon notes schema updated successfully!')
    
  } catch (error) {
    console.error('❌ Error updating schema:', error)
    throw error
  }
}

async function main() {
  try {
    await updateSermonNotesSchema()
  } catch (error) {
    console.error('❌ Schema update failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  main()
}

module.exports = { updateSermonNotesSchema }
