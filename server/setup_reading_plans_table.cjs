#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function setupReadingPlansTable() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Setting up reading_plans table...')
    
    // Create the reading_plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reading_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        date_key VARCHAR(10) NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        current_day INTEGER NOT NULL DEFAULT 1,
        total_days INTEGER NOT NULL,
        start_date VARCHAR(10) NOT NULL,
        completed_days INTEGER[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date_key, plan_id)
      )
    `)
    
    console.log('✅ reading_plans table created successfully!')
    
    // Create an index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reading_plans_user_date 
      ON reading_plans(user_id, date_key)
    `)
    
    console.log('✅ Index created successfully!')
    
    // Check if table exists and show structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'reading_plans'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Table structure:')
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`)
    })
    
  } catch (error) {
    console.error('❌ Error setting up reading_plans table:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

setupReadingPlansTable()
