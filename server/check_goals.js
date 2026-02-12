const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function checkGoals() {
  try {
    const result = await pool.query('SELECT data_content FROM daily_forge_entries WHERE user_id = $1 ORDER BY date_key DESC LIMIT 1;', ['5d893914-0343-4373-ab16-ae835f9baf33']);
    
    if (result.rows.length > 0) {
      const data = result.rows[0].data_content;
      console.log('=== MONTHLY GOALS ===');
      data.goals.monthly.forEach((goal, i) => {
        console.log(`${i + 1}. ${goal.text} (ID: ${goal.id}, completed: ${goal.completed})`);
      });
      
      console.log('\n=== DELETED GOAL IDS ===');
      console.log(data.deletedGoalIds);
      
      console.log('\n=== ACTIVE MONTHLY GOALS (not deleted) ===');
      const deletedIds = data.deletedGoalIds;
      const active = data.goals.monthly.filter(goal => {
        return !deletedIds.includes(goal.id) && !deletedIds.includes(goal.id.toString());
      });
      active.forEach((goal, i) => {
        console.log(`${i + 1}. ${goal.text} (completed: ${goal.completed})`);
      });
      
      const completed = active.filter(g => g.completed).length;
      console.log(`\n=== DASHBOARD SHOULD SHOW ===`);
      console.log(`${completed}/${active.length}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkGoals();
