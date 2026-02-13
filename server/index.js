const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')
const smsService = require('./smsService')
const emailService = require('./emailService')
const { 
  rateLimits, 
  securityHeaders, 
  requestLogger, 
  errorHandler, 
  validateLogin, 
  validateSignup 
} = require('./essential-security')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005', 'http://localhost:3006', 'http://localhost:3007', 'http://localhost:3008', 'http://localhost:3009', 'http://localhost:3010'],
  credentials: true
}))

// Security middleware
app.use(securityHeaders)
app.use(requestLogger)
app.use(rateLimits.general) // General rate limiting

app.use(express.json())

// Database connection - must be set in environment variables
if (!process.env.NEON_CONNECTION_STRING) {
  console.error('❌ NEON_CONNECTION_STRING environment variable is required')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  },
  // Optimize for free tier (1 connection limit)
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000
})

// JWT secret - must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET environment variable not set, using fallback (not secure for production)')
}

// Helper function to get local date string (YYYY-MM-DD)
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Simple middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('🔍 JWT decoded user:', decoded)
    console.log('🔍 JWT user ID:', decoded.userId)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid token' })
  }
}

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    res.json({ success: true, message: 'Database connection successful', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Database connection error:', error)
    res.status(500).json({ success: false, error: 'Database connection failed' })
  }
})

// Debug endpoint to see database structure
app.get('/api/debug/tables', async (req, res) => {
  try {
    const client = await pool.connect()
    
    try {
      // Get all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `)
      
      // Get sample data from daily_forge_entries
      const dailyEntriesResult = await client.query(`
        SELECT user_id, date_key, created_at, data_content 
        FROM daily_forge_entries 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      // Check if there are other potential entry tables
      const otherTablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%entry%'
        ORDER BY table_name
      `)
      
      res.json({ 
        success: true, 
        all_tables: tablesResult.rows,
        daily_forge_entries: dailyEntriesResult.rows,
        potential_entry_tables: otherTablesResult.rows
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Simple login endpoint
app.post('/api/auth/login', rateLimits.login, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' })
    }

    const client = await pool.connect()
    
    try {
      // Get user by email
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' })
      }

      const user = result.rows[0]

      // Simple password check - handle both plain text and bcrypt
      let isValidPassword = false
      
      if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
        // Bcrypt hash
        isValidPassword = await bcrypt.compare(password, user.password_hash)
      } else {
        // Plain text
        isValidPassword = (password === user.password_hash)
      }
      
      if (!isValidPassword) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' })
      }

      // Generate JWT token with user info
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          isAdmin: user.is_admin || false,
          displayName: user.display_name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.display_name,
          role: user.is_admin ? 'admin' : 'user',
          is_admin: user.is_admin || false
        },
        token
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

// Simple logout (just return success - client handles token removal)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' })
})

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    user: {
      id: req.user.userId,
      email: req.user.email,
      name: req.user.displayName,
      role: req.user.isAdmin ? 'admin' : 'user',
      is_admin: req.user.isAdmin
    }
  })
})

// Admin routes
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' })
    }

    const client = await pool.connect()
    
    try {
      const result = await client.query(
        `SELECT id, email, display_name, is_admin, created_at 
         FROM users 
         ORDER BY created_at DESC`
      )
      
      res.json({ success: true, users: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ success: false, error: 'Failed to get users' })
  }
})

// Daily entries routes
app.post('/api/entries', authenticateToken, async (req, res) => {
  try {
    const { date, goals, gratitude, soap, dailyIntention, growthQuestion, leadershipRating, checkIn, readingPlan, deletedGoalIds, completed } = req.body
    const userId = req.user.userId
    const dateKey = date || getLocalDateString()

    const client = await pool.connect()
    
    try {
      // Save main entry data (including readingPlan)
      const dataContent = {
        goals,
        gratitude,
        soap,
        dailyIntention,
        growthQuestion,
        leadershipRating,
        checkIn,
        readingPlan,
        deletedGoalIds,
        completed
      }
      
      
      const result = await client.query(
        `INSERT INTO daily_forge_entries 
         (date_key, user_id, data_content) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (date_key, user_id) 
         DO UPDATE SET data_content = $3
         RETURNING *`,
        [
          dateKey,
          userId,
          JSON.stringify(dataContent)
        ]
      )

      // Save reading plan data separately if it exists
      if (readingPlan && readingPlan.planId) {
        
        try {
          const readingPlanResult = await client.query(
            `INSERT INTO reading_plans 
             (user_id, date_key, plan_id, plan_name, current_day, total_days, start_date, completed_days)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (user_id, plan_id)
             DO UPDATE SET 
               current_day = EXCLUDED.current_day,
               total_days = EXCLUDED.total_days,
               completed_days = EXCLUDED.completed_days,
               updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [
              userId,
              dateKey,
              readingPlan.planId,
              readingPlan.planName,
              readingPlan.currentDay,
              readingPlan.totalDays,
              readingPlan.startDate,
              readingPlan.completedDays || []
            ]
          )
        } catch (error) {
          console.error('Error saving reading plan:', error)
        }
      }

      res.json({ success: true, entry: result.rows[0] })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Save entry error:', error)
    res.status(500).json({ success: false, error: 'Failed to save entry' })
  }
})

app.get('/api/entries/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params
    const userId = req.user.userId

    const client = await pool.connect()
    
    try {
      // Get the current day's entry
      const entryResult = await client.query(
        `SELECT * FROM daily_forge_entries 
         WHERE user_id = $1 AND date_key = $2`,
        [userId, date]
      )

      let entry = null
      if (entryResult.rows.length > 0) {
        entry = entryResult.rows[0]
      }

      // Get the reading plan data from the reading_plans table (this has the correct progress)
      const readingPlanResult = await client.query(
        `SELECT * FROM reading_plans 
         WHERE user_id = $1 
         ORDER BY updated_at DESC 
         LIMIT 1`,
        [userId]
      )

      let dataContent = entry?.data_content || {}
      
      // If we have reading plan data from the dedicated table, use that
      if (readingPlanResult.rows.length > 0) {
        const readingPlan = readingPlanResult.rows[0]
        dataContent.readingPlan = {
          planId: readingPlan.plan_id,
          planName: readingPlan.plan_name,
          currentDay: readingPlan.current_day,
          totalDays: readingPlan.total_days,
          startDate: readingPlan.start_date,
          completedDays: readingPlan.completed_days || [],
          bibleId: dataContent.readingPlan?.bibleId // Preserve bibleId if it exists
        }
      }

      res.json({ 
        success: true, 
        entry: entry ? {
          ...entry,
          data_content: dataContent
        } : null
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Get entry error:', error)
    res.status(500).json({ success: false, error: 'Failed to get entry' })
  }
})

// Get all entries for a user
app.get('/api/entries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { limit = 30 } = req.query

    const client = await pool.connect()
    
    try {
      // Get main entries
      const entriesResult = await client.query(
        `SELECT * FROM daily_forge_entries 
         WHERE user_id = $1 
         ORDER BY date_key DESC 
         LIMIT $2`,
        [userId, limit]
      )

      // Get the latest reading plan data from the reading_plans table
      const readingPlanResult = await client.query(
        `SELECT * FROM reading_plans 
         WHERE user_id = $1 
         ORDER BY updated_at DESC 
         LIMIT 1`,
        [userId]
      )

      let latestReadingPlan = null
      if (readingPlanResult.rows.length > 0) {
        const readingPlan = readingPlanResult.rows[0]
        latestReadingPlan = {
          planId: readingPlan.plan_id,
          planName: readingPlan.plan_name,
          currentDay: readingPlan.current_day,
          totalDays: readingPlan.total_days,
          startDate: readingPlan.start_date,
          completedDays: readingPlan.completed_days || []
        }
      }

      // Return entries with the latest reading plan data injected
      const entries = entriesResult.rows.map(entry => {
        const dataContent = entry.data_content || {}
        
        // Inject the latest reading plan data if it exists
        if (latestReadingPlan) {
          dataContent.readingPlan = latestReadingPlan
        }
        
        return {
          ...entry,
          data_content: dataContent
        }
      })

      res.json({ success: true, entries })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Get entries error:', error)
    res.status(500).json({ success: false, error: 'Failed to get entries' })
  }
})

// Create user endpoint
app.post('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' })
    }

    const { email, password, displayName, isAdmin } = req.body

    if (!email || !password || !displayName) {
      return res.status(400).json({ success: false, error: 'Email, password, and display name are required' })
    }

    const client = await pool.connect()
    
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'User with this email already exists' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, display_name, is_admin) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, display_name, is_admin, created_at`,
        [email, hashedPassword, displayName, isAdmin || false]
      )

      res.json({ success: true, user: result.rows[0] })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ success: false, error: 'Failed to create user' })
  }
})

// Public signup endpoint (no authentication required)
app.post('/api/auth/signup', rateLimits.auth, validateSignup, async (req, res) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !password || !displayName) {
      return res.status(400).json({ success: false, error: 'Email, password, and display name are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' })
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' })
    }

    const client = await pool.connect()
    
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user (non-admin by default)
      const result = await client.query(
        `INSERT INTO users (email, password_hash, display_name, is_admin) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, display_name, is_admin, created_at`,
        [email, hashedPassword, displayName, false]
      )

      const newUser = result.rows[0]

      // Generate JWT token for immediate login
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email, 
          isAdmin: newUser.is_admin 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.json({ 
        success: true, 
        user: {
          id: newUser.id,
          email: newUser.email,
          display_name: newUser.display_name,
          is_admin: newUser.is_admin
        },
        token 
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' })
  }
})

// Delete user endpoint
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' })
    }

    const { id } = req.params

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' })
    }

    const client = await pool.connect()
    
    try {
      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING id, email, display_name',
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' })
      }

      res.json({ success: true, user: result.rows[0] })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete user' })
  }
})

// ============================================================================
// PRAYER REQUESTS ENDPOINTS
// ============================================================================

// Get all prayer requests for authenticated user
app.get('/api/prayer-requests', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    
    const result = await client.query(`
      SELECT 
        id,
        user_id,
        title,
        description,
        person_name,
        category,
        status,
        priority,
        created_at,
        updated_at,
        answered_at,
        praise_report
      FROM prayer_requests 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId])
    
    const requests = result.rows.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      title: row.title,
      description: row.description,
      personName: row.person_name,
      category: row.category,
      status: row.status,
      priority: row.priority,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      answeredAt: row.answered_at ? new Date(row.answered_at) : null,
      praiseReport: row.praise_report
    }))
    
    res.json({ success: true, requests })
  } catch (error) {
    console.error('Get prayer requests error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch prayer requests' })
  } finally {
    client.release()
  }
})

// Create new prayer request
app.post('/api/prayer-requests', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const { title, description, personName, category, priority } = req.body
    
    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and description are required' 
      })
    }
    
    const result = await client.query(`
      INSERT INTO prayer_requests (
        user_id, title, description, person_name, category, priority
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, title, description, personName || null, category || 'other', priority || 'medium'])
    
    const newRequest = {
      id: result.rows[0].id.toString(),
      userId: result.rows[0].user_id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      personName: result.rows[0].person_name,
      category: result.rows[0].category,
      status: result.rows[0].status,
      priority: result.rows[0].priority,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at),
      answeredAt: result.rows[0].answered_at ? new Date(result.rows[0].answered_at) : null,
      praiseReport: result.rows[0].praise_report
    }
    
    res.status(201).json({ success: true, request: newRequest })
  } catch (error) {
    console.error('Create prayer request error:', error)
    res.status(500).json({ success: false, error: 'Failed to create prayer request' })
  } finally {
    client.release()
  }
})

// Update prayer request
app.put('/api/prayer-requests/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const requestId = req.params.id
    const { title, description, personName, category, priority, status } = req.body
    
    // Verify ownership
    const ownershipCheck = await client.query(
      'SELECT user_id FROM prayer_requests WHERE id = $1',
      [requestId]
    )
    
    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prayer request not found' })
    }
    
    if (ownershipCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    
    // Build update query dynamically
    const updates = []
    const values = []
    let paramCount = 1
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`)
      values.push(title)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(description)
    }
    if (personName !== undefined) {
      updates.push(`person_name = $${paramCount++}`)
      values.push(personName)
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`)
      values.push(category)
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`)
      values.push(priority)
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`)
      values.push(status)
      
      // If marking as answered, set answered_at timestamp
      if (status === 'answered') {
        updates.push(`answered_at = NOW()`)
      } else if (status === 'active') {
        updates.push(`answered_at = NULL`)
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No updates provided' })
    }
    
    values.push(requestId)
    
    const result = await client.query(`
      UPDATE prayer_requests 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values)
    
    const updatedRequest = {
      id: result.rows[0].id.toString(),
      userId: result.rows[0].user_id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      personName: result.rows[0].person_name,
      category: result.rows[0].category,
      status: result.rows[0].status,
      priority: result.rows[0].priority,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at),
      answeredAt: result.rows[0].answered_at ? new Date(result.rows[0].answered_at) : null,
      praiseReport: result.rows[0].praise_report
    }
    
    res.json({ success: true, request: updatedRequest })
  } catch (error) {
    console.error('Update prayer request error:', error)
    res.status(500).json({ success: false, error: 'Failed to update prayer request' })
  } finally {
    client.release()
  }
})

// Add praise report to prayer request
app.put('/api/prayer-requests/:id/praise-report', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const requestId = req.params.id
    const { praiseReport } = req.body
    
    // Verify ownership
    const ownershipCheck = await client.query(
      'SELECT user_id FROM prayer_requests WHERE id = $1',
      [requestId]
    )
    
    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prayer request not found' })
    }
    
    if (ownershipCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    
    const result = await client.query(`
      UPDATE prayer_requests 
      SET praise_report = $1, status = 'answered', answered_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [praiseReport, requestId])
    
    const updatedRequest = {
      id: result.rows[0].id.toString(),
      userId: result.rows[0].user_id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      personName: result.rows[0].person_name,
      category: result.rows[0].category,
      status: result.rows[0].status,
      priority: result.rows[0].priority,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at),
      answeredAt: result.rows[0].answered_at ? new Date(result.rows[0].answered_at) : null,
      praiseReport: result.rows[0].praise_report
    }
    
    res.json({ success: true, request: updatedRequest })
  } catch (error) {
    console.error('Add praise report error:', error)
    res.status(500).json({ success: false, error: 'Failed to add praise report' })
  } finally {
    client.release()
  }
})

// Delete prayer request
app.delete('/api/prayer-requests/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const requestId = req.params.id
    
    // Verify ownership
    const ownershipCheck = await client.query(
      'SELECT user_id FROM prayer_requests WHERE id = $1',
      [requestId]
    )
    
    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prayer request not found' })
    }
    
    if (ownershipCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }
    
    await client.query('DELETE FROM prayer_requests WHERE id = $1', [requestId])
    
    res.json({ success: true, message: 'Prayer request deleted successfully' })
  } catch (error) {
    console.error('Delete prayer request error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete prayer request' })
  } finally {
    client.release()
  }
})

// Get prayer request statistics
app.get('/api/prayer-requests/stats', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    
    // Get basic counts
    const totalResult = await client.query(
      'SELECT COUNT(*) as count FROM prayer_requests WHERE user_id = $1',
      [userId]
    )
    
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM prayer_requests 
      WHERE user_id = $1 
      GROUP BY status
    `, [userId])
    
    const categoryResult = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM prayer_requests 
      WHERE user_id = $1 
      GROUP BY category
    `, [userId])
    
    const priorityResult = await client.query(`
      SELECT priority, COUNT(*) as count 
      FROM prayer_requests 
      WHERE user_id = $1 
      GROUP BY priority
    `, [userId])
    
    // Build stats object
    const stats = {
      total: parseInt(totalResult.rows[0].count),
      active: 0,
      answered: 0,
      closed: 0,
      byCategory: {},
      byPriority: {}
    }
    
    // Process status counts
    statusResult.rows.forEach(row => {
      stats[row.status] = parseInt(row.count)
    })
    
    // Process category counts
    categoryResult.rows.forEach(row => {
      stats.byCategory[row.category] = parseInt(row.count)
    })
    
    // Process priority counts
    priorityResult.rows.forEach(row => {
      stats.byPriority[row.priority] = parseInt(row.count)
    })
    
    res.json({ success: true, stats })
  } catch (error) {
    console.error('Get prayer stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch prayer statistics' })
  } finally {
    client.release()
  }
})

// ============================================================================
// SMS NOTIFICATION ENDPOINTS
// ============================================================================

// Get user SMS settings
app.get('/api/user/sms-settings', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    
    const result = await client.query(`
      SELECT 
        phone_number,
        sms_notifications_enabled,
        notification_time,
        timezone,
        notification_frequency,
        last_notification_sent
      FROM user_settings 
      WHERE user_id = $1
    `, [userId])
    
    if (result.rows.length === 0) {
      // Create default settings for user
      await client.query(`
        INSERT INTO user_settings (user_id) 
        VALUES ($1)
      `, [userId])
      
      res.json({ 
        success: true, 
        settings: {
          phoneNumber: null,
          smsNotificationsEnabled: false,
          notificationTime: '07:00:00',
          timezone: 'America/New_York',
          notificationFrequency: 'daily',
          lastNotificationSent: null
        }
      })
    } else {
      const settings = result.rows[0]
      res.json({ 
        success: true, 
        settings: {
          phoneNumber: settings.phone_number,
          smsNotificationsEnabled: settings.sms_notifications_enabled,
          notificationTime: settings.notification_time,
          timezone: settings.timezone,
          notificationFrequency: settings.notification_frequency,
          lastNotificationSent: settings.last_notification_sent
        }
      })
    }
  } catch (error) {
    console.error('Get SMS settings error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch SMS settings' })
  } finally {
    client.release()
  }
})

// Update user SMS settings
app.put('/api/user/sms-settings', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const { 
      phoneNumber, 
      smsNotificationsEnabled, 
      notificationTime, 
      timezone, 
      notificationFrequency 
    } = req.body
    
    // Validate phone number if provided
    if (phoneNumber && !smsService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format' 
      })
    }
    
    // Upsert user settings
    const result = await client.query(`
      INSERT INTO user_settings (
        user_id, phone_number, sms_notifications_enabled, 
        notification_time, timezone, notification_frequency
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        phone_number = EXCLUDED.phone_number,
        sms_notifications_enabled = EXCLUDED.sms_notifications_enabled,
        notification_time = EXCLUDED.notification_time,
        timezone = EXCLUDED.timezone,
        notification_frequency = EXCLUDED.notification_frequency,
        updated_at = NOW()
      RETURNING *
    `, [userId, phoneNumber, smsNotificationsEnabled, notificationTime, timezone, notificationFrequency])
    
    const settings = result.rows[0]
    
    res.json({ 
      success: true, 
      settings: {
        phoneNumber: settings.phone_number,
        smsNotificationsEnabled: settings.sms_notifications_enabled,
        notificationTime: settings.notification_time,
        timezone: settings.timezone,
        notificationFrequency: settings.notification_frequency,
        lastNotificationSent: settings.last_notification_sent
      }
    })
  } catch (error) {
    console.error('Update SMS settings error:', error)
    res.status(500).json({ success: false, error: 'Failed to update SMS settings' })
  } finally {
    client.release()
  }
})

// Get user settings
app.get('/api/user/settings', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const result = await client.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    )
    
    const settings = result.rows[0] || { 
      soap_scripture_mode: 'plan',
      phone_number: null,
      sms_notifications_enabled: false,
      notification_time: '07:00:00',
      timezone: 'America/New_York',
      notification_frequency: 'daily',
      onboarding_completed: false
    }
    
    res.json({ 
      success: true, 
      settings: {
        soapScriptureMode: settings.soap_scripture_mode,
        phoneNumber: settings.phone_number,
        smsNotificationsEnabled: settings.sms_notifications_enabled,
        notificationTime: settings.notification_time,
        timezone: settings.timezone,
        notificationFrequency: settings.notification_frequency,
        onboardingCompleted: settings.onboarding_completed,
        lastNotificationSent: settings.last_notification_sent
      }
    })
  } catch (error) {
    console.error('Get user settings error:', error)
    res.status(500).json({ success: false, error: 'Failed to get user settings' })
  } finally {
    client.release()
  }
})

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, display_name, is_admin, created_at FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      const user = result.rows[0];
      res.json({
        success: true,
        profile: {
          id: user.id,
          email: user.email,
          name: user.display_name,
          role: user.is_admin ? 'admin' : 'user',
          memberSince: user.created_at
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// Update user settings (general)
app.put('/api/user/settings', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const { soapScriptureMode } = req.body
    
    if (soapScriptureMode && !['verse', 'plan'].includes(soapScriptureMode)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid scripture mode. Must be "verse" or "plan"' 
      })
    }
    
    const result = await client.query(`
      INSERT INTO user_settings (user_id, soap_scripture_mode)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET 
        soap_scripture_mode = EXCLUDED.soap_scripture_mode,
        updated_at = NOW()
      RETURNING *
    `, [userId, soapScriptureMode])
    
    res.json({ 
      success: true, 
      settings: {
        soapScriptureMode: result.rows[0].soap_scripture_mode
      }
    })
  } catch (error) {
    console.error('Update user settings error:', error)
    res.status(500).json({ success: false, error: 'Failed to update user settings' })
  } finally {
    client.release()
  }
})

// Send test SMS
app.post('/api/user/sms-test', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const { phoneNumber } = req.body
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      })
    }
    
    if (!smsService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format' 
      })
    }
    
    // Get user display name
    const userResult = await client.query(
      'SELECT display_name FROM users WHERE id = $1',
      [userId]
    )
    
    const userName = userResult.rows[0]?.display_name || 'David'
    
    // Send test message
    const result = await smsService.sendTestMessage(phoneNumber)
    
    // Log the notification
    await client.query(`
      INSERT INTO notification_logs (
        user_id, phone_number, message_content, message_type, status, twilio_sid
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      userId, 
      phoneNumber, 
      'Test message sent', 
      'test', 
      result.success ? 'sent' : 'failed',
      result.sid || null
    ])
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test message sent successfully',
        sid: result.sid
      })
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to send test message' 
      })
    }
  } catch (error) {
    console.error('Send test SMS error:', error)
    res.status(500).json({ success: false, error: 'Failed to send test message' })
  } finally {
    client.release()
  }
})

// Send daily inspiration SMS (for testing)
app.post('/api/user/sms-daily', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const { phoneNumber } = req.body
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      })
    }
    
    if (!smsService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format' 
      })
    }
    
    // Get user display name
    const userResult = await client.query(
      'SELECT display_name FROM users WHERE id = $1',
      [userId]
    )
    
    const userName = userResult.rows[0]?.display_name || 'David'
    
    // Send daily inspiration message
    const result = await smsService.sendDailyInspiration(phoneNumber, userName)
    
    // Log the notification
    await client.query(`
      INSERT INTO notification_logs (
        user_id, phone_number, message_content, message_type, status, twilio_sid
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      userId, 
      phoneNumber, 
      'Daily inspiration message sent', 
      'daily_inspiration', 
      result.success ? 'sent' : 'failed',
      result.sid || null
    ])
    
    if (result.success) {
      // Update last notification sent time
      await client.query(`
        UPDATE user_settings 
        SET last_notification_sent = NOW() 
        WHERE user_id = $1
      `, [userId])
      
      res.json({ 
        success: true, 
        message: 'Daily inspiration message sent successfully',
        sid: result.sid
      })
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'Failed to send daily inspiration message' 
      })
    }
  } catch (error) {
    console.error('Send daily SMS error:', error)
    res.status(500).json({ success: false, error: 'Failed to send daily inspiration message' })
  } finally {
    client.release()
  }
})

// Get notification logs for user
app.get('/api/user/notification-logs', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    const { limit = 10 } = req.query
    
    const result = await client.query(`
      SELECT 
        id,
        phone_number,
        message_content,
        message_type,
        status,
        twilio_sid,
        error_message,
        sent_at
      FROM notification_logs 
      WHERE user_id = $1 
      ORDER BY sent_at DESC 
      LIMIT $2
    `, [userId, limit])
    
    const logs = result.rows.map(row => ({
      id: row.id,
      phoneNumber: row.phone_number,
      messageContent: row.message_content,
      messageType: row.message_type,
      status: row.status,
      twilioSid: row.twilio_sid,
      errorMessage: row.error_message,
      sentAt: new Date(row.sent_at)
    }))
    
    res.json({ success: true, logs })
  } catch (error) {
    console.error('Get notification logs error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch notification logs' })
  } finally {
    client.release()
  }
})

// ============================================================================
// ONBOARDING ENDPOINTS
// ============================================================================

// Get user onboarding status - only show onboarding for brand new users
app.get('/api/user/onboarding-status', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    
    // Check if user is brand new (created within last 24 hours)
    const result = await client.query(`
      SELECT 
        created_at,
        onboarding_completed
      FROM users 
      WHERE id = $1
    `, [userId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    
    const user = result.rows[0]
    const userCreatedAt = new Date(user.created_at)
    const now = new Date()
    const hoursSinceCreation = (now - userCreatedAt) / (1000 * 60 * 60)
    
    // Only show onboarding for users created within the last 24 hours
    const isBrandNewUser = hoursSinceCreation <= 24
    
    res.json({ 
      success: true, 
      shouldShowOnboarding: isBrandNewUser && !user.onboarding_completed,
      isBrandNewUser,
      userCreatedAt: user.created_at,
      hoursSinceCreation: Math.round(hoursSinceCreation * 100) / 100
    })
  } catch (error) {
    console.error('Get onboarding status error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch onboarding status' })
  } finally {
    client.release()
  }
})

// Mark onboarding as completed
app.post('/api/user/complete-onboarding', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const userId = req.user.userId
    
    // Update user to mark onboarding as completed
    const result = await client.query(`
      UPDATE users 
      SET onboarding_completed = TRUE, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [userId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    
    res.json({ 
      success: true, 
      message: 'Onboarding marked as completed',
      onboardingCompleted: true
    })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    res.status(500).json({ success: false, error: 'Failed to mark onboarding as completed' })
  } finally {
    client.release()
  }
})

// ============================================================================
// SERMON NOTES API ENDPOINTS
// ============================================================================

// Check if sermon_notes table exists
app.get('/api/sermon-notes/check-table', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sermon_notes'
    `)
    
    const tableExists = result.rows.length > 0
    
    res.json({ 
      success: true, 
      tableExists,
      message: tableExists ? 'sermon_notes table exists' : 'sermon_notes table does not exist - please run the SQL script'
    })
  } catch (error) {
    console.error('Check table error:', error)
    res.status(500).json({ success: false, error: 'Failed to check table existence' })
  } finally {
    client.release()
  }
})

// Get all sermon notes for authenticated user
app.get('/api/sermon-notes', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.userId
    const result = await client.query(`
      SELECT 
        id, user_id, date, church_name, sermon_title, speaker_name, bible_passage, notes, created_at, updated_at
      FROM sermon_notes 
      WHERE user_id = $1 
      ORDER BY date DESC, created_at DESC
    `, [userId])
    
    const notes = result.rows.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      date: row.date,
      churchName: row.church_name,
      sermonTitle: row.sermon_title,
      speakerName: row.speaker_name,
      biblePassage: row.bible_passage,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
    
    res.json({ success: true, notes })
  } catch (error) {
    console.error('Get sermon notes error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch sermon notes' })
  } finally {
    client.release()
  }
})

// Get specific sermon note
app.get('/api/sermon-notes/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.userId
    const noteId = req.params.id
    
    const result = await client.query(`
      SELECT 
        id, user_id, date, church_name, sermon_title, speaker_name, bible_passage, notes, created_at, updated_at
      FROM sermon_notes 
      WHERE id = $1 AND user_id = $2
    `, [noteId, userId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sermon note not found' })
    }
    
    const note = result.rows[0]
    res.json({ 
      success: true, 
      note: {
        id: note.id.toString(),
        userId: note.user_id,
        date: note.date,
        churchName: note.church_name,
        sermonTitle: note.sermon_title,
        speakerName: note.speaker_name,
        biblePassage: note.bible_passage,
        notes: note.notes,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at)
      }
    })
  } catch (error) {
    console.error('Get sermon note error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch sermon note' })
  } finally {
    client.release()
  }
})

// Create new sermon note
app.post('/api/sermon-notes', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.userId
    const { date, churchName, sermonTitle, speakerName, biblePassage, notes, selectedVerses } = req.body
    
    // Allow partial saves for auto-save functionality - no validation required
    
    // Extract verse metadata if selectedVerses is provided
    let bibleBook = null
    let bibleChapter = null
    let verseStart = null
    let verseEnd = null
    let bibleVersion = null
    let verseReference = null
    let verseContent = null
    
    if (selectedVerses && selectedVerses.length > 0) {
      const firstVerse = selectedVerses[0]
      const lastVerse = selectedVerses[selectedVerses.length - 1]
      
      // Extract book, chapter, and verse numbers from the reference
      const referenceParts = firstVerse.reference.split(':')
      if (referenceParts.length >= 2) {
        const bookChapter = referenceParts[0]
        const bookMatch = bookChapter.match(/^([A-Z0-9]+)(\d+)$/)
        if (bookMatch) {
          bibleBook = bookMatch[1]
          bibleChapter = parseInt(bookMatch[2])
        }
        
        const firstVerseNum = parseInt(referenceParts[1])
        const lastVerseNum = parseInt(lastVerse.reference.split(':')[1])
        
        verseStart = firstVerseNum
        verseEnd = lastVerseNum
        verseReference = biblePassage || firstVerse.reference
        verseContent = selectedVerses.map(v => v.content).join(' ')
      }
    }
    
    const result = await client.query(`
      INSERT INTO sermon_notes (user_id, date, church_name, sermon_title, speaker_name, bible_passage, notes, bible_book, bible_chapter, verse_start, verse_end, bible_version, verse_reference, verse_content)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, user_id, date, church_name, sermon_title, speaker_name, bible_passage, notes, created_at, updated_at
    `, [userId, date, churchName || '', sermonTitle || '', speakerName || '', biblePassage || '', notes || '', bibleBook, bibleChapter, verseStart, verseEnd, bibleVersion, verseReference, verseContent])
    
    const note = result.rows[0]
    res.status(201).json({ 
      success: true, 
      note: {
        id: note.id.toString(),
        userId: note.user_id,
        date: note.date,
        churchName: note.church_name,
        sermonTitle: note.sermon_title,
        speakerName: note.speaker_name,
        biblePassage: note.bible_passage,
        notes: note.notes,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at)
      }
    })
  } catch (error) {
    console.error('Create sermon note error:', error)
    res.status(500).json({ success: false, error: 'Failed to create sermon note' })
  } finally {
    client.release()
  }
})

// Update sermon note
app.put('/api/sermon-notes/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.userId
    const noteId = req.params.id
    const { date, churchName, sermonTitle, speakerName, biblePassage, notes, selectedVerses } = req.body
    
    // Extract verse metadata if selectedVerses is provided
    let bibleBook = null
    let bibleChapter = null
    let verseStart = null
    let verseEnd = null
    let bibleVersion = null
    let verseReference = null
    let verseContent = null
    
    if (selectedVerses && selectedVerses.length > 0) {
      const firstVerse = selectedVerses[0]
      const lastVerse = selectedVerses[selectedVerses.length - 1]
      
      // Extract book, chapter, and verse numbers from the reference
      const referenceParts = firstVerse.reference.split(':')
      if (referenceParts.length >= 2) {
        const bookChapter = referenceParts[0]
        const bookMatch = bookChapter.match(/^([A-Z0-9]+)(\d+)$/)
        if (bookMatch) {
          bibleBook = bookMatch[1]
          bibleChapter = parseInt(bookMatch[2])
        }
        
        const firstVerseNum = parseInt(referenceParts[1])
        const lastVerseNum = parseInt(lastVerse.reference.split(':')[1])
        
        verseStart = firstVerseNum
        verseEnd = lastVerseNum
        verseReference = biblePassage || firstVerse.reference
        verseContent = selectedVerses.map(v => v.content).join(' ')
      }
    }
    
    const result = await client.query(`
      UPDATE sermon_notes 
      SET 
        date = COALESCE($1, date),
        church_name = COALESCE($2, church_name),
        sermon_title = COALESCE($3, sermon_title),
        speaker_name = COALESCE($4, speaker_name),
        bible_passage = COALESCE($5, bible_passage),
        notes = COALESCE($6, notes),
        bible_book = COALESCE($7, bible_book),
        bible_chapter = COALESCE($8, bible_chapter),
        verse_start = COALESCE($9, verse_start),
        verse_end = COALESCE($10, verse_end),
        bible_version = COALESCE($11, bible_version),
        verse_reference = COALESCE($12, verse_reference),
        verse_content = COALESCE($13, verse_content),
        updated_at = NOW()
      WHERE id = $14 AND user_id = $15
      RETURNING id, user_id, date, church_name, sermon_title, speaker_name, bible_passage, notes, created_at, updated_at
    `, [date, churchName, sermonTitle, speakerName, biblePassage, notes, bibleBook, bibleChapter, verseStart, verseEnd, bibleVersion, verseReference, verseContent, noteId, userId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sermon note not found' })
    }
    
    const note = result.rows[0]
    res.json({ 
      success: true, 
      note: {
        id: note.id.toString(),
        userId: note.user_id,
        date: note.date,
        churchName: note.church_name,
        sermonTitle: note.sermon_title,
        speakerName: note.speaker_name,
        biblePassage: note.bible_passage,
        notes: note.notes,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at)
      }
    })
  } catch (error) {
    console.error('Update sermon note error:', error)
    res.status(500).json({ success: false, error: 'Failed to update sermon note' })
  } finally {
    client.release()
  }
})

// Delete sermon note
app.delete('/api/sermon-notes/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.userId
    const noteId = req.params.id
    
    const result = await client.query(`
      DELETE FROM sermon_notes 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [noteId, userId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Sermon note not found' })
    }
    
    res.json({ success: true, message: 'Sermon note deleted successfully' })
  } catch (error) {
    console.error('Delete sermon note error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete sermon note' })
  } finally {
    client.release()
  }
})

// Get unique churches for authenticated user
app.get('/api/sermon-notes/churches', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.userId
    const result = await client.query(`
      SELECT DISTINCT church_name 
      FROM sermon_notes 
      WHERE user_id = $1 
      ORDER BY church_name
    `, [userId])
    
    const churches = result.rows.map(row => row.church_name)
    res.json({ success: true, churches })
  } catch (error) {
    console.error('Get churches error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch churches' })
  } finally {
    client.release()
  }
})

// Get unique speakers for authenticated user
app.get('/api/sermon-notes/speakers', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.userId
    const result = await client.query(`
      SELECT DISTINCT speaker_name 
      FROM sermon_notes 
      WHERE user_id = $1 
      ORDER BY speaker_name
    `, [userId])
    
    const speakers = result.rows.map(row => row.speaker_name)
    res.json({ success: true, speakers })
  } catch (error) {
    console.error('Get speakers error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch speakers' })
  } finally {
    client.release()
  }
})

// Get sermon notes statistics
app.get('/api/sermon-notes/stats', authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.user.userId
    
    // Get basic stats
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_notes,
        COUNT(DISTINCT church_name) as unique_churches,
        COUNT(DISTINCT speaker_name) as unique_speakers,
        SUM(LENGTH(notes) - LENGTH(REPLACE(notes, ' ', '')) + 1) as total_words
      FROM sermon_notes 
      WHERE user_id = $1
    `, [userId])
    
    // Get most frequent speakers
    const speakersResult = await client.query(`
      SELECT speaker_name, COUNT(*) as count
      FROM sermon_notes 
      WHERE user_id = $1
      GROUP BY speaker_name
      ORDER BY count DESC
      LIMIT 5
    `, [userId])
    
    // Get most frequent churches
    const churchesResult = await client.query(`
      SELECT church_name, COUNT(*) as count
      FROM sermon_notes 
      WHERE user_id = $1
      GROUP BY church_name
      ORDER BY count DESC
      LIMIT 5
    `, [userId])
    
    // Get unique churches and speakers
    const churchesListResult = await client.query(`
      SELECT DISTINCT church_name FROM sermon_notes WHERE user_id = $1 ORDER BY church_name
    `, [userId])
    
    const speakersListResult = await client.query(`
      SELECT DISTINCT speaker_name FROM sermon_notes WHERE user_id = $1 ORDER BY speaker_name
    `, [userId])
    
    const stats = statsResult.rows[0]
    const totalWords = parseInt(stats.total_words) || 0
    const totalNotes = parseInt(stats.total_notes) || 0
    
    res.json({
      success: true,
      stats: {
        totalNotes: totalNotes,
        uniqueChurches: churchesListResult.rows.map(row => row.church_name),
        uniqueSpeakers: speakersListResult.rows.map(row => row.speaker_name),
        totalWords: totalWords,
        averageWordsPerNote: totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0,
        mostFrequentSpeakers: speakersResult.rows.map(row => ({
          speaker: row.speaker_name,
          count: parseInt(row.count)
        })),
        mostFrequentChurches: churchesResult.rows.map(row => ({
          church: row.church_name,
          count: parseInt(row.count)
        }))
      }
    })
  } catch (error) {
    console.error('Get sermon notes stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch sermon notes statistics' })
  } finally {
    client.release()
  }
})

// Bible API endpoints
app.get('/api/bible/books', async (req, res) => {
  const client = await pool.connect()
  try {
    const { bibleId } = req.query
    let query = 'SELECT book_id, name, testament, chapters, total_verses FROM bible_books'
    const params = []
    
    if (bibleId) {
      query += ' WHERE bible_id = $1'
      params.push(bibleId)
    }
    
    // Order by canonical Bible order instead of alphabetical
    const canonicalOrder = [
      'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAH', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
      'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
    ]
    
    // Create a CASE statement for ordering
    const orderCase = canonicalOrder.map((bookId, index) => `WHEN '${bookId}' THEN ${index}`).join(' ')
    query += ` ORDER BY CASE book_id ${orderCase} ELSE 999 END`
    
    const result = await client.query(query, params)
    
    const books = result.rows.map(row => ({
      id: row.book_id,
      name: row.name,
      testament: row.testament,
      chapters: row.chapters
    }))
    
    res.json({ success: true, books })
  } catch (error) {
    console.error('Get Bible books error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch Bible books' })
  } finally {
    client.release()
  }
})

app.get('/api/bible/books/:bookId/chapters', async (req, res) => {
  const client = await pool.connect()
  try {
    const { bookId } = req.params
    const { bibleId } = req.query
    
    let query = 'SELECT chapter_number, verse_count FROM bible_chapters WHERE book_id = $1'
    const params = [bookId]
    
    if (bibleId) {
      query += ' AND bible_id = $2'
      params.push(bibleId)
    }
    
    query += ' ORDER BY chapter_number'
    
    const result = await client.query(query, params)
    
    const chapters = result.rows.map(row => ({
      chapter: row.chapter_number,
      verseCount: row.verse_count
    }))
    
    res.json({ success: true, chapters })
  } catch (error) {
    console.error('Get book chapters error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch book chapters' })
  } finally {
    client.release()
  }
})

app.get('/api/bible/books/:bookId/chapters/:chapter/verses', async (req, res) => {
  const client = await pool.connect()
  try {
    const { bookId, chapter } = req.params
    const { bibleId } = req.query
    
    let query = 'SELECT verse_count FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2'
    const params = [bookId, parseInt(chapter)]
    
    if (bibleId) {
      query += ' AND bible_id = $3'
      params.push(bibleId)
    }
    
    const result = await client.query(query, params)
    
    if (result.rows.length === 0) {
      return res.json({ success: true, verses: [] })
    }
    
    const verseCount = result.rows[0].verse_count
    const verses = Array.from({ length: verseCount }, (_, i) => ({ verse: i + 1 }))
    
    res.json({ success: true, verses })
  } catch (error) {
    console.error('Get chapter verses error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch chapter verses' })
  } finally {
    client.release()
  }
})

// Get verses from database (ESV and NLT stored locally)
app.get('/api/bible/verses', async (req, res) => {
  const client = await pool.connect()
  try {
    const { translation, bookId, chapter, startVerse, endVerse } = req.query
    
    if (!translation || !bookId || !chapter || !startVerse) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: translation, bookId, chapter, startVerse' 
      })
    }
    
    const end = endVerse || startVerse
    
    const result = await client.query(`
      SELECT book_name, chapter, verse, text 
      FROM bible_verses 
      WHERE translation = $1 
        AND book_id = $2 
        AND chapter = $3 
        AND verse >= $4 
        AND verse <= $5
      ORDER BY verse
    `, [translation, bookId, parseInt(chapter), parseInt(startVerse), parseInt(end)])
    
    if (result.rows.length === 0) {
      return res.json({ success: true, verses: [] })
    }
    
    // Format response
    const verses = result.rows.map(row => ({
      reference: `${row.book_name} ${row.chapter}:${row.verse}`,
      content: row.text,
      verseId: `${bookId}.${row.chapter}.${row.verse}`
    }))
    
    // Build combined reference for verse range
    const firstVerse = result.rows[0]
    const lastVerse = result.rows[result.rows.length - 1]
    let combinedReference = `${firstVerse.book_name} ${firstVerse.chapter}:${firstVerse.verse}`
    if (result.rows.length > 1) {
      combinedReference = `${firstVerse.book_name} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`
    }
    
    // Get copyright based on translation
    const copyright = translation === 'esv' 
      ? 'Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.'
      : 'Scripture quotations are from the Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation.'
    
    res.json({ 
      success: true, 
      verses,
      combinedReference,
      combinedContent: verses.map(v => v.content).join(' '),
      copyright
    })
  } catch (error) {
    console.error('Get verses error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch verses' })
  } finally {
    client.release()
  }
})

// Support contact endpoint
app.post('/api/support/contact', authenticateToken, async (req, res) => {
  try {
    const { subject, message, category } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!subject || !message || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject, message, and category are required' 
      });
    }

    // Validate category
    const validCategories = ['bug', 'feature', 'general', 'billing'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid category' 
      });
    }

    const client = await pool.connect();
    
    try {
      // Get user info
      const userResult = await client.query(
        'SELECT display_name, email FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }
      
      const user = userResult.rows[0];

      // Store support request in database
      const insertResult = await client.query(`
        INSERT INTO support_requests (user_id, subject, message, category, status, created_at)
        VALUES ($1, $2, $3, $4, 'open', NOW())
        RETURNING id
      `, [userId, subject, message, category]);

      const requestId = insertResult.rows[0].id;

      // Send email notification
      const emailResult = await emailService.sendSupportEmail({
        userName: user.display_name || 'User',
        userEmail: user.email,
        subject,
        message,
        category
      });

      if (!emailResult.success) {
        console.error('Failed to send support email:', emailResult.error);
        // Don't fail the request if email fails, just log it
      }

      console.log(`✅ Support request #${requestId} created by user ${userId}`);

      res.json({ 
        success: true, 
        message: 'Support request submitted successfully',
        requestId 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Support contact error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit support request' 
    });
  }
});

// Start server (only in development)
// Error handling middleware (must be last)
app.use(errorHandler)

// Start server in development mode
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
    console.log(`🌐 Network access: http://192.168.0.91:${PORT}/api/health`)
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
} else {
  // In production (Vercel), just log that we're ready
  console.log(`🚀 Server ready for Vercel deployment`)
  console.log(`📊 Database connected successfully`)
  console.log(`🔒 Security middleware active`)
  console.log(`📱 SMS service: ${smsService.isConfigured ? 'Configured' : 'Not configured'}`)
}

// Export for Vercel serverless functions
module.exports = app
