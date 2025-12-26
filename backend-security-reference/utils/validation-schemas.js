/**
 * Validation Schemas for API Endpoints
 *
 * These schemas define validation rules for all CRUD operations.
 * Can be used with Joi, Zod, or implemented manually.
 *
 * Example with Joi:
 *   const Joi = require('joi')
 *   const schema = Joi.object(productCreateSchema)
 *   const { error, value } = schema.validate(req.body)
 */

const {
  isValidHttpUrl,
  sanitizeText,
  validateEmail,
  validatePrice,
  validateRating,
  validateArrayLength,
  sanitizeStringArray,
  createValidationError
} = require('./security')

/**
 * Manual validation implementation (no dependencies required)
 * Validates request body against schema and returns sanitized data
 *
 * @param {Object} data - Request body to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} { valid: boolean, data?: Object, errors?: Array }
 */
function validateSchema(data, schema) {
  const errors = []
  const sanitized = {}

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]

    // Required field check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }

    // Skip validation if not required and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue
    }

    // Type validation and sanitization
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`)
          break
        }

        let sanitizedValue = value

        // Sanitize if HTML not allowed
        if (rules.sanitize !== false) {
          sanitizedValue = sanitizeText(value)
        }

        // Length validation
        if (rules.minLength && sanitizedValue.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`)
          break
        }
        if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`)
          break
        }

        // Custom validation
        if (rules.validate && !rules.validate(sanitizedValue)) {
          errors.push(rules.errorMessage || `${field} is invalid`)
          break
        }

        sanitized[field] = sanitizedValue
        break

      case 'url':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`)
          break
        }

        if (!isValidHttpUrl(value)) {
          errors.push(`${field} must be a valid HTTP or HTTPS URL`)
          break
        }

        sanitized[field] = value.trim()
        break

      case 'email':
        const emailResult = validateEmail(value)
        if (!emailResult.valid) {
          errors.push(emailResult.error)
          break
        }

        sanitized[field] = emailResult.email
        break

      case 'number':
        const numValue = Number(value)
        if (isNaN(numValue)) {
          errors.push(`${field} must be a valid number`)
          break
        }

        if (rules.min !== undefined && numValue < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`)
          break
        }
        if (rules.max !== undefined && numValue > rules.max) {
          errors.push(`${field} must not exceed ${rules.max}`)
          break
        }
        if (rules.integer && !Number.isInteger(numValue)) {
          errors.push(`${field} must be an integer`)
          break
        }

        sanitized[field] = numValue
        break

      case 'price':
        const priceResult = validatePrice(value)
        if (!priceResult.valid) {
          errors.push(priceResult.error)
          break
        }

        sanitized[field] = priceResult.price
        break

      case 'rating':
        const ratingResult = validateRating(value)
        if (!ratingResult.valid) {
          errors.push(ratingResult.error)
          break
        }

        sanitized[field] = ratingResult.rating
        break

      case 'boolean':
        sanitized[field] = Boolean(value)
        break

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`)
          break
        }

        const lengthCheck = validateArrayLength(value, rules.maxItems || 100, field)
        if (!lengthCheck.valid) {
          errors.push(lengthCheck.error)
          break
        }

        if (rules.itemType === 'string') {
          sanitized[field] = sanitizeStringArray(value)
        } else {
          sanitized[field] = value
        }
        break

      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(value)) {
          errors.push(`${field} must be a valid UUID`)
          break
        }

        sanitized[field] = value
        break

      default:
        sanitized[field] = value
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, data: sanitized }
}

// ============================================================================
// Product Schemas
// ============================================================================

const productCreateSchema = {
  title: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 200,
    sanitize: true
  },
  description: {
    type: 'string',
    required: false,
    maxLength: 5000,
    sanitize: true
  },
  price: {
    type: 'price',
    required: true
  },
  imageUrl: {
    type: 'url',
    required: true
  },
  categoryId: {
    type: 'uuid',
    required: true
  },
  tags: {
    type: 'array',
    required: false,
    itemType: 'string',
    maxItems: 10
  },
  isFeatured: {
    type: 'boolean',
    required: false
  },
  isActive: {
    type: 'boolean',
    required: false
  }
}

const productUpdateSchema = {
  title: {
    type: 'string',
    required: false,
    minLength: 1,
    maxLength: 200,
    sanitize: true
  },
  description: {
    type: 'string',
    required: false,
    maxLength: 5000,
    sanitize: true
  },
  price: {
    type: 'price',
    required: false
  },
  imageUrl: {
    type: 'url',
    required: false
  },
  categoryId: {
    type: 'uuid',
    required: false
  },
  tags: {
    type: 'array',
    required: false,
    itemType: 'string',
    maxItems: 10
  },
  isFeatured: {
    type: 'boolean',
    required: false
  },
  isActive: {
    type: 'boolean',
    required: false
  }
}

// ============================================================================
// Category Schemas
// ============================================================================

const categoryCreateSchema = {
  name: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 100,
    sanitize: true
  },
  slug: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 100,
    validate: (value) => /^[a-z0-9-]+$/.test(value),
    errorMessage: 'Slug must contain only lowercase letters, numbers, and hyphens'
  },
  description: {
    type: 'string',
    required: false,
    maxLength: 500,
    sanitize: true
  },
  imageUrl: {
    type: 'url',
    required: false
  },
  metaTitle: {
    type: 'string',
    required: false,
    maxLength: 60,
    sanitize: true
  },
  metaDescription: {
    type: 'string',
    required: false,
    maxLength: 160,
    sanitize: true
  },
  isActive: {
    type: 'boolean',
    required: false
  }
}

const categoryUpdateSchema = {
  ...categoryCreateSchema,
  name: { ...categoryCreateSchema.name, required: false },
  slug: { ...categoryCreateSchema.slug, required: false }
}

// ============================================================================
// Review Schemas
// ============================================================================

const reviewCreateSchema = {
  productId: {
    type: 'uuid',
    required: true
  },
  rating: {
    type: 'rating',
    required: true
  },
  title: {
    type: 'string',
    required: false,
    maxLength: 200,
    sanitize: true
  },
  content: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 5000,
    sanitize: true
  },
  pros: {
    type: 'array',
    required: false,
    itemType: 'string',
    maxItems: 10
  },
  cons: {
    type: 'array',
    required: false,
    itemType: 'string',
    maxItems: 10
  },
  authorName: {
    type: 'string',
    required: false,
    maxLength: 100,
    sanitize: true
  },
  isFeatured: {
    type: 'boolean',
    required: false
  }
}

const reviewUpdateSchema = {
  ...reviewCreateSchema,
  productId: { ...reviewCreateSchema.productId, required: false },
  rating: { ...reviewCreateSchema.rating, required: false },
  content: { ...reviewCreateSchema.content, required: false, minLength: 10 }
}

// ============================================================================
// Bulk Operation Schemas
// ============================================================================

const bulkDeleteSchema = {
  ids: {
    type: 'array',
    required: true,
    itemType: 'uuid',
    maxItems: 100  // Prevent mass deletion abuse
  }
}

const bulkToggleFeaturedSchema = {
  ids: {
    type: 'array',
    required: true,
    itemType: 'uuid',
    maxItems: 100
  },
  isFeatured: {
    type: 'boolean',
    required: true
  }
}

// ============================================================================
// Query Parameter Schemas
// ============================================================================

const paginationSchema = {
  page: {
    type: 'number',
    required: false,
    min: 1,
    max: 10000,
    integer: true
  },
  limit: {
    type: 'number',
    required: false,
    min: 1,
    max: 100,  // Prevent excessive data retrieval
    integer: true
  }
}

const searchSchema = {
  ...paginationSchema,
  search: {
    type: 'string',
    required: false,
    maxLength: 200,
    sanitize: true
  },
  categoryId: {
    type: 'uuid',
    required: false
  },
  isFeatured: {
    type: 'boolean',
    required: false
  },
  isActive: {
    type: 'boolean',
    required: false
  }
}

// ============================================================================
// WebAuthn Schemas
// ============================================================================

const webauthnRegisterOptionsSchema = {
  email: {
    type: 'email',
    required: true
  },
  inviteToken: {
    type: 'string',
    required: false,
    minLength: 1,
    maxLength: 255
  }
}

const webauthnRegisterVerifySchema = {
  email: {
    type: 'email',
    required: true
  },
  credential: {
    type: 'object',  // Complex object, validated separately
    required: true
  },
  deviceName: {
    type: 'string',
    required: false,
    maxLength: 100,
    sanitize: true
  }
}

const webauthnAuthenticateOptionsSchema = {
  email: {
    type: 'email',
    required: true
  }
}

const webauthnAuthenticateVerifySchema = {
  email: {
    type: 'email',
    required: true
  },
  credential: {
    type: 'object',  // Complex object, validated separately
    required: true
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Validation function
  validateSchema,

  // Product schemas
  productCreateSchema,
  productUpdateSchema,

  // Category schemas
  categoryCreateSchema,
  categoryUpdateSchema,

  // Review schemas
  reviewCreateSchema,
  reviewUpdateSchema,

  // Bulk operation schemas
  bulkDeleteSchema,
  bulkToggleFeaturedSchema,

  // Query schemas
  paginationSchema,
  searchSchema,

  // WebAuthn schemas
  webauthnRegisterOptionsSchema,
  webauthnRegisterVerifySchema,
  webauthnAuthenticateOptionsSchema,
  webauthnAuthenticateVerifySchema
}
