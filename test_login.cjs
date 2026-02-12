const { Pool } = require('pg')

async function testLogin() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    const client = await pool.connect()
    
    // Test the exact login logic from the server
    const email = 'marty@dailydavid.com'
    const password = 'Marty15!'
    
    // Get user by email
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    
    if (result.rows.length === 0) {
      console.log('❌ User not found')
      return
    }
    
    const user = result.rows[0]
    console.log('👤 User found:', user.email)
    console.log('Password hash:', user.password_hash)
    console.log('Password hash starts with $2b$:', user.password_hash.startsWith('$2b$'))
    
    // Test password verification logic
    let isValidPassword = false
    
    if (user.password_hash.startsWith('$2b$')) {
      console.log('🔐 Using bcrypt comparison')
      // This would require bcrypt module
      isValidPassword = false // Placeholder
    } else {
      console.log('🔓 Using direct comparison')
      isValidPassword = (password === user.password_hash)
    }
    
    console.log('Password valid:', isValidPassword)
    
    if (isValidPassword) {
      // Test if we can insert into user_sessions
      try {
        const sessionResult = await client.query(
          'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3) RETURNING *',
          [user.id, 'test-token', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        )
        console.log('✅ Session creation successful:', sessionResult.rows[0])
        
        // Clean up test session
        await client.query('DELETE FROM user_sessions WHERE session_token = $1', ['test-token'])
        console.log('🧹 Test session cleaned up')
      } catch (sessionError) {
        console.log('❌ Session creation failed:', sessionError.message)
      }
    }
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

testLogin()
