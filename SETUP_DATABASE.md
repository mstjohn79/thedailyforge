# Database Setup for Daily Forge Modern App

## Quick Setup

To get your app connected to the Neon database and showing real data:

### 1. Create Environment File

Create a `.env` file in the `server/` directory with these contents:

```bash
# Server Configuration
PORT=3003
NODE_ENV=development

# Database Configuration
NEON_CONNECTION_STRING=postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:5173
```

### 2. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

The server will start on port 3003 and connect to your Neon database.

### 3. Start the Frontend

In a new terminal:

```bash
cd ..
npm run dev
```

### 4. Test the Connection

Visit `http://localhost:3003/api/health` to verify the database connection is working.

## What's Been Updated

The app has been modified to:

1. **Fetch real data** from your Neon database instead of using mock data
2. **Display actual statistics** on the dashboard (total entries, current streak, monthly count)
3. **Show real entries** in the recent activity section
4. **Load existing entries** when navigating to different dates
5. **Save new entries** directly to the database

## Database Schema

Your Neon database should have these tables:

- `users` - User accounts and authentication
- `daily_forge_entries_dev` - Daily entries (development environment)
- `user_sessions` - User session management

## Troubleshooting

### Database Connection Issues
- Verify your Neon connection string is correct
- Check that your Neon database is accessible
- Ensure SSL is properly configured

### No Data Showing
- Check that you have entries in your `daily_forge_entries_dev` table
- Verify the user authentication is working
- Check the browser console for any errors

### Authentication Issues
- Make sure you're logged in with a valid user account
- Check that the JWT_SECRET is set in your environment
- Verify the users table exists and has the correct schema

## Next Steps

1. **Deploy to Vercel** - The app is already configured for Vercel deployment
2. **Set production environment variables** in Vercel dashboard
3. **Update CORS_ORIGIN** to your production domain
4. **Use production database table** by setting NODE_ENV=production

Your app should now be showing real data from your Neon database! 🎉
