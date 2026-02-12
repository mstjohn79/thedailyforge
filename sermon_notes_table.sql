-- Create sermon_notes table for The Daily David app
-- Run this SQL in your production database

CREATE TABLE IF NOT EXISTS sermon_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  church_name VARCHAR(255) NOT NULL,
  sermon_title VARCHAR(500) NOT NULL,
  speaker_name VARCHAR(255) NOT NULL,
  bible_passage TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sermon_notes_user_date 
ON sermon_notes(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_sermon_notes_search 
ON sermon_notes(user_id, church_name, speaker_name, sermon_title);

-- Verify table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'sermon_notes';
