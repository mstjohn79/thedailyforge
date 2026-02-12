const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

// Use the same connection string as the server
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function testDemoUser() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking if demo user exists...')
    
    // Check if user exists
    const result = await client.query(
      'SELECT id, email, password_hash, display_name, is_admin, created_at FROM users WHERE email = $1',
      ['demo@dailydavid.com']
    )
    
    if (result.rows.length === 0) {
      console.log('❌ User demo@dailydavid.com not found in database')
      return
    }
    
    const user = result.rows[0]
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      is_admin: user.is_admin,
      created_at: user.created_at,
      password_hash: user.password_hash.substring(0, 20) + '...'
    })
    
    // Test password
    console.log('🔐 Testing password...')
    const testPassword = 'Marty15!'
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash)
    
    if (isValidPassword) {
      console.log('✅ Password is correct!')
    } else {
      console.log('❌ Password is incorrect!')
      
      // Let's also test if it's stored as plain text
      const isPlainText = (testPassword === user.password_hash)
      if (isPlainText) {
        console.log('ℹ️  Password is stored as plain text')
      } else {
        console.log('ℹ️  Password hash does not match')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

testDemoUser()
