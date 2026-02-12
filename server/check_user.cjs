const { Pool } = require('pg')

async function checkUser() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    const client = await pool.connect()
    
    // Get user ID first
    const userResult = await client.query(
      'SELECT id, email, display_name FROM users WHERE email = $1',
      ['marty@thedailyforge.com']
    )
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0]
      console.log('👤 User found:')
      console.log('Email:', user.email)
      console.log('Display Name:', user.display_name)
      console.log('User ID:', user.id)
      
      // Check SOAP data for this user
      const soapResult = await client.query(
        'SELECT date_key, scripture, observation, application, prayer, data_content FROM daily_forge_entries WHERE user_id = $1 ORDER BY date_key DESC LIMIT 3',
        [user.id]
      )
      
      console.log('\\n📖 Recent SOAP entries:')
      soapResult.rows.forEach((entry, index) => {
        console.log((index + 1) + '. Date: ' + entry.date_key)
        console.log('   Scripture: ' + (entry.scripture || 'None'))
        console.log('   Observation: ' + (entry.observation || 'None'))
        console.log('   Application: ' + (entry.application || 'None'))
        console.log('   Prayer: ' + (entry.prayer || 'None'))
        if (entry.data_content && entry.data_content.soap) {
          console.log('   Data Content SOAP: ' + JSON.stringify(entry.data_content.soap))
        }
        console.log('---')
      })
    } else {
      console.log('❌ User not found')
    }
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkUser()
