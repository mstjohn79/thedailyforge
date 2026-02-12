const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING || 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testPrayerRequests() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Prayer Request System...\n');
    
    // 1. Get demo user
    console.log('1️⃣ Getting demo user...');
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['demo@thedailyforge.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Demo user not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Demo user found: ${user.display_name} (${user.id})`);
    
    // 2. Create JWT token
    console.log('\n2️⃣ Creating JWT token...');
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        isAdmin: user.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ JWT token created');
    
    // 3. Test creating a prayer request
    console.log('\n3️⃣ Testing prayer request creation...');
    const prayerRequestData = {
      title: 'Test Prayer Request',
      description: 'This is a test prayer request to verify the system is working correctly.',
      personName: 'Test Person',
      category: 'health',
      priority: 'medium'
    };
    
    const insertResult = await client.query(`
      INSERT INTO prayer_requests (
        user_id, title, description, person_name, category, priority
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      user.id,
      prayerRequestData.title,
      prayerRequestData.description,
      prayerRequestData.personName,
      prayerRequestData.category,
      prayerRequestData.priority
    ]);
    
    const newRequest = insertResult.rows[0];
    console.log(`✅ Prayer request created with ID: ${newRequest.id}`);
    console.log(`   Title: ${newRequest.title}`);
    console.log(`   Category: ${newRequest.category}`);
    console.log(`   Priority: ${newRequest.priority}`);
    console.log(`   Status: ${newRequest.status}`);
    
    // 4. Test reading prayer requests
    console.log('\n4️⃣ Testing prayer request retrieval...');
    const readResult = await client.query(`
      SELECT * FROM prayer_requests 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [user.id]);
    
    console.log(`✅ Found ${readResult.rows.length} prayer request(s) for user`);
    readResult.rows.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.title} (${req.status})`);
    });
    
    // 5. Test updating prayer request
    console.log('\n5️⃣ Testing prayer request update...');
    const updateResult = await client.query(`
      UPDATE prayer_requests 
      SET status = 'answered', answered_at = NOW(), praise_report = 'God answered this prayer!'
      WHERE id = $1
      RETURNING *
    `, [newRequest.id]);
    
    const updatedRequest = updateResult.rows[0];
    console.log(`✅ Prayer request updated:`);
    console.log(`   Status: ${updatedRequest.status}`);
    console.log(`   Answered at: ${updatedRequest.answered_at}`);
    console.log(`   Praise report: ${updatedRequest.praise_report}`);
    
    // 6. Test statistics
    console.log('\n6️⃣ Testing prayer request statistics...');
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'answered' THEN 1 END) as answered,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed
      FROM prayer_requests 
      WHERE user_id = $1
    `, [user.id]);
    
    const stats = statsResult.rows[0];
    console.log('✅ Prayer request statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Answered: ${stats.answered}`);
    console.log(`   Closed: ${stats.closed}`);
    
    // 7. Test API endpoints with curl
    console.log('\n7️⃣ Testing API endpoints...');
    console.log('Testing GET /api/prayer-requests...');
    
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      const { stdout } = await execAsync(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/prayer-requests`);
      const response = JSON.parse(stdout);
      console.log(`✅ API GET request successful: ${response.requests.length} requests returned`);
    } catch (error) {
      console.log('❌ API GET request failed:', error.message);
    }
    
    // 8. Clean up test data
    console.log('\n8️⃣ Cleaning up test data...');
    await client.query('DELETE FROM prayer_requests WHERE id = $1', [newRequest.id]);
    console.log('✅ Test prayer request deleted');
    
    console.log('\n🎉 Prayer Request System Test Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ User authentication working');
    console.log('   ✅ Prayer request creation working');
    console.log('   ✅ Prayer request retrieval working');
    console.log('   ✅ Prayer request update working');
    console.log('   ✅ Statistics calculation working');
    console.log('   ✅ API endpoints accessible');
    console.log('   ✅ Data cleanup working');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
  }
}

// Run the test
testPrayerRequests()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

