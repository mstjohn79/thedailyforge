// Check existing users in the database
const { Pool } = require('pg')

async function checkUsers() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔍 Checking existing users...')
    const client = await pool.connect()
    
    // Get all users
    const result = await client.query(`
      SELECT id, email, display_name, is_admin, created_at 
      FROM users 
      ORDER BY created_at DESC
    `)
    
    console.log('👥 Found users:')
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name} (${user.email}) - Admin: ${user.is_admin}`)
    })
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message)
  } finally {
    await pool.end()
  }
}

checkUsers()
