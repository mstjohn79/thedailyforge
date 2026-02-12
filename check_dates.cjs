const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
})

async function checkDates() {
  try {
    console.log('🔍 Checking dates in database...')
    
    const result = await pool.query(`
      SELECT 
        id,
        date,
        data_content->'soap'->>'scripture' as scripture,
        data_content->'soap'->>'thoughts' as thoughts,
        created_at,
        updated_at
      FROM daily_forge_entries 
      WHERE user_id = 1 
      AND data_content->'soap'->>'scripture' IS NOT NULL
      ORDER BY date DESC 
      LIMIT 5
    `)
    
    console.log(`Found ${result.rows.length} SOAP entries:`)
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Entry ID: ${row.id}`)
      console.log(`   Date: ${row.date}`)
      console.log(`   Scripture: ${row.scripture}`)
      console.log(`   Thoughts: ${row.thoughts || '(empty)'}`)
      console.log(`   Created: ${row.created_at}`)
      console.log(`   Updated: ${row.updated_at}`)
    })
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkDates()



