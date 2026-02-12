const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

async function checkThoughts() {
  try {
    console.log('🔍 Checking for entries with thoughts in database...');
    
    // Check for entries with thoughts in the soap data
    const result = await pool.query(`
      SELECT 
        id, 
        date_key, 
        data_content->'soap'->>'thoughts' as thoughts,
        data_content->'soap' as soap_data
      FROM daily_forge_entries 
      WHERE data_content->'soap'->>'thoughts' IS NOT NULL 
      AND data_content->'soap'->>'thoughts' != ''
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${result.rows.length} entries with thoughts:`);
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Entry ID: ${row.id}`);
      console.log(`   Date: ${row.date_key}`);
      console.log(`   Thoughts: "${row.thoughts}"`);
      console.log(`   Full SOAP data:`, JSON.stringify(row.soap_data, null, 2));
    });
    
    if (result.rows.length === 0) {
      console.log('\n❌ No entries found with thoughts data');
      
      // Let's check what the soap data looks like
      const soapResult = await pool.query(`
        SELECT 
          id, 
          date_key, 
          data_content->'soap' as soap_data
        FROM daily_forge_entries 
        WHERE data_content->'soap' IS NOT NULL
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      console.log('\n📋 Sample SOAP data structure:');
      soapResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Entry ID: ${row.id}, Date: ${row.date_key}`);
        console.log('   SOAP structure:', JSON.stringify(row.soap_data, null, 2));
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error checking thoughts:', error);
    await pool.end();
  }
}

checkThoughts();
