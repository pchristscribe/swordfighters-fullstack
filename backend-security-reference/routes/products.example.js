/**
 * Products API Routes - Security Hardened Example
 *
 * This file demonstrates how to use all security utilities, validation schemas,
 * and middleware together for production-ready, secure API endpoints.
 *
 * Copy this pattern to your actual backend implementation.
 */

const express = require('express')
const router = express.Router()

// Security utilities
const {
  isValidHttpUrl,
  sanitizeText,
  createValidationError
} = require('../utils/security')

// Validation schemas
const {
  validateSchema,
  productCreateSchema,
  productUpdateSchema,
  searchSchema,
  bulkDeleteSchema
} = require('../utils/validation-schemas')

// Security middleware
const {
  requireAuth,
  requireAdmin,
  rateLimit
} = require('../middleware/security')

// Apply authentication to all routes
router.use(requireAuth)
router.use(requireAdmin)

// Apply rate limiting (100 requests per minute)
router.use(rateLimit({ windowMs: 60 * 1000, max: 100 }))

// ============================================================================
// GET /api/admin/products - List products with pagination and search
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    // Validate query parameters
    const validation = validateSchema(req.query, searchSchema)

    if (!validation.valid) {
      return res.status(400).json(createValidationError(
        'Invalid query parameters',
        validation.errors
      ))
    }

    const { page = 1, limit = 20, search, categoryId, isFeatured, isActive } = validation.data

    // Build database query (example with Prisma)
    const where = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (isActive !== undefined) where.isActive = isActive

    // Execute query with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true }
      }),
      prisma.product.count({ where })
    ])

    // Return paginated response
    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// GET /api/admin/products/:id - Get single product
// ============================================================================

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json(createValidationError('Invalid product ID'))
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// POST /api/admin/products - Create new product
// ============================================================================

router.post('/', async (req, res, next) => {
  try {
    // Validate and sanitize request body
    const validation = validateSchema(req.body, productCreateSchema)

    if (!validation.valid) {
      return res.status(400).json(createValidationError(
        'Validation failed',
        validation.errors
      ))
    }

    const data = validation.data

    // Additional business logic validation
    // 1. Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    })

    if (!category) {
      return res.status(400).json(createValidationError('Category not found'))
    }

    // 2. Check for duplicate slug/title (if applicable)
    const existingProduct = await prisma.product.findFirst({
      where: { title: data.title }
    })

    if (existingProduct) {
      return res.status(409).json(createValidationError(
        'Product with this title already exists'
      ))
    }

    // 3. Verify image URL is accessible (optional but recommended)
    if (process.env.VERIFY_IMAGE_URLS === 'true') {
      try {
        const response = await fetch(data.imageUrl, { method: 'HEAD' })
        if (!response.ok) {
          return res.status(400).json(createValidationError(
            'Image URL is not accessible'
          ))
        }
      } catch (error) {
        return res.status(400).json(createValidationError(
          'Failed to verify image URL'
        ))
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...data,
        tags: data.tags || []
      },
      include: { category: true }
    })

    // Log admin action for audit trail
    console.log('[AUDIT] Product created', {
      productId: product.id,
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      timestamp: new Date().toISOString()
    })

    res.status(201).json(product)
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// PATCH /api/admin/products/:id - Update product
// ============================================================================

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json(createValidationError('Invalid product ID'))
    }

    // Check product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } })
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Validate update data
    const validation = validateSchema(req.body, productUpdateSchema)

    if (!validation.valid) {
      return res.status(400).json(createValidationError(
        'Validation failed',
        validation.errors
      ))
    }

    const data = validation.data

    // Validate category if being updated
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId }
      })

      if (!category) {
        return res.status(400).json(createValidationError('Category not found'))
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true }
    })

    // Log admin action
    console.log('[AUDIT] Product updated', {
      productId: product.id,
      adminId: req.admin.id,
      changes: Object.keys(data),
      timestamp: new Date().toISOString()
    })

    res.json(product)
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// DELETE /api/admin/products/:id - Delete product
// ============================================================================

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json(createValidationError('Invalid product ID'))
    }

    // Check product exists
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Delete product (cascade deletes reviews if configured)
    await prisma.product.delete({ where: { id } })

    // Log admin action
    console.log('[AUDIT] Product deleted', {
      productId: id,
      productTitle: product.title,
      adminId: req.admin.id,
      timestamp: new Date().toISOString()
    })

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// POST /api/admin/products/bulk/delete - Bulk delete products
// ============================================================================

router.post('/bulk/delete', async (req, res, next) => {
  try {
    // Validate bulk delete request
    const validation = validateSchema(req.body, bulkDeleteSchema)

    if (!validation.valid) {
      return res.status(400).json(createValidationError(
        'Validation failed',
        validation.errors
      ))
    }

    const { ids } = validation.data

    // Delete products
    const result = await prisma.product.deleteMany({
      where: { id: { in: ids } }
    })

    // Log admin action
    console.log('[AUDIT] Bulk delete products', {
      count: result.count,
      productIds: ids,
      adminId: req.admin.id,
      timestamp: new Date().toISOString()
    })

    res.json({
      message: `${result.count} products deleted`,
      count: result.count
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// POST /api/admin/products/bulk/toggle-featured - Bulk toggle featured status
// ============================================================================

router.post('/bulk/toggle-featured', async (req, res, next) => {
  try {
    // Validate request
    const validation = validateSchema(req.body, {
      productIds: {
        type: 'array',
        required: true,
        maxItems: 100
      },
      isFeatured: {
        type: 'boolean',
        required: true
      }
    })

    if (!validation.valid) {
      return res.status(400).json(createValidationError(
        'Validation failed',
        validation.errors
      ))
    }

    const { productIds, isFeatured } = validation.data

    // Update products
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { isFeatured }
    })

    // Log admin action
    console.log('[AUDIT] Bulk toggle featured', {
      count: result.count,
      isFeatured,
      adminId: req.admin.id,
      timestamp: new Date().toISOString()
    })

    res.json({
      message: `${result.count} products updated`,
      count: result.count
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================================
// Export Router
// ============================================================================

module.exports = router

// ============================================================================
// Usage in main app.js:
// ============================================================================

/*
const express = require('express')
const app = express()

// Apply global security middleware
const {
  securityHeaders,
  corsMiddleware,
  requestLogger,
  sqlInjectionProtection,
  errorHandler,
  validationErrorHandler,
  notFoundHandler
} = require('./middleware/security')

app.use(securityHeaders)
app.use(corsMiddleware)
app.use(requestLogger)
app.use(sqlInjectionProtection)

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Mount routes
const productsRouter = require('./routes/products.example')
app.use('/api/admin/products', productsRouter)

// Error handlers (must be last)
app.use(validationErrorHandler)
app.use(errorHandler)
app.use(notFoundHandler)

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001')
})
*/
