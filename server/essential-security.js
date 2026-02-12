// Essential security middleware for free-tier, multi-device app
// Lightweight and efficient - no external dependencies

// Simple in-memory rate limiting (no Redis needed)
const rateLimitStore = new Map()

const createRateLimit = (windowMs, maxRequests) => {
  return (req, res, next) => {
    const key = req.ip
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean up old entries
    if (rateLimitStore.has(key)) {
      const requests = rateLimitStore.get(key).filter(time => time > windowStart)
      rateLimitStore.set(key, requests)
    } else {
      rateLimitStore.set(key, [])
    }
    
    const requests = rateLimitStore.get(key)
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      })
    }
    
    requests.push(now)
    next()
  }
}

// Rate limiting configurations
const isProduction = process.env.NODE_ENV === 'production'

const rateLimits = isProduction ? {
  // Production rate limits - strict for security
  general: createRateLimit(15 * 60 * 1000, 100), // 100 requests per 15 minutes
  auth: createRateLimit(15 * 60 * 1000, 10), // 10 auth attempts per 15 minutes
  login: createRateLimit(15 * 60 * 1000, 15), // 15 login attempts per 15 minutes
  data: createRateLimit(60 * 1000, 30) // 30 requests per minute
} : {
  // Development/testing rate limits - lenient for testing
  general: createRateLimit(15 * 60 * 1000, 500), // 500 requests per 15 minutes
  auth: createRateLimit(15 * 60 * 1000, 100), // 100 auth attempts per 15 minutes
  login: createRateLimit(15 * 60 * 1000, 200), // 200 login attempts per 15 minutes
  data: createRateLimit(60 * 1000, 100) // 100 requests per minute
}

// Basic input validation (no external dependencies)
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password) => {
  return password && password.length >= 6
}

const validateDisplayName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50
}

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
}

// Security headers middleware (lightweight)
const securityHeaders = (req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CORS headers for production
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://your-production-domain.com' // Replace with your actual domain
  ]
  
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  next()
}

// Request logging (simple console logging)
const requestLogger = (req, res, next) => {
  const start = Date.now()
  const timestamp = new Date().toISOString()
  
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`)
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`)
  })
  
  next()
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error'
  })
}

// Validation middleware for common endpoints
const validateLogin = (req, res, next) => {
  const { email, password } = req.body
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    })
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    })
  }
  
  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters'
    })
  }
  
  // Sanitize inputs
  req.body.email = sanitizeInput(email.toLowerCase())
  req.body.password = sanitizeInput(password)
  
  next()
}

const validateSignup = (req, res, next) => {
  const { email, password, displayName } = req.body
  
  if (!email || !password || !displayName) {
    return res.status(400).json({
      success: false,
      error: 'Email, password, and display name are required'
    })
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    })
  }
  
  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters'
    })
  }
  
  if (!validateDisplayName(displayName)) {
    return res.status(400).json({
      success: false,
      error: 'Display name must be 2-50 characters'
    })
  }
  
  // Sanitize inputs
  req.body.email = sanitizeInput(email.toLowerCase())
  req.body.password = sanitizeInput(password)
  req.body.displayName = sanitizeInput(displayName)
  
  next()
}

module.exports = {
  rateLimits,
  securityHeaders,
  requestLogger,
  errorHandler,
  validateLogin,
  validateSignup,
  sanitizeInput
}
