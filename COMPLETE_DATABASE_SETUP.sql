-- ============================================================================
-- THE DAILY FORGE - COMPLETE DATABASE SETUP FOR NEON
-- Run this SQL in your Neon SQL editor to set up all tables
-- ============================================================================

-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin);

-- 2. DAILY FORGE ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_forge_entries (
    id SERIAL PRIMARY KEY,
    date_key VARCHAR(10) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date_key, user_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_forge_entries_user_date ON daily_forge_entries(user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_daily_forge_entries_date ON daily_forge_entries(date_key);

-- 3. READING PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reading_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_key VARCHAR(10) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    current_day INTEGER NOT NULL DEFAULT 1,
    total_days INTEGER NOT NULL,
    start_date VARCHAR(10) NOT NULL,
    completed_days INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_plans_user_date ON reading_plans(user_id, date_key);

-- 4. PRAYER REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS prayer_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    person_name VARCHAR(255),
    category VARCHAR(100) DEFAULT 'other',
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    answered_at TIMESTAMP NULL,
    praise_report TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_status ON prayer_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_category ON prayer_requests(user_id, category);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON prayer_requests(created_at DESC);

-- 5. SERMON NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sermon_notes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    church_name VARCHAR(255) NOT NULL,
    sermon_title VARCHAR(500) NOT NULL,
    speaker_name VARCHAR(255) NOT NULL,
    bible_passage TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sermon_notes_user_date ON sermon_notes(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sermon_notes_search ON sermon_notes(user_id, church_name, speaker_name, sermon_title);

-- 6. USER SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    sms_notifications_enabled BOOLEAN DEFAULT FALSE,
    notification_time TIME DEFAULT '07:00:00',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    last_notification_sent TIMESTAMP NULL,
    notification_frequency VARCHAR(20) DEFAULT 'daily',
    soap_scripture_mode VARCHAR(10) DEFAULT 'plan',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_sms_enabled ON user_settings(sms_notifications_enabled);
CREATE INDEX IF NOT EXISTS idx_user_settings_phone_number ON user_settings(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding_completed ON user_settings(onboarding_completed);

-- 7. NOTIFICATION LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'daily_inspiration',
    status VARCHAR(20) DEFAULT 'sent',
    twilio_sid VARCHAR(100),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- 8. SUPPORT REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS support_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON support_requests(created_at DESC);

-- 9. BIBLE BOOKS TABLE (for Bible API caching)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bible_books (
    id SERIAL PRIMARY KEY,
    book_id VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    testament VARCHAR(10) NOT NULL CHECK (testament IN ('old', 'new')),
    chapters INTEGER NOT NULL,
    total_verses INTEGER,
    bible_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_book_bible UNIQUE(book_id, bible_id)
);

CREATE INDEX IF NOT EXISTS idx_bible_books_book_id ON bible_books(book_id);
CREATE INDEX IF NOT EXISTS idx_bible_books_testament ON bible_books(testament);
CREATE INDEX IF NOT EXISTS idx_bible_books_bible_id ON bible_books(bible_id);

-- 10. BIBLE CHAPTERS TABLE (for Bible API caching)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bible_chapters (
    id SERIAL PRIMARY KEY,
    book_id VARCHAR(10) NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_count INTEGER NOT NULL,
    bible_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_book_chapter_bible UNIQUE(book_id, chapter_number, bible_id)
);

CREATE INDEX IF NOT EXISTS idx_bible_chapters_book_id ON bible_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_bible_chapters_bible_id ON bible_chapters(bible_id);
CREATE INDEX IF NOT EXISTS idx_bible_chapters_book_chapter ON bible_chapters(book_id, chapter_number);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC updated_at
-- ============================================================================

-- Generic updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_forge_entries_updated_at ON daily_forge_entries;
CREATE TRIGGER update_daily_forge_entries_updated_at
    BEFORE UPDATE ON daily_forge_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reading_plans_updated_at ON reading_plans;
CREATE TRIGGER update_reading_plans_updated_at
    BEFORE UPDATE ON reading_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prayer_requests_updated_at ON prayer_requests;
CREATE TRIGGER update_prayer_requests_updated_at
    BEFORE UPDATE ON prayer_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sermon_notes_updated_at ON sermon_notes;
CREATE TRIGGER update_sermon_notes_updated_at
    BEFORE UPDATE ON sermon_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_requests_updated_at ON support_requests;
CREATE TRIGGER update_support_requests_updated_at
    BEFORE UPDATE ON support_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CREATE DEFAULT ADMIN USER
-- Password: admin123 (you should change this immediately after first login)
-- The password hash below is for 'admin123' using bcrypt
-- ============================================================================
INSERT INTO users (email, display_name, password_hash, is_admin, onboarding_completed) 
VALUES (
    'admin@thedailyforge.com', 
    'Admin User', 
    '$2a$10$rQnM1PIlT7h1Y5MHh5F5/.cZ7VQj6YD3N3CXZ8sQN3TQ5G5oJwEpC',
    true,
    true
) 
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
SELECT 'Database setup complete!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
