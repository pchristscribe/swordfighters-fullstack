/**
 * JSON Schema validation for Category endpoints
 * Following WebAuthn route pattern for defense-in-depth security
 */

// Slug validation pattern: lowercase alphanumeric and hyphens only
const SLUG_PATTERN = '^[a-z0-9-]+$'

// URL validation pattern: must start with http:// or https://
const URL_PATTERN = '^https?://.+'

/**
 * Schema for creating a new category
 * POST /api/admin/categories
 */
export const createCategorySchema = {
  body: {
    type: 'object',
    required: ['name', 'slug'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Category display name'
      },
      slug: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: SLUG_PATTERN,
        description: 'URL-friendly identifier (lowercase, alphanumeric, hyphens only)'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Category description (optional)'
      },
      imageUrl: {
        type: 'string',
        maxLength: 2048,
        pattern: URL_PATTERN,
        description: 'Category image URL (must start with http:// or https://)'
      }
    },
    additionalProperties: false
  }
}

/**
 * Schema for updating an existing category
 * PATCH /api/admin/categories/:id
 */
export const updateCategorySchema = {
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Category display name'
      },
      slug: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: SLUG_PATTERN,
        description: 'URL-friendly identifier (lowercase, alphanumeric, hyphens only)'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Category description'
      },
      imageUrl: {
        type: 'string',
        maxLength: 2048,
        pattern: URL_PATTERN,
        description: 'Category image URL (must start with http:// or https://)'
      }
    },
    additionalProperties: false,
    minProperties: 1 // At least one field must be provided for update
  },
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        minLength: 1,
        description: 'Category ID'
      }
    }
  }
}

/**
 * Schema for deleting a single category
 * DELETE /api/admin/categories/:id
 */
export const deleteCategorySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        minLength: 1,
        description: 'Category ID'
      }
    }
  }
}

/**
 * Schema for bulk deleting categories
 * POST /api/admin/categories/bulk/delete
 */
export const bulkDeleteCategoriesSchema = {
  body: {
    type: 'object',
    required: ['categoryIds'],
    properties: {
      categoryIds: {
        type: 'array',
        minItems: 1,
        maxItems: 100, // Prevent DoS via extremely large arrays
        items: {
          type: 'string',
          minLength: 1
        },
        description: 'Array of category IDs to delete'
      }
    },
    additionalProperties: false
  }
}

/**
 * Schema for listing categories with pagination
 * GET /api/admin/categories
 */
export const listCategoriesSchema = {
  querystring: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        maxLength: 200,
        description: 'Search term for name/description'
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 50,
        description: 'Items per page'
      },
      sortBy: {
        type: 'string',
        enum: ['name', 'createdAt', 'updatedAt'],
        default: 'name',
        description: 'Field to sort by'
      },
      order: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'asc',
        description: 'Sort order'
      }
    }
  }
}
