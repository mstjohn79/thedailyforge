// Setup Bible Verses Table and Download ESV + NLT
// This script creates the bible_verses table and downloads all verses from both translations

const { Pool } = require('pg');

// Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_MXzOtdlBT65r@ep-calm-band-airu6rtp-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const RKEPLIN_API_BASE = 'https://bible-go-api.rkeplin.com/v1';

// Book mapping for the rkeplin API
const BOOKS = [
  { id: 1, abbrev: 'GEN', name: 'Genesis', chapters: 50 },
  { id: 2, abbrev: 'EXO', name: 'Exodus', chapters: 40 },
  { id: 3, abbrev: 'LEV', name: 'Leviticus', chapters: 27 },
  { id: 4, abbrev: 'NUM', name: 'Numbers', chapters: 36 },
  { id: 5, abbrev: 'DEU', name: 'Deuteronomy', chapters: 34 },
  { id: 6, abbrev: 'JOS', name: 'Joshua', chapters: 24 },
  { id: 7, abbrev: 'JDG', name: 'Judges', chapters: 21 },
  { id: 8, abbrev: 'RUT', name: 'Ruth', chapters: 4 },
  { id: 9, abbrev: '1SA', name: '1 Samuel', chapters: 31 },
  { id: 10, abbrev: '2SA', name: '2 Samuel', chapters: 24 },
  { id: 11, abbrev: '1KI', name: '1 Kings', chapters: 22 },
  { id: 12, abbrev: '2KI', name: '2 Kings', chapters: 25 },
  { id: 13, abbrev: '1CH', name: '1 Chronicles', chapters: 29 },
  { id: 14, abbrev: '2CH', name: '2 Chronicles', chapters: 36 },
  { id: 15, abbrev: 'EZR', name: 'Ezra', chapters: 10 },
  { id: 16, abbrev: 'NEH', name: 'Nehemiah', chapters: 13 },
  { id: 17, abbrev: 'EST', name: 'Esther', chapters: 10 },
  { id: 18, abbrev: 'JOB', name: 'Job', chapters: 42 },
  { id: 19, abbrev: 'PSA', name: 'Psalms', chapters: 150 },
  { id: 20, abbrev: 'PRO', name: 'Proverbs', chapters: 31 },
  { id: 21, abbrev: 'ECC', name: 'Ecclesiastes', chapters: 12 },
  { id: 22, abbrev: 'SNG', name: 'Song of Solomon', chapters: 8 },
  { id: 23, abbrev: 'ISA', name: 'Isaiah', chapters: 66 },
  { id: 24, abbrev: 'JER', name: 'Jeremiah', chapters: 52 },
  { id: 25, abbrev: 'LAM', name: 'Lamentations', chapters: 5 },
  { id: 26, abbrev: 'EZK', name: 'Ezekiel', chapters: 48 },
  { id: 27, abbrev: 'DAN', name: 'Daniel', chapters: 12 },
  { id: 28, abbrev: 'HOS', name: 'Hosea', chapters: 14 },
  { id: 29, abbrev: 'JOL', name: 'Joel', chapters: 3 },
  { id: 30, abbrev: 'AMO', name: 'Amos', chapters: 9 },
  { id: 31, abbrev: 'OBA', name: 'Obadiah', chapters: 1 },
  { id: 32, abbrev: 'JON', name: 'Jonah', chapters: 4 },
  { id: 33, abbrev: 'MIC', name: 'Micah', chapters: 7 },
  { id: 34, abbrev: 'NAH', name: 'Nahum', chapters: 3 },
  { id: 35, abbrev: 'HAB', name: 'Habakkuk', chapters: 3 },
  { id: 36, abbrev: 'ZEP', name: 'Zephaniah', chapters: 3 },
  { id: 37, abbrev: 'HAG', name: 'Haggai', chapters: 2 },
  { id: 38, abbrev: 'ZEC', name: 'Zechariah', chapters: 14 },
  { id: 39, abbrev: 'MAL', name: 'Malachi', chapters: 4 },
  { id: 40, abbrev: 'MAT', name: 'Matthew', chapters: 28 },
  { id: 41, abbrev: 'MRK', name: 'Mark', chapters: 16 },
  { id: 42, abbrev: 'LUK', name: 'Luke', chapters: 24 },
  { id: 43, abbrev: 'JHN', name: 'John', chapters: 21 },
  { id: 44, abbrev: 'ACT', name: 'Acts', chapters: 28 },
  { id: 45, abbrev: 'ROM', name: 'Romans', chapters: 16 },
  { id: 46, abbrev: '1CO', name: '1 Corinthians', chapters: 16 },
  { id: 47, abbrev: '2CO', name: '2 Corinthians', chapters: 13 },
  { id: 48, abbrev: 'GAL', name: 'Galatians', chapters: 6 },
  { id: 49, abbrev: 'EPH', name: 'Ephesians', chapters: 6 },
  { id: 50, abbrev: 'PHP', name: 'Philippians', chapters: 4 },
  { id: 51, abbrev: 'COL', name: 'Colossians', chapters: 4 },
  { id: 52, abbrev: '1TH', name: '1 Thessalonians', chapters: 5 },
  { id: 53, abbrev: '2TH', name: '2 Thessalonians', chapters: 3 },
  { id: 54, abbrev: '1TI', name: '1 Timothy', chapters: 6 },
  { id: 55, abbrev: '2TI', name: '2 Timothy', chapters: 4 },
  { id: 56, abbrev: 'TIT', name: 'Titus', chapters: 3 },
  { id: 57, abbrev: 'PHM', name: 'Philemon', chapters: 1 },
  { id: 58, abbrev: 'HEB', name: 'Hebrews', chapters: 13 },
  { id: 59, abbrev: 'JAS', name: 'James', chapters: 5 },
  { id: 60, abbrev: '1PE', name: '1 Peter', chapters: 5 },
  { id: 61, abbrev: '2PE', name: '2 Peter', chapters: 3 },
  { id: 62, abbrev: '1JN', name: '1 John', chapters: 5 },
  { id: 63, abbrev: '2JN', name: '2 John', chapters: 1 },
  { id: 64, abbrev: '3JN', name: '3 John', chapters: 1 },
  { id: 65, abbrev: 'JUD', name: 'Jude', chapters: 1 },
  { id: 66, abbrev: 'REV', name: 'Revelation', chapters: 22 }
];

async function setupTable() {
  console.log('Creating bible_verses table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bible_verses (
      id SERIAL PRIMARY KEY,
      translation VARCHAR(10) NOT NULL,
      book_id VARCHAR(10) NOT NULL,
      book_name VARCHAR(50) NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_verse UNIQUE(translation, book_id, chapter, verse)
    );
    
    CREATE INDEX IF NOT EXISTS idx_bible_verses_translation ON bible_verses(translation);
    CREATE INDEX IF NOT EXISTS idx_bible_verses_book ON bible_verses(book_id);
    CREATE INDEX IF NOT EXISTS idx_bible_verses_lookup ON bible_verses(translation, book_id, chapter);
    CREATE INDEX IF NOT EXISTS idx_bible_verses_full_lookup ON bible_verses(translation, book_id, chapter, verse);
  `);
  
  console.log('Table created successfully!');
}

async function fetchChapter(bookId, chapter, translation) {
  const url = `${RKEPLIN_API_BASE}/books/${bookId}/chapters/${chapter}?translation=${translation}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${translation} book ${bookId} chapter ${chapter}: ${response.status}`);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${translation} book ${bookId} chapter ${chapter}:`, error.message);
    return [];
  }
}

async function downloadAndStoreTranslation(translation) {
  console.log(`\nDownloading ${translation.toUpperCase()} translation...`);
  
  let totalVerses = 0;
  let totalChapters = 0;
  
  for (const book of BOOKS) {
    console.log(`  ${book.name} (${book.chapters} chapters)...`);
    
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const verses = await fetchChapter(book.id, chapter, translation);
      
      if (verses.length > 0) {
        // Batch insert verses
        const values = verses.map(v => [
          translation,
          book.abbrev,
          book.name,
          chapter,
          v.verseId,
          v.verse
        ]);
        
        // Use ON CONFLICT to handle duplicates
        const insertQuery = `
          INSERT INTO bible_verses (translation, book_id, book_name, chapter, verse, text)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (translation, book_id, chapter, verse) 
          DO UPDATE SET text = EXCLUDED.text
        `;
        
        for (const row of values) {
          await pool.query(insertQuery, row);
        }
        
        totalVerses += verses.length;
        totalChapters++;
      }
      
      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`  ${translation.toUpperCase()} complete: ${totalChapters} chapters, ${totalVerses} verses`);
  return totalVerses;
}

async function getExistingCount(translation) {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM bible_verses WHERE translation = $1',
    [translation]
  );
  return parseInt(result.rows[0].count);
}

async function main() {
  console.log('='.repeat(60));
  console.log('Bible Verses Setup Script');
  console.log('='.repeat(60));
  
  try {
    // Test connection
    console.log('\nConnecting to Neon PostgreSQL...');
    await pool.query('SELECT 1');
    console.log('Connected successfully!');
    
    // Setup table
    await setupTable();
    
    // Check existing data
    const esvCount = await getExistingCount('esv');
    const nltCount = await getExistingCount('nlt');
    
    console.log(`\nExisting data:`);
    console.log(`  ESV: ${esvCount} verses`);
    console.log(`  NLT: ${nltCount} verses`);
    
    // Expected: ~31,102 verses per translation
    const EXPECTED_VERSES = 31000;
    
    if (esvCount < EXPECTED_VERSES) {
      await downloadAndStoreTranslation('esv');
    } else {
      console.log('\nESV already downloaded, skipping...');
    }
    
    if (nltCount < EXPECTED_VERSES) {
      await downloadAndStoreTranslation('nlt');
    } else {
      console.log('\nNLT already downloaded, skipping...');
    }
    
    // Final count
    const finalEsv = await getExistingCount('esv');
    const finalNlt = await getExistingCount('nlt');
    
    console.log('\n' + '='.repeat(60));
    console.log('COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Final counts:`);
    console.log(`  ESV: ${finalEsv} verses`);
    console.log(`  NLT: ${finalNlt} verses`);
    console.log(`  Total: ${finalEsv + finalNlt} verses`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
