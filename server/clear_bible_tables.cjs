const { Pool } = require('pg')
require('dotenv').config()

// Database connection
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function clearBibleTables() {
  try {
    console.log('Clearing Bible tables...')
    
    await pool.query('DELETE FROM bible_chapters')
    console.log('✅ Cleared bible_chapters table')
    
    await pool.query('DELETE FROM bible_books')
    console.log('✅ Cleared bible_books table')
    
    console.log('🎉 Bible tables cleared successfully!')
    
  } catch (error) {
    console.error('❌ Error clearing tables:', error)
    throw error
  }
}

async function main() {
  try {
    await clearBibleTables()
  } catch (error) {
    console.error('❌ Clear failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  main()
}

module.exports = { clearBibleTables }
