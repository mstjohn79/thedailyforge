const { Pool } = require('pg')
require('dotenv').config()

// Database connection
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const API_BIBLE_KEY = process.env.API_BIBLE_KEY || '580329b134bf13e4305a57695080195b'
const BASE_URL = 'https://api.scripture.api.bible/v1'

// Bible IDs we want to sync
const BIBLE_IDS = [
  'de4e12af7f28f599-02', // ESV
  '65eec8e0b60e656b-01'  // NIV
]

async function fetchBibleBooks(bibleId) {
  try {
    console.log(`📖 Fetching books for Bible ID: ${bibleId}`)
    
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books`, {
      headers: { 'api-key': API_BIBLE_KEY }
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data || []
    
  } catch (error) {
    console.error(`❌ Error fetching books for ${bibleId}:`, error)
    throw error
  }
}

async function fetchBookChapters(bibleId, bookId) {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books/${bookId}/chapters`, {
      headers: { 'api-key': API_BIBLE_KEY }
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data || []
    
  } catch (error) {
    console.error(`❌ Error fetching chapters for ${bookId}:`, error)
    return []
  }
}

async function fetchChapterVerses(bibleId, chapterId) {
  try {
    const response = await fetch(`${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}/verses`, {
      headers: { 'api-key': API_BIBLE_KEY }
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data || []
    
  } catch (error) {
    console.error(`❌ Error fetching verses for ${chapterId}:`, error)
    return []
  }
}

async function syncBibleBooks(bibleId) {
  try {
    console.log(`\n🔄 Syncing Bible books for ${bibleId}...`)
    
    const books = await fetchBibleBooks(bibleId)
    console.log(`📚 Found ${books.length} books`)
    
    for (const book of books) {
      // Determine testament based on book ID
      const testament = book.id.startsWith('GEN') || book.id.startsWith('EXO') || 
                       book.id.startsWith('LEV') || book.id.startsWith('NUM') || 
                       book.id.startsWith('DEU') || book.id.startsWith('JOS') || 
                       book.id.startsWith('JDG') || book.id.startsWith('RUT') || 
                       book.id.startsWith('1SA') || book.id.startsWith('2SA') || 
                       book.id.startsWith('1KI') || book.id.startsWith('2KI') || 
                       book.id.startsWith('1CH') || book.id.startsWith('2CH') || 
                       book.id.startsWith('EZR') || book.id.startsWith('NEH') || 
                       book.id.startsWith('EST') || book.id.startsWith('JOB') || 
                       book.id.startsWith('PSA') || book.id.startsWith('PRO') || 
                       book.id.startsWith('ECC') || book.id.startsWith('SNG') || 
                       book.id.startsWith('ISA') || book.id.startsWith('JER') || 
                       book.id.startsWith('LAM') || book.id.startsWith('EZK') || 
                       book.id.startsWith('DAN') || book.id.startsWith('HOS') || 
                       book.id.startsWith('JOL') || book.id.startsWith('AMO') || 
                       book.id.startsWith('OBA') || book.id.startsWith('JON') || 
                       book.id.startsWith('MIC') || book.id.startsWith('NAH') || 
                       book.id.startsWith('HAB') || book.id.startsWith('ZEP') || 
                       book.id.startsWith('HAG') || book.id.startsWith('ZEC') || 
                       book.id.startsWith('MAL') ? 'old' : 'new'
      
      // Get chapters for this book
      const chapters = await fetchBookChapters(bibleId, book.id)
      const chapterCount = chapters.length
      
      // Calculate total verses
      let totalVerses = 0
      for (const chapter of chapters) {
        const verses = await fetchChapterVerses(bibleId, chapter.id)
        totalVerses += verses.length
        
        // Skip chapters with non-numeric numbers (like "intro")
        const chapterNumber = parseInt(chapter.number)
        if (isNaN(chapterNumber)) {
          console.log(`⚠️  Skipping chapter with non-numeric number: ${chapter.number}`)
          continue
        }
        
        // Store chapter data
        await pool.query(`
          INSERT INTO bible_chapters (book_id, chapter_number, verse_count, bible_id)
          VALUES ($1, $2, $3, $4)
        `, [book.id, chapterNumber, verses.length, bibleId])
      }
      
      // Store book data
      await pool.query(`
        INSERT INTO bible_books (book_id, name, testament, chapters, total_verses, bible_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [book.id, book.name, testament, chapterCount, totalVerses, bibleId])
      
      console.log(`✅ Synced ${book.name} (${chapterCount} chapters, ${totalVerses} verses)`)
    }
    
  } catch (error) {
    console.error(`❌ Error syncing Bible books for ${bibleId}:`, error)
    throw error
  }
}

async function main() {
  try {
    console.log('🚀 Starting Bible books sync...')
    
    for (const bibleId of BIBLE_IDS) {
      await syncBibleBooks(bibleId)
    }
    
    console.log('\n🎉 Bible books sync completed successfully!')
    
  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  main()
}

module.exports = { syncBibleBooks }
