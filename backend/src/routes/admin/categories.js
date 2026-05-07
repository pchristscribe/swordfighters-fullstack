import { adminAuth } from '../../middleware/adminAuth.js'
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  listCategoriesSchema,
  bulkDeleteCategoriesSchema
} from '../../schemas/category.js'

// Allowlist for sortBy → DB column mapping. Anything not in this map
// falls back to `name` so the ORDER BY can never be user-controlled SQL.
const SORTABLE = {
  name: 'name',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
}

const CATEGORY_INSERT_FIELDS = ['name', 'slug', 'description', 'imageUrl']
const TO_COLUMN = {
  imageUrl: 'image_url'
}

const toColumn = (key) => TO_COLUMN[key] || key

// Reshape `productCount` (from a subquery) into `_count: { products: N }`
// for API compatibility with the previous Prisma response shape.
function withCountShape(row) {
  const { productCount, ...rest } = row
  return { ...rest, _count: { products: Number(productCount ?? 0) } }
}

export default async function adminCategoryRoutes(fastify, options) {
  const { sql } = fastify

  fastify.addHook('onRequest', adminAuth)

  // List categories
  fastify.get('/', { schema: listCategoriesSchema }, async (request, reply) => {
    const {
      search,
      page = 1,
      limit = 50,
      sortBy = 'name',
      order = 'asc'
    } = request.query

    const skip = (page - 1) * limit
    const sortColumn = SORTABLE[sortBy] || 'name'
    const sortOrder = order === 'desc' ? sql`desc` : sql`asc`
    const searchPattern = search ? `%${search}%` : null

    const whereClause = searchPattern === null
      ? sql`true`
      : sql`(c.name ilike ${searchPattern} or c.description ilike ${searchPattern})`

    const [rows, [{ count }]] = await Promise.all([
      sql`
        select
          c.*,
          (select count(*)::int from products p where p.category_id = c.id) as product_count
        from categories c
        where ${whereClause}
        order by ${sql(sortColumn)} ${sortOrder}
        limit ${parseInt(limit)}
        offset ${skip}
      `,
      sql`select count(*)::int as count from categories c where ${whereClause}`
    ])

    return {
      categories: rows.map(withCountShape),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  })

  // Get single category
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const [row] = await sql`
      select
        c.*,
        (select count(*)::int from products p where p.category_id = c.id) as product_count
      from categories c
      where c.id = ${id}
    `

    if (!row) {
      reply.code(404)
      return { error: 'Category not found' }
    }

    return withCountShape(row)
  })

  // Create category
  fastify.post('/', { schema: createCategorySchema }, async (request, reply) => {
    const data = request.body
    const insertObj = Object.fromEntries(
      CATEGORY_INSERT_FIELDS
        .filter(k => data[k] !== undefined)
        .map(k => [toColumn(k), data[k]])
    )

    try {
      const [category] = await sql`
        insert into categories ${sql(insertObj)}
        returning *
      `
      reply.code(201)
      return category
    } catch (error) {
      if (error.code === '23505') {
        reply.code(409)
        return {
          error: 'Conflict',
          message: 'Category with this name or slug already exists'
        }
      }
      throw error
    }
  })

  // Update category
  fastify.patch('/:id', { schema: updateCategorySchema }, async (request, reply) => {
    const { id } = request.params
    const data = request.body
    const updateObj = Object.fromEntries(
      CATEGORY_INSERT_FIELDS
        .filter(k => data[k] !== undefined)
        .map(k => [toColumn(k), data[k]])
    )

    if (Object.keys(updateObj).length === 0) {
      const [row] = await sql`select * from categories where id = ${id}`
      if (!row) {
        reply.code(404)
        return { error: 'Category not found' }
      }
      return row
    }

    try {
      const [category] = await sql`
        update categories
        set ${sql(updateObj)}
        where id = ${id}
        returning *
      `

      if (!category) {
        reply.code(404)
        return { error: 'Category not found' }
      }

      return category
    } catch (error) {
      if (error.code === '23505') {
        reply.code(409)
        return {
          error: 'Conflict',
          message: 'Category with this name or slug already exists'
        }
      }
      throw error
    }
  })

  // Delete category
  fastify.delete('/:id', { schema: deleteCategorySchema }, async (request, reply) => {
    const { id } = request.params

    const [{ count: productsCount }] = await sql`
      select count(*)::int as count from products where category_id = ${id}
    `

    if (productsCount > 0) {
      reply.code(409)
      return {
        error: 'Cannot Delete',
        message: `Category has ${productsCount} products. Please reassign or delete them first.`
      }
    }

    let result
    try {
      result = await sql`delete from categories where id = ${id}`
    } catch (error) {
      // 23503 = FK violation: a product was inserted between the count check and the delete
      if (error.code === '23503') {
        reply.code(409)
        return { error: 'Cannot Delete', message: 'Category has products. Please reassign or delete them first.' }
      }
      throw error
    }

    if (result.count === 0) {
      reply.code(404)
      return { error: 'Category not found' }
    }

    reply.code(204)
    return
  })

  // Bulk delete categories
  fastify.post('/bulk/delete', { schema: bulkDeleteCategoriesSchema }, async (request, reply) => {
    const { categoryIds } = request.body

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return { success: true, deleted: 0, message: 'Successfully deleted 0 categories' }
    }

    const blocking = await sql`
      select c.id, c.name,
        (select count(*)::int from products p where p.category_id = c.id) as product_count
      from categories c
      where c.id in ${sql(categoryIds)}
    `

    const cannotDelete = blocking.filter(c => c.productCount > 0)

    if (cannotDelete.length > 0) {
      reply.code(409)
      return {
        error: 'Cannot delete categories with products',
        message: `${cannotDelete.length} categories have products and cannot be deleted`,
        categories: cannotDelete.map(cat => ({
          id: cat.id,
          name: cat.name,
          productCount: cat.productCount
        }))
      }
    }

    const result = await sql`
      delete from categories where id in ${sql(categoryIds)}
    `

    return {
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} categories`
    }
  })
}
