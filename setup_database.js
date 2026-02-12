#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Daily David Modern App Database Connection...\n');

// Check if we're in the right directory
const serverDir = path.join(__dirname, 'server');
if (!fs.existsSync(serverDir)) {
  console.error('❌ Server directory not found. Please run this script from the daily-forge directory.');
  process.exit(1);
}

// Create .env file
const envContent = `# Server Configuration
PORT=3003
NODE_ENV=development

# Database Configuration
NEON_CONNECTION_STRING=postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:5173
`;

const envPath = path.join(serverDir, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file in server directory');
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
  process.exit(1);
}

console.log('\n📋 Next steps:');
console.log('1. Start the backend server:');
console.log('   cd server');
console.log('   npm install');
console.log('   npm run dev');
console.log('\n2. In a new terminal, start the frontend:');
console.log('   npm run dev');
console.log('\n3. Test the database connection:');
console.log('   Visit http://localhost:3003/api/health');
console.log('\n4. Login to the app and see your real data!');
console.log('\n🎉 Setup complete! Your app should now connect to your Neon database.');
