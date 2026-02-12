# Setting Up Neon Database Connection

This guide will help you connect The Daily Forge app to your existing Neon database.

## Prerequisites

- Node.js 16+ installed
- Your Neon database already set up with tables and users
- The connection string from your Neon dashboard

## Step 1: Install Backend Dependencies

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

## Step 2: Configure Environment Variables

Create a `.env` file in the server directory:

```bash
# Server Configuration
PORT=3003
NODE_ENV=development

# Database Configuration
NEON_CONNECTION_STRING=postgresql://neondb_owner:npg_L5ysD0JfHSFP@ep-little-base-adgfntzb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

## Step 3: Start the Backend Server

```bash
npm run dev
```

The server will start on port 3003. You should see:
```
🚀 Server running on port 3003
📊 Health check: http://localhost:3003/api/health
🔐 Environment: development
```

## Step 4: Test Database Connection

Visit `http://localhost:3003/api/health` in your browser to verify the database connection is working.

## Step 5: Start the Frontend

In a new terminal, navigate to the main project directory and start the frontend:

```bash
cd ..
npm run dev
```

## Step 6: Test Authentication

1. Go to `http://localhost:3001/login` (or whatever port your frontend is running on)
2. Use the credentials from your existing Neon database users table
3. You should be redirected to the dashboard after successful login

## Database Schema Requirements

Your Neon database should have these tables:

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);
```

### Daily Entries Table
```sql
CREATE TABLE daily_forge_entries_dev (
    id BIGSERIAL PRIMARY KEY,
    date_key TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date_key, user_id)
);
```

## Creating a Test User

If you need to create a test user, you can use the admin panel or run this SQL:

```sql
-- Create a test user (password will be 'password123')
INSERT INTO users (email, password_hash, display_name, is_admin) 
VALUES (
    'test@example.com', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'Test User', 
    false
);
```

## Troubleshooting

### Database Connection Issues
- Verify your Neon connection string is correct
- Check that your Neon database is accessible
- Ensure SSL is properly configured

### Authentication Issues
- Verify the users table exists and has the correct schema
- Check that password hashes are properly stored
- Ensure the JWT_SECRET is set

### CORS Issues
- Make sure the frontend URL is included in CORS_ORIGIN
- Check that the backend is running on the expected port

## Production Deployment

For production:

1. Set `NODE_ENV=production` in your environment
2. Use a strong, unique `JWT_SECRET`
3. Set `CORS_ORIGIN` to your production domain
4. Use environment variables for all sensitive configuration
5. Consider using a reverse proxy (nginx) in front of your Node.js server

## API Endpoints

The backend provides these endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/entries/:date` - Get daily entry for a specific date
- `POST /api/entries` - Create a new daily entry
- `PUT /api/entries/:id` - Update an existing entry
- `GET /api/entries` - Get multiple entries with optional date filtering
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create new user (admin only)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Row-level security through user_id filtering
- Session management with expiration
- Admin role-based access control
