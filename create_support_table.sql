-- Create support_requests table for Daily David app
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
