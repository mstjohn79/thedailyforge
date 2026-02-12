const { Pool } = require('pg')
require('dotenv').config()

// Database connection
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function createBibleBooksTable() {
  try {
    console.log('Creating bible_books table...')
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS bible_books (
        id SERIAL PRIMARY KEY,
        book_id VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL,
        testament VARCHAR(10) NOT NULL CHECK (testament IN ('old', 'new')),
        chapters INTEGER NOT NULL,
        total_verses INTEGER,
        bible_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_book_bible UNIQUE(book_id, bible_id)
      );
    `
    
    await pool.query(createTableQuery)
    console.log('✅ bible_books table created successfully')
    
    // Create indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_bible_books_book_id ON bible_books(book_id)',
      'CREATE INDEX IF NOT EXISTS idx_bible_books_testament ON bible_books(testament)',
      'CREATE INDEX IF NOT EXISTS idx_bible_books_bible_id ON bible_books(bible_id)'
    ]
    
    for (const query of indexQueries) {
      await pool.query(query)
    }
    
    console.log('✅ Indexes created successfully')
    
  } catch (error) {
    console.error('❌ Error creating bible_books table:', error)
    throw error
  }
}

async function createBibleChaptersTable() {
  try {
    console.log('Creating bible_chapters table...')
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS bible_chapters (
        id SERIAL PRIMARY KEY,
        book_id VARCHAR(10) NOT NULL,
        chapter_number INTEGER NOT NULL,
        verse_count INTEGER NOT NULL,
        bible_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_book_chapter_bible UNIQUE(book_id, chapter_number, bible_id)
      );
    `
    
    await pool.query(createTableQuery)
    console.log('✅ bible_chapters table created successfully')
    
    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_bible_chapters_book_id ON bible_chapters(book_id)',
      'CREATE INDEX IF NOT EXISTS idx_bible_chapters_bible_id ON bible_chapters(bible_id)',
      'CREATE INDEX IF NOT EXISTS idx_bible_chapters_book_chapter ON bible_chapters(book_id, chapter_number)'
    ]
    
    for (const query of indexQueries) {
      await pool.query(query)
    }
    
    console.log('✅ Chapter indexes created successfully')
    
  } catch (error) {
    console.error('❌ Error creating bible_chapters table:', error)
    throw error
  }
}

async function main() {
  try {
    await createBibleBooksTable()
    await createBibleChaptersTable()
    console.log('🎉 Bible database tables created successfully!')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  main()
}

module.exports = { createBibleBooksTable, createBibleChaptersTable }
