#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function cleanupReadingPlansTable() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Cleaning up reading_plans table...')
    
    // First, let's see what duplicates we have
    console.log('📊 Checking for duplicates...')
    const duplicates = await client.query(`
      SELECT user_id, plan_id, COUNT(*) as count
      FROM reading_plans 
      GROUP BY user_id, plan_id 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `)
    
    console.log('Found duplicates:', duplicates.rows)
    
    if (duplicates.rows.length > 0) {
      // Keep only the most recent entry for each user/plan combination
      console.log('🧹 Removing duplicates, keeping most recent...')
      
      await client.query(`
        DELETE FROM reading_plans 
        WHERE id NOT IN (
          SELECT DISTINCT ON (user_id, plan_id) id
          FROM reading_plans 
          ORDER BY user_id, plan_id, updated_at DESC
        )
      `)
      
      console.log('✅ Duplicates removed')
    }
    
    // Now try the migration again
    console.log('📝 Dropping existing unique constraint...')
    await client.query(`
      ALTER TABLE reading_plans 
      DROP CONSTRAINT IF EXISTS reading_plans_user_id_date_key_plan_id_key
    `)
    
    // Add new unique constraint without date_key
    console.log('📝 Adding new unique constraint (user_id, plan_id)...')
    await client.query(`
      ALTER TABLE reading_plans 
      ADD CONSTRAINT reading_plans_user_plan_unique 
      UNIQUE (user_id, plan_id)
    `)
    
    // Update the index to focus on user_id and plan_id
    console.log('📝 Updating index...')
    await client.query(`
      DROP INDEX IF EXISTS idx_reading_plans_user_date
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reading_plans_user_plan 
      ON reading_plans(user_id, plan_id)
    `)
    
    console.log('✅ Migration completed successfully!')
    
    // Show the updated table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'reading_plans'
      ORDER BY ordinal_position
    `)
    
    console.log('\n📋 Updated table structure:')
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`)
    })
    
    // Show constraints
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'reading_plans'
    `)
    
    console.log('\n🔗 Table constraints:')
    constraints.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.constraint_type}`)
    })
    
  } catch (error) {
    console.error('❌ Error cleaning up reading_plans table:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

cleanupReadingPlansTable()

