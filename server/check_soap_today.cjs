const { Pool } = require('pg')

async function checkSOAPToday() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    const client = await pool.connect()
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    console.log('🔍 Checking SOAP data for marty@dailydavid.com on:', today)
    
    // Get user ID first
    const userResult = await client.query(
      'SELECT id, email, display_name FROM users WHERE email = $1',
      ['marty@dailydavid.com']
    )
    
    if (userResult.rows.length === 0) {
      console.log('❌ User marty@dailydavid.com not found')
      return
    }
    
    const user = userResult.rows[0]
    console.log('👤 User found:', user.email, '(ID:', user.id + ')')
    
    // Get today's entry with ALL columns to see the actual table structure
    const entryResult = await client.query(
      'SELECT * FROM daily_forge_entries WHERE user_id = $1 AND date_key = $2',
      [user.id, today]
    )
    
    if (entryResult.rows.length === 0) {
      console.log('❌ No entry found for today:', today)
      
      // Check if there are any recent entries
      const recentResult = await client.query(
        'SELECT date_key, created_at FROM daily_forge_entries WHERE user_id = $1 ORDER BY date_key DESC LIMIT 5',
        [user.id]
      )
      
      console.log('📅 Recent entries for this user:')
      recentResult.rows.forEach(entry => {
        console.log('  -', entry.date_key, '(created:', entry.created_at + ')')
      })
      return
    }
    
    const entry = entryResult.rows[0]
    console.log('✅ Entry found for today!')
    console.log('\\n🔍 RAW TABLE DATA:')
    console.log('📝 Entry ID:', entry.id)
    console.log('📅 Date Key:', entry.date_key)
    console.log('👤 User ID:', entry.user_id)
    console.log('⏰ Created:', entry.created_at)
    console.log('🔄 Updated:', entry.updated_at)
    
    // Show ALL columns in the table
    console.log('\\n📋 ALL TABLE COLUMNS:')
    Object.keys(entry).forEach(key => {
      if (key === 'data_content') {
        console.log('  ' + key + ':', typeof entry[key], '(JSONB)')
      } else {
        console.log('  ' + key + ':', entry[key])
      }
    })
    
    // Parse the data_content
    const dataContent = entry.data_content || {}
    console.log('\\n📊 Data Content Keys:', Object.keys(dataContent))
    console.log('\\n📊 Full Data Content:', JSON.stringify(dataContent, null, 2))
    
    // Check SOAP data
    if (dataContent.soap) {
      console.log('\\n📖 SOAP Data:')
      console.log('  Scripture:', dataContent.soap.scripture || 'None')
      console.log('  Observation:', dataContent.soap.observation || 'None')
      console.log('  Application:', dataContent.soap.application || 'None')
      console.log('  Prayer:', dataContent.soap.prayer || 'None')
    } else {
      console.log('\\n❌ No SOAP data found in data_content')
    }
    
    // Check other data
    if (dataContent.gratitude) {
      console.log('\\n🙏 Gratitude:', dataContent.gratitude)
    }
    
    if (dataContent.dailyIntention) {
      console.log('\\n🎯 Daily Intention:', dataContent.dailyIntention)
    }
    
    if (dataContent.checkIn) {
      console.log('\\n💭 Check-in:', dataContent.checkIn)
    }
    
    if (dataContent.readingPlan) {
      console.log('\\n📚 Reading Plan:', dataContent.readingPlan)
    }
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkSOAPToday()
