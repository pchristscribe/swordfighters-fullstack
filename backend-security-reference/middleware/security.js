/**
 * Security Middleware
 *
 * Express/Fastify middleware for authentication, authorization, and security headers.
 * Ready to use in production with minimal configuration.
 */

/**
 * Authentication Middleware
 * Verifies user is authenticated via session
 *
 * Usage:
 *   app.use('/api/admin/*', requireAuth)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requireAuth(req, res, next) {
  // Check if session exists
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
  }

  // Check if session is expired
  if (req.session.expiresAt && Date.now() > req.session.expiresAt) {
    req.session.destroy()
    return res.status(401).json({
      error: 'Session expired',
      code: 'SESSION_EXPIRED'
    })
  }

  // Update last activity time
  req.session.lastActivity = Date.now()

  next()
}

/**
 * Admin Role Middleware
 * Verifies user has admin role (requires requireAuth first)
 *
 * Usage:
 *   app.use('/api/admin/*', requireAuth, requireAdmin)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
async function requireAdmin(req, res, next) {
  try {
    // Verify admin exists and is active
    const admin = await getAdminById(req.session.adminId)

    if (!admin) {
      req.session.destroy()
      return res.status(401).json({
        error: 'Admin not found',
        code: 'ADMIN_NOT_FOUND'
      })
    }

    if (!admin.isActive) {
      return res.status(403).json({
        error: 'Admin account is inactive',
        code: 'ADMIN_INACTIVE'
      })
    }

    // Attach admin to request for downstream use
    req.admin = admin

    next()
  } catch (error) {
    console.error('Admin verification error:', error)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }
}

/**
 * Security Headers Middleware
 * Sets essential security headers for all responses
 *
 * Usage:
 *   app.use(securityHeaders)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Enable XSS filter (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy (restrict features)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  next()
}

/**
 * CORS Middleware
 * Configures Cross-Origin Resource Sharing
 *
 * Usage:
 *   app.use(corsMiddleware)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function corsMiddleware(req, res, next) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)

  // Default to same-origin if no origins specified
  if (allowedOrigins.length === 0) {
    allowedOrigins.push(req.headers.origin || req.headers.referer)
  }

  const origin = req.headers.origin

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
    res.setHeader('Access-Control-Max-Age', '86400')  // 24 hours
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  next()
}

/**
 * Request Size Limit Middleware
 * Prevents DoS attacks via large request bodies
 *
 * Usage:
 *   app.use(requestSizeLimit({ limit: '10mb' }))
 *
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function requestSizeLimit(options = {}) {
  const maxSize = options.limit || '1mb'
  const maxBytes = parseSize(maxSize)

  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10)

    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE',
        maxSize
      })
    }

    next()
  }
}

/**
 * Rate Limiting Middleware (Simple in-memory implementation)
 * For production, use Redis-backed rate limiting (e.g., express-rate-limit with Redis store)
 *
 * Usage:
 *   app.use('/api/admin/webauthn', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }))
 *
 * @param {Object} options - Rate limit configuration
 * @returns {Function} Express middleware
 */
function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60 * 1000  // 1 minute default
  const max = options.max || 100  // 100 requests per window default
  const message = options.message || 'Too many requests, please try again later'

  const requests = new Map()

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now()
    for (const [key, data] of requests.entries()) {
      if (now - data.resetTime > windowMs) {
        requests.delete(key)
      }
    }
  }, 60 * 1000)

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress

    const now = Date.now()
    const requestData = requests.get(key)

    if (!requestData || now - requestData.resetTime > windowMs) {
      // New window
      requests.set(key, {
        count: 1,
        resetTime: now
      })
      return next()
    }

    requestData.count++

    if (requestData.count > max) {
      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((windowMs - (now - requestData.resetTime)) / 1000)
      })
    }

    next()
  }
}

/**
 * Error Handler Middleware
 * Centralized error handling with environment-aware responses
 *
 * Usage:
 *   app.use(errorHandler)  // Must be last middleware
 *
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function errorHandler(error, req, res, next) {
  // Log error with context
  console.error('[ERROR]', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  })

  // Determine status code
  const statusCode = error.statusCode || error.status || 500

  // Determine error response based on environment
  const response = {
    error: statusCode < 500 ? error.message : 'Internal server error',
    code: error.code || 'INTERNAL_ERROR'
  }

  // Include details in development mode
  if (process.env.NODE_ENV === 'development') {
    response.details = error.message
    response.stack = error.stack
  }

  res.status(statusCode).json(response)
}

/**
 * Validation Error Middleware
 * Handles validation errors specifically
 *
 * Usage:
 *   app.use(validationErrorHandler)
 *
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function validationErrorHandler(error, req, res, next) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: error.errors || [error.message]
    })
  }

  next(error)
}

/**
 * Not Found Handler
 * Returns 404 for unknown routes
 *
 * Usage:
 *   app.use(notFoundHandler)  // After all routes
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Resource not found',
    code: 'NOT_FOUND',
    path: req.path
  })
}

/**
 * Request Logging Middleware
 * Logs all incoming requests for security audit
 *
 * Usage:
 *   app.use(requestLogger)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function requestLogger(req, res, next) {
  const start = Date.now()

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log('[REQUEST]', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    })
  })

  next()
}

/**
 * SQL Injection Protection Middleware
 * Detects common SQL injection patterns in query parameters
 *
 * Usage:
 *   app.use(sqlInjectionProtection)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function sqlInjectionProtection(req, res, next) {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(;|'|"|--|\/\*|\*\/|xp_|sp_)/i,
    /(UNION|OR|AND)\s+.*=/i
  ]

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value))
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue)
    }
    return false
  }

  // Check query parameters
  if (checkValue(req.query)) {
    console.warn('[SECURITY] SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      query: req.query
    })

    return res.status(400).json({
      error: 'Invalid request parameters',
      code: 'INVALID_PARAMETERS'
    })
  }

  next()
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse size string to bytes
 * @param {string} size - Size string (e.g., '10mb', '1gb')
 * @returns {number} Size in bytes
 */
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  }

  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/)
  if (!match) {
    throw new Error(`Invalid size format: ${size}`)
  }

  const [, value, unit] = match
  return parseInt(value, 10) * units[unit]
}

/**
 * Placeholder function - replace with actual DB query
 * @param {string} adminId - Admin ID
 * @returns {Promise<Object|null>} Admin object or null
 */
async function getAdminById(adminId) {
  // TODO: Implement actual database query
  // Example with Prisma:
  // return await prisma.admin.findUnique({ where: { id: adminId } })
  console.warn('getAdminById is not implemented - replace with actual DB query')
  return null
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  requireAuth,
  requireAdmin,
  securityHeaders,
  corsMiddleware,
  requestSizeLimit,
  rateLimit,
  errorHandler,
  validationErrorHandler,
  notFoundHandler,
  requestLogger,
  sqlInjectionProtection
}
