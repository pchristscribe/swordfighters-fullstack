const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SORTABLE = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  price: 'price',
  rating: 'rating',
  reviewCount: 'review_count',
  title: 'title'
}

async function attachRelations(sql, products, { latestLinkOnly = false } = {}) {
  if (products.length === 0) return products

  const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))]
  const productIds = products.map(p => p.id)

  const linksQuery = latestLinkOnly
    ? sql`
        select distinct on (product_id) *
        from affiliate_links
        where product_id in ${sql(productIds)}
        order by product_id, created_at desc
      `
    : sql`select * from affiliate_links where product_id in ${sql(productIds)}`

  const [categories, links, reviewCounts] = await Promise.all([
    categoryIds.length
      ? sql`select * from categories where id in ${sql(categoryIds)}`
      : Promise.resolve([]),
    linksQuery,
    sql`
      select product_id, count(*)::int as count
      from reviews
      where product_id in ${sql(productIds)}
      group by product_id
    `
  ])

  const catMap = new Map(categories.map(c => [c.id, c]))
  const linksMap = new Map()
  for (const link of links) {
    if (!linksMap.has(link.productId)) linksMap.set(link.productId, [])
    linksMap.get(link.productId).push(link)
  }
  const countMap = new Map(reviewCounts.map(r => [r.productId, r.count]))

  return products.map(p => ({
    ...p,
    category: catMap.get(p.categoryId) || null,
    affiliateLinks: linksMap.get(p.id) || [],
    _count: { reviews: countMap.get(p.id) || 0 }
  }))
}

export default async function productRoutes(fastify, options) {
  const { sql, redis } = fastify

  // List products with filtering and pagination
  fastify.get('/', async (request, reply) => {
    const {
      platform,
      categoryId,
      status = 'ACTIVE',
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc'
    } = request.query

    const skip = (page - 1) * limit
    const sortColumn = SORTABLE[sortBy] || 'created_at'
    const sortOrder = order === 'asc' ? sql`asc` : sql`desc`

    if (categoryId && !UUID_RE.test(categoryId)) {
      reply.code(400)
      return { error: 'Invalid categoryId' }
    }

    const conditions = [sql`status = ${status}`]
    if (platform) conditions.push(sql`platform = ${platform}`)
    if (categoryId) conditions.push(sql`category_id = ${categoryId}`)
    if (minPrice) conditions.push(sql`price >= ${parseFloat(minPrice)}`)
    if (maxPrice) conditions.push(sql`price <= ${parseFloat(maxPrice)}`)

    const whereClause = conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} and ${c}`)

    const cacheKey = `products:list:${JSON.stringify({ platform, categoryId, status, page, limit, minPrice, maxPrice, sortBy, order })}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const [products, [{ count: total }]] = await Promise.all([
      sql`
        select * from products
        where ${whereClause}
        order by ${sql(sortColumn)} ${sortOrder}
        limit ${parseInt(limit)}
        offset ${skip}
      `,
      sql`select count(*)::int as count from products where ${whereClause}`
    ])

    const result = {
      products: await attachRelations(sql, products, { latestLinkOnly: true }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }

    await redis.setex(cacheKey, 300, JSON.stringify(result))

    return result
  })

  // Get single product by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    if (!UUID_RE.test(id)) {
      reply.code(404)
      return { error: 'Product not found' }
    }

    const cached = await redis.get(`product:${id}`)
    if (cached) {
      return JSON.parse(cached)
    }

    const [product] = await sql`select * from products where id = ${id}`

    if (!product) {
      reply.code(404)
      return { error: 'Product not found' }
    }

    const [[category], links, reviews] = await Promise.all([
      product.categoryId
        ? sql`select * from categories where id = ${product.categoryId}`
        : Promise.resolve([null]),
      sql`select * from affiliate_links where product_id = ${id}`,
      sql`select * from reviews where product_id = ${id} order by created_at desc`
    ])

    const result = {
      ...product,
      category: category || null,
      affiliateLinks: links,
      reviews
    }

    await redis.setex(`product:${id}`, 3600, JSON.stringify(result))

    return result
  })

  // Write operations live in backend/src/routes/admin/products.js
}
