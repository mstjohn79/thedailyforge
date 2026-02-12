const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function debugReadingPlans() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking reading plan data structure...')
    
    // Check daily_forge_entries with reading plan data
    const entriesResult = await client.query(`
      SELECT user_id, date_key, data_content->'readingPlan' as reading_plan_data
      FROM daily_forge_entries 
      WHERE data_content->'readingPlan'->>'planId' IS NOT NULL
      ORDER BY updated_at DESC 
      LIMIT 3
    `)
    
    console.log('📊 Daily David Entries with reading plan data:')
    entriesResult.rows.forEach((row, index) => {
      console.log(`\n--- Entry ${index + 1} ---`)
      console.log('User ID:', row.user_id)
      console.log('Date Key:', row.date_key)
      console.log('Reading Plan Data:', JSON.stringify(row.reading_plan_data, null, 2))
    })
    
    // Check reading_plans table
    const readingPlansResult = await client.query(`
      SELECT user_id, date_key, plan_id, plan_name, current_day, total_days, start_date, completed_days
      FROM reading_plans 
      ORDER BY updated_at DESC 
      LIMIT 3
    `)
    
    console.log('\n📊 Reading Plans Table:')
    readingPlansResult.rows.forEach((row, index) => {
      console.log(`\n--- Reading Plan ${index + 1} ---`)
      console.log('User ID:', row.user_id)
      console.log('Date Key:', row.date_key)
      console.log('Plan ID:', row.plan_id)
      console.log('Plan Name:', row.plan_name)
      console.log('Current Day:', row.current_day)
      console.log('Total Days:', row.total_days)
      console.log('Start Date:', row.start_date)
      console.log('Completed Days:', row.completed_days)
      console.log('Completed Days Type:', typeof row.completed_days)
      console.log('Completed Days Is Array:', Array.isArray(row.completed_days))
    })
    
  } finally {
    client.release()
    await pool.end()
  }
}

debugReadingPlans().catch(console.error)

