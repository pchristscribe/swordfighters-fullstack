import { adminAuth } from '../../middleware/adminAuth.js'
import {
  createReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
  listReviewsSchema,
  bulkDeleteReviewsSchema,
  bulkToggleFeaturedSchema
} from '../../schemas/review.js'

const SORTABLE = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  rating: 'rating'
}

const REVIEW_FIELDS = ['productId', 'rating', 'title', 'content', 'pros', 'cons', 'authorName', 'isFeatured']

const TO_COLUMN = {
  productId: 'product_id',
  authorName: 'author_name',
  isFeatured: 'is_featured'
}

const toColumn = (key) => TO_COLUMN[key] || key

async function attachProducts(sql, reviews) {
  if (reviews.length === 0) return reviews
  const ids = [...new Set(reviews.map(r => r.productId))]
  const products = await sql`
    select id, title, image_url from products where id in ${sql(ids)}
  `
  const map = new Map(products.map(p => [p.id, p]))
  return reviews.map(r => ({ ...r, product: map.get(r.productId) || null }))
}

export default async function adminReviewRoutes(fastify, options) {
  const { sql } = fastify

  fastify.addHook('onRequest', adminAuth)

  // List reviews
  fastify.get('/', { schema: listReviewsSchema }, async (request, reply) => {
    const {
      productId,
      isFeatured,
      rating,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = request.query

    const skip = (page - 1) * limit
    const sortColumn = SORTABLE[sortBy] || 'created_at'
    const sortOrder = order === 'asc' ? sql`asc` : sql`desc`
    const searchPattern = search ? `%${search}%` : null

    const conditions = []
    if (productId) conditions.push(sql`product_id = ${productId}`)
    if (isFeatured !== undefined) conditions.push(sql`is_featured = ${isFeatured === 'true'}`)
    if (rating) conditions.push(sql`rating = ${parseInt(rating)}`)
    if (searchPattern) {
      conditions.push(sql`(
        content ilike ${searchPattern}
        or title ilike ${searchPattern}
        or author_name ilike ${searchPattern}
      )`)
    }

    const whereClause = conditions.length === 0
      ? sql`true`
      : conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} and ${c}`)

    const reviews = await sql`
      select * from reviews
      where ${whereClause}
      order by ${sql(sortColumn)} ${sortOrder}
      limit ${parseInt(limit)}
      offset ${skip}
    `

    const [{ count: total }] = await sql`
      select count(*)::int as count from reviews where ${whereClause}
    `

    return {
      reviews: await attachProducts(sql, reviews),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })

  // Get single review
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const [review] = await sql`select * from reviews where id = ${id}`
    if (!review) {
      reply.code(404)
      return { error: 'Review not found' }
    }

    const [product] = await sql`select * from products where id = ${review.productId}`
    return { ...review, product: product || null }
  })

  // Create review
  fastify.post('/', { schema: createReviewSchema }, async (request, reply) => {
    const data = request.body
    const insertObj = Object.fromEntries(
      REVIEW_FIELDS
        .filter(k => data[k] !== undefined)
        .map(k => [toColumn(k), data[k]])
    )

    try {
      const [review] = await sql`
        insert into reviews ${sql(insertObj)}
        returning *
      `
      const [product] = await sql`select * from products where id = ${review.productId}`

      reply.code(201)
      return { ...review, product: product || null }
    } catch (error) {
      if (error.code === '23503') {
        reply.code(404)
        return { error: 'Product not found' }
      }
      throw error
    }
  })

  // Update review
  fastify.patch('/:id', { schema: updateReviewSchema }, async (request, reply) => {
    const { id } = request.params
    const data = request.body
    const updateObj = Object.fromEntries(
      REVIEW_FIELDS
        .filter(k => data[k] !== undefined)
        .map(k => [toColumn(k), data[k]])
    )

    if (Object.keys(updateObj).length === 0) {
      const [review] = await sql`select * from reviews where id = ${id}`
      if (!review) {
        reply.code(404)
        return { error: 'Review not found' }
      }
      const [product] = await sql`select * from products where id = ${review.productId}`
      return { ...review, product: product || null }
    }

    const [review] = await sql`
      update reviews
      set ${sql(updateObj)}
      where id = ${id}
      returning *
    `

    if (!review) {
      reply.code(404)
      return { error: 'Review not found' }
    }

    const [product] = await sql`select * from products where id = ${review.productId}`
    return { ...review, product: product || null }
  })

  // Delete review
  fastify.delete('/:id', { schema: deleteReviewSchema }, async (request, reply) => {
    const { id } = request.params

    const result = await sql`delete from reviews where id = ${id}`
    if (result.count === 0) {
      reply.code(404)
      return { error: 'Review not found' }
    }

    reply.code(204)
    return
  })

  // Toggle featured
  fastify.post('/:id/toggle-featured', async (request, reply) => {
    const { id } = request.params

    const [updated] = await sql`
      update reviews
      set is_featured = not is_featured
      where id = ${id}
      returning *
    `

    if (!updated) {
      reply.code(404)
      return { error: 'Review not found' }
    }

    const [product] = await sql`select * from products where id = ${updated.productId}`
    return { ...updated, product: product || null }
  })

  // Bulk delete
  fastify.post('/bulk/delete', { schema: bulkDeleteReviewsSchema }, async (request, reply) => {
    const { reviewIds } = request.body

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return { success: true, deleted: 0, message: 'Successfully deleted 0 reviews' }
    }

    const result = await sql`delete from reviews where id in ${sql(reviewIds)}`

    return {
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} reviews`
    }
  })

  // Bulk toggle featured
  fastify.post('/bulk/toggle-featured', { schema: bulkToggleFeaturedSchema }, async (request, reply) => {
    const { reviewIds, isFeatured } = request.body

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return {
        success: true,
        updated: 0,
        isFeatured,
        message: 'Successfully updated 0 reviews'
      }
    }

    const result = await sql`
      update reviews set is_featured = ${isFeatured}
      where id in ${sql(reviewIds)}
    `

    return {
      success: true,
      updated: result.count,
      isFeatured,
      message: `Successfully updated ${result.count} reviews`
    }
  })
}
