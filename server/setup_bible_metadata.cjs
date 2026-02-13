// Generate Bible metadata tables from downloaded verse data
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_MXzOtdlBT65r@ep-calm-band-airu6rtp-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const BOOKS_METADATA = [
  { id: 'GEN', name: 'Genesis', testament: 'old' },
  { id: 'EXO', name: 'Exodus', testament: 'old' },
  { id: 'LEV', name: 'Leviticus', testament: 'old' },
  { id: 'NUM', name: 'Numbers', testament: 'old' },
  { id: 'DEU', name: 'Deuteronomy', testament: 'old' },
  { id: 'JOS', name: 'Joshua', testament: 'old' },
  { id: 'JDG', name: 'Judges', testament: 'old' },
  { id: 'RUT', name: 'Ruth', testament: 'old' },
  { id: '1SA', name: '1 Samuel', testament: 'old' },
  { id: '2SA', name: '2 Samuel', testament: 'old' },
  { id: '1KI', name: '1 Kings', testament: 'old' },
  { id: '2KI', name: '2 Kings', testament: 'old' },
  { id: '1CH', name: '1 Chronicles', testament: 'old' },
  { id: '2CH', name: '2 Chronicles', testament: 'old' },
  { id: 'EZR', name: 'Ezra', testament: 'old' },
  { id: 'NEH', name: 'Nehemiah', testament: 'old' },
  { id: 'EST', name: 'Esther', testament: 'old' },
  { id: 'JOB', name: 'Job', testament: 'old' },
  { id: 'PSA', name: 'Psalms', testament: 'old' },
  { id: 'PRO', name: 'Proverbs', testament: 'old' },
  { id: 'ECC', name: 'Ecclesiastes', testament: 'old' },
  { id: 'SNG', name: 'Song of Solomon', testament: 'old' },
  { id: 'ISA', name: 'Isaiah', testament: 'old' },
  { id: 'JER', name: 'Jeremiah', testament: 'old' },
  { id: 'LAM', name: 'Lamentations', testament: 'old' },
  { id: 'EZK', name: 'Ezekiel', testament: 'old' },
  { id: 'DAN', name: 'Daniel', testament: 'old' },
  { id: 'HOS', name: 'Hosea', testament: 'old' },
  { id: 'JOL', name: 'Joel', testament: 'old' },
  { id: 'AMO', name: 'Amos', testament: 'old' },
  { id: 'OBA', name: 'Obadiah', testament: 'old' },
  { id: 'JON', name: 'Jonah', testament: 'old' },
  { id: 'MIC', name: 'Micah', testament: 'old' },
  { id: 'NAH', name: 'Nahum', testament: 'old' },
  { id: 'HAB', name: 'Habakkuk', testament: 'old' },
  { id: 'ZEP', name: 'Zephaniah', testament: 'old' },
  { id: 'HAG', name: 'Haggai', testament: 'old' },
  { id: 'ZEC', name: 'Zechariah', testament: 'old' },
  { id: 'MAL', name: 'Malachi', testament: 'old' },
  { id: 'MAT', name: 'Matthew', testament: 'new' },
  { id: 'MRK', name: 'Mark', testament: 'new' },
  { id: 'LUK', name: 'Luke', testament: 'new' },
  { id: 'JHN', name: 'John', testament: 'new' },
  { id: 'ACT', name: 'Acts', testament: 'new' },
  { id: 'ROM', name: 'Romans', testament: 'new' },
  { id: '1CO', name: '1 Corinthians', testament: 'new' },
  { id: '2CO', name: '2 Corinthians', testament: 'new' },
  { id: 'GAL', name: 'Galatians', testament: 'new' },
  { id: 'EPH', name: 'Ephesians', testament: 'new' },
  { id: 'PHP', name: 'Philippians', testament: 'new' },
  { id: 'COL', name: 'Colossians', testament: 'new' },
  { id: '1TH', name: '1 Thessalonians', testament: 'new' },
  { id: '2TH', name: '2 Thessalonians', testament: 'new' },
  { id: '1TI', name: '1 Timothy', testament: 'new' },
  { id: '2TI', name: '2 Timothy', testament: 'new' },
  { id: 'TIT', name: 'Titus', testament: 'new' },
  { id: 'PHM', name: 'Philemon', testament: 'new' },
  { id: 'HEB', name: 'Hebrews', testament: 'new' },
  { id: 'JAS', name: 'James', testament: 'new' },
  { id: '1PE', name: '1 Peter', testament: 'new' },
  { id: '2PE', name: '2 Peter', testament: 'new' },
  { id: '1JN', name: '1 John', testament: 'new' },
  { id: '2JN', name: '2 John', testament: 'new' },
  { id: '3JN', name: '3 John', testament: 'new' },
  { id: 'JUD', name: 'Jude', testament: 'new' },
  { id: 'REV', name: 'Revelation', testament: 'new' }
];

async function main() {
  console.log('Setting up Bible metadata tables...\n');
  
  const client = await pool.connect();
  
  try {
    // Drop existing tables and recreate with correct schema
    console.log('Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS bible_chapters CASCADE');
    await client.query('DROP TABLE IF EXISTS bible_books CASCADE');
    
    // Create bible_books table
    console.log('Creating bible_books table...');
    await client.query(`
      CREATE TABLE bible_books (
        book_id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        testament VARCHAR(10) NOT NULL,
        chapters INTEGER DEFAULT 0,
        total_verses INTEGER DEFAULT 0
      )
    `);
    
    // Create bible_chapters table
    console.log('Creating bible_chapters table...');
    await client.query(`
      CREATE TABLE bible_chapters (
        id SERIAL PRIMARY KEY,
        book_id VARCHAR(10) NOT NULL,
        chapter_number INTEGER NOT NULL,
        verse_count INTEGER NOT NULL,
        UNIQUE(book_id, chapter_number)
      )
    `);
    
    // Get chapter and verse counts from our downloaded data (using ESV as reference)
    console.log('\nGathering chapter data from bible_verses...');
    
    const chapterData = await client.query(`
      SELECT book_id, chapter, MAX(verse) as verse_count
      FROM bible_verses
      WHERE translation = 'esv'
      GROUP BY book_id, chapter
      ORDER BY book_id, chapter
    `);
    
    // Organize data by book
    const bookStats = {};
    for (const row of chapterData.rows) {
      if (!bookStats[row.book_id]) {
        bookStats[row.book_id] = { chapters: 0, totalVerses: 0, chapterVerses: [] };
      }
      bookStats[row.book_id].chapters++;
      bookStats[row.book_id].totalVerses += parseInt(row.verse_count);
      bookStats[row.book_id].chapterVerses.push({
        chapter: row.chapter,
        verseCount: parseInt(row.verse_count)
      });
    }
    
    // Clear existing data
    await client.query('DELETE FROM bible_chapters');
    await client.query('DELETE FROM bible_books');
    
    // Insert books
    console.log('\nInserting book metadata...');
    for (const book of BOOKS_METADATA) {
      const stats = bookStats[book.id] || { chapters: 0, totalVerses: 0 };
      await client.query(`
        INSERT INTO bible_books (book_id, name, testament, chapters, total_verses)
        VALUES ($1, $2, $3, $4, $5)
      `, [book.id, book.name, book.testament, stats.chapters, stats.totalVerses]);
      console.log(`  ${book.name}: ${stats.chapters} chapters, ${stats.totalVerses} verses`);
    }
    
    // Insert chapters
    console.log('\nInserting chapter metadata...');
    let chapterCount = 0;
    for (const bookId in bookStats) {
      for (const ch of bookStats[bookId].chapterVerses) {
        await client.query(`
          INSERT INTO bible_chapters (book_id, chapter_number, verse_count)
          VALUES ($1, $2, $3)
        `, [bookId, ch.chapter, ch.verseCount]);
        chapterCount++;
      }
    }
    
    console.log(`\n✅ Done! Inserted ${BOOKS_METADATA.length} books and ${chapterCount} chapters.`);
    
    // Verify
    const bookCount = await client.query('SELECT COUNT(*) FROM bible_books');
    const chapCount = await client.query('SELECT COUNT(*) FROM bible_chapters');
    console.log(`\nVerification:`);
    console.log(`  bible_books: ${bookCount.rows[0].count} rows`);
    console.log(`  bible_chapters: ${chapCount.rows[0].count} rows`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
