// FAST Bible Verses Setup - Batch inserts for speed
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_MXzOtdlBT65r@ep-calm-band-airu6rtp-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const RKEPLIN_API_BASE = 'https://bible-go-api.rkeplin.com/v1';

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

async function fetchChapter(bookId, chapter, translation) {
  const url = `${RKEPLIN_API_BASE}/books/${bookId}/chapters/${chapter}?translation=${translation}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error(`  Error fetching ${bookId}/${chapter}:`, error.message);
    return [];
  }
}

async function downloadTranslation(translation) {
  console.log(`\n📖 Downloading ${translation.toUpperCase()}...`);
  
  let totalVerses = 0;
  const startTime = Date.now();
  
  for (const book of BOOKS) {
    process.stdout.write(`  ${book.name}...`);
    let bookVerses = 0;
    
    // Collect all verses for this book first
    const allVerses = [];
    
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const verses = await fetchChapter(book.id, chapter, translation);
      for (const v of verses) {
        allVerses.push([translation, book.abbrev, book.name, chapter, v.verseId, v.verse]);
      }
      // Tiny delay between chapters
      await new Promise(r => setTimeout(r, 20));
    }
    
    // Batch insert all verses for this book at once
    if (allVerses.length > 0) {
      const client = await pool.connect();
      try {
        // Use a single transaction for the whole book
        await client.query('BEGIN');
        
        // Insert in batches of 100
        for (let i = 0; i < allVerses.length; i += 100) {
          const batch = allVerses.slice(i, i + 100);
          const values = batch.map((_, idx) => {
            const offset = idx * 6;
            return `($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6})`;
          }).join(',');
          
          const params = batch.flat();
          
          await client.query(`
            INSERT INTO bible_verses (translation, book_id, book_name, chapter, verse, text)
            VALUES ${values}
            ON CONFLICT (translation, book_id, chapter, verse) DO UPDATE SET text = EXCLUDED.text
          `, params);
        }
        
        await client.query('COMMIT');
        bookVerses = allVerses.length;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(` ERROR: ${err.message}`);
      } finally {
        client.release();
      }
    }
    
    totalVerses += bookVerses;
    console.log(` ${bookVerses} verses`);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ ${translation.toUpperCase()} complete: ${totalVerses} verses in ${elapsed}s`);
  return totalVerses;
}

async function main() {
  console.log('='.repeat(50));
  console.log('⚡ FAST Bible Download (Batch Inserts)');
  console.log('='.repeat(50));
  
  try {
    // Check existing data
    const existing = await pool.query('SELECT translation, COUNT(*) as count FROM bible_verses GROUP BY translation');
    console.log('\nExisting data:');
    for (const row of existing.rows) {
      console.log(`  ${row.translation.toUpperCase()}: ${row.count} verses`);
    }
    if (existing.rows.length === 0) {
      console.log('  (none)');
    }
    
    // Download both translations
    await downloadTranslation('esv');
    await downloadTranslation('nlt');
    
    // Final count
    const final = await pool.query('SELECT translation, COUNT(*) as count FROM bible_verses GROUP BY translation');
    console.log('\n' + '='.repeat(50));
    console.log('✅ COMPLETE!');
    console.log('='.repeat(50));
    for (const row of final.rows) {
      console.log(`  ${row.translation.toUpperCase()}: ${row.count} verses`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
