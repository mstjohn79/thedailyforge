#!/usr/bin/env node

// Database optimization script for Neon free tier
// Adds indexes and optimizes for multi-device usage

const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  },
  // Optimize for free tier (1 connection)
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000
})

async function optimizeDatabase() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Optimizing database for free tier and multi-device usage...')
    
    // 1. Add essential indexes for performance
    console.log('📊 Adding performance indexes...')
    
    const indexes = [
      // Daily entries indexes
      {
        name: 'idx_daily_entries_user_date',
        query: `CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date 
                ON daily_forge_entries(user_id, date_key)`
      },
      {
        name: 'idx_daily_entries_user_created',
        query: `CREATE INDEX IF NOT EXISTS idx_daily_entries_user_created 
                ON daily_forge_entries(user_id, created_at DESC)`
      },
      
      // Reading plans indexes
      {
        name: 'idx_reading_plans_user_plan',
        query: `CREATE INDEX IF NOT EXISTS idx_reading_plans_user_plan 
                ON reading_plans(user_id, plan_id)`
      },
      {
        name: 'idx_reading_plans_user_updated',
        query: `CREATE INDEX IF NOT EXISTS idx_reading_plans_user_updated 
                ON reading_plans(user_id, updated_at DESC)`
      },
      
      // Prayer requests indexes
      {
        name: 'idx_prayer_requests_user_status',
        query: `CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_status 
                ON prayer_requests(user_id, status)`
      },
      {
        name: 'idx_prayer_requests_user_created',
        query: `CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_created 
                ON prayer_requests(user_id, created_at DESC)`
      },
      
      // Users indexes
      {
        name: 'idx_users_email',
        query: `CREATE INDEX IF NOT EXISTS idx_users_email 
                ON users(email)`
      }
    ]
    
    for (const index of indexes) {
      try {
        await client.query(index.query)
        console.log(`✅ Created index: ${index.name}`)
      } catch (error) {
        console.log(`⚠️  Index ${index.name} may already exist: ${error.message}`)
      }
    }
    
    // 2. Analyze table sizes and usage
    console.log('\n📈 Analyzing database usage...')
    
    const tableSizes = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `)
    
    console.log('📊 Table sizes:')
    tableSizes.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.size}`)
    })
    
    // 3. Check for unused data that could be cleaned up
    console.log('\n🧹 Checking for cleanup opportunities...')
    
    // Check for old entries (older than 1 year)
    const oldEntries = await client.query(`
      SELECT COUNT(*) as count 
      FROM daily_forge_entries 
      WHERE created_at < NOW() - INTERVAL '1 year'
    `)
    
    if (oldEntries.rows[0].count > 0) {
      console.log(`📅 Found ${oldEntries.rows[0].count} entries older than 1 year`)
      console.log('💡 Consider archiving old data to stay under 3GB limit')
    }
    
    // 4. Optimize connection settings
    console.log('\n⚙️  Database connection optimized for free tier:')
    console.log('  - Max connections: 1 (free tier limit)')
    console.log('  - Idle timeout: 10 seconds')
    console.log('  - Connection timeout: 5 seconds')
    
    // 5. Check current database size
    const dbSize = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `)
    
    console.log(`\n💾 Current database size: ${dbSize.rows[0].size}`)
    
    if (dbSize.rows[0].size.includes('GB')) {
      const sizeGB = parseFloat(dbSize.rows[0].size)
      if (sizeGB > 2.5) {
        console.log('⚠️  WARNING: Database approaching 3GB free tier limit!')
        console.log('💡 Consider archiving old data or upgrading to paid tier')
      }
    }
    
    console.log('\n✅ Database optimization complete!')
    
  } catch (error) {
    console.error('❌ Error optimizing database:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run optimization
optimizeDatabase()
