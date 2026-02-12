# Neon Database Setup - Support Requests Table

## Quick Setup Instructions

### Option 1: Copy-Paste SQL (Easiest)

1. Go to your Neon database console: https://console.neon.tech
2. Select your Daily Forge database
3. Go to **SQL Editor**
4. Copy and paste this entire SQL script:

```sql
-- Create support_requests table for Daily Forge app
-- This table stores user support requests

CREATE TABLE IF NOT EXISTS support_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id 
ON support_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_status 
ON support_requests(status);

CREATE INDEX IF NOT EXISTS idx_support_requests_created_at 
ON support_requests(created_at DESC);

-- Add a comment to the table
COMMENT ON TABLE support_requests IS 'Stores user support requests and their status';
COMMENT ON COLUMN support_requests.category IS 'Type of request: bug, feature, general, billing';
COMMENT ON COLUMN support_requests.status IS 'Request status: open, in_progress, closed';
```

5. Click **Run** to execute the SQL
6. You should see "Query executed successfully" message

### Option 2: Upload SQL File

1. Download the `create_support_table.sql` file from this repository
2. In Neon console, go to **SQL Editor**
3. Click **Upload** and select the SQL file
4. Click **Run**

## Verify the Table Was Created

After running the SQL, verify it worked by running this query:

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'support_requests' 
ORDER BY ordinal_position;
```

You should see all the columns listed:
- id (integer)
- user_id (integer)
- subject (character varying)
- message (text)
- category (character varying)
- status (character varying)
- created_at (timestamp)
- updated_at (timestamp)

## Test the Table

You can test that the table works by running:

```sql
SELECT COUNT(*) FROM support_requests;
```

This should return `0` (no records yet, which is expected).

## What This Table Does

The `support_requests` table will store:
- **id**: Unique identifier for each support request
- **user_id**: Links to the user who submitted the request
- **subject**: The subject line of the support request
- **message**: The detailed message from the user
- **category**: Type of request (bug, feature, general, billing)
- **status**: Current status (open, in_progress, closed)
- **created_at**: When the request was submitted
- **updated_at**: When the request was last modified

## Next Steps

After creating this table:
1. Add the environment variables to Vercel
2. Redeploy your Vercel app
3. Test the support form

The support form will now be able to store requests in this table and send email notifications!
