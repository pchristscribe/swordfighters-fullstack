import { adminAuth } from '../../middleware/adminAuth.js';

const SORTABLE = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  price: 'price',
  rating: 'rating',
  reviewCount: 'review_count',
  title: 'title',
  priceUpdatedAt: 'price_updated_at'
};

const PRODUCT_FIELDS = [
  'externalId', 'platform', 'title', 'description', 'imageUrl', 'price',
  'currency', 'status', 'categoryId', 'rating', 'reviewCount', 'tags', 'metadata'
];

const TO_COLUMN = {
  externalId: 'external_id',
  imageUrl: 'image_url',
  categoryId: 'category_id',
  reviewCount: 'review_count'
};

const toColumn = (key) => TO_COLUMN[key] || key;

async function attachRelations(sql, products) {
  if (products.length === 0) return products;

  const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];
  const productIds = products.map(p => p.id);

  const [categories, links, reviewCounts] = await Promise.all([
    categoryIds.length
      ? sql`select * from categories where id in ${sql(categoryIds)}`
      : Promise.resolve([]),
    sql`select * from affiliate_links where product_id in ${sql(productIds)}`,
    sql`
      select product_id, count(*)::int as count
      from reviews
      where product_id in ${sql(productIds)}
      group by product_id
    `
  ]);

  const catMap = new Map(categories.map(c => [c.id, c]));
  const linksMap = new Map();
  for (const link of links) {
    if (!linksMap.has(link.productId)) linksMap.set(link.productId, []);
    linksMap.get(link.productId).push(link);
  }
  const countMap = new Map(reviewCounts.map(r => [r.productId, r.count]));

  return products.map(p => ({
    ...p,
    category: catMap.get(p.categoryId) || null,
    affiliateLinks: linksMap.get(p.id) || [],
    _count: { reviews: countMap.get(p.id) || 0 }
  }));
}

async function loadProductFull(sql, id) {
  const [product] = await sql`select * from products where id = ${id}`;
  if (!product) return null;

  const [[category], links, reviews] = await Promise.all([
    product.categoryId
      ? sql`select * from categories where id = ${product.categoryId}`
      : Promise.resolve([null]),
    sql`select * from affiliate_links where product_id = ${id}`,
    sql`select * from reviews where product_id = ${id} order by created_at desc`
  ]);

  return {
    ...product,
    category: category || null,
    affiliateLinks: links,
    reviews
  };
}

export default async function adminProductRoutes(fastify, options) {
  const { sql, redis } = fastify;

  fastify.addHook('onRequest', adminAuth);

  // List products
  fastify.get('/', async (request, reply) => {
    const {
      platform,
      categoryId,
      status,
      page = 1,
      limit = 50,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = request.query;

    const skip = (page - 1) * limit;
    const sortColumn = SORTABLE[sortBy] || 'created_at';
    const sortOrder = order === 'asc' ? sql`asc` : sql`desc`;
    const searchPattern = search ? `%${search}%` : null;

    const conditions = [];
    if (platform) conditions.push(sql`platform = ${platform}`);
    if (categoryId) conditions.push(sql`category_id = ${categoryId}`);
    if (status) conditions.push(sql`status = ${status}`);
    if (searchPattern) {
      conditions.push(sql`(
        title ilike ${searchPattern}
        or description ilike ${searchPattern}
        or external_id ilike ${searchPattern}
      )`);
    }

    const whereClause = conditions.length === 0
      ? sql`true`
      : conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} and ${c}`);

    const products = await sql`
      select * from products
      where ${whereClause}
      order by ${sql(sortColumn)} ${sortOrder}
      limit ${parseInt(limit)}
      offset ${skip}
    `;

    const [{ count: total }] = await sql`
      select count(*)::int as count from products where ${whereClause}
    `;

    return {
      products: await attachRelations(sql, products),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  });

  // Get single product
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const product = await loadProductFull(sql, id);
    if (!product) {
      reply.code(404);
      return { error: 'Product not found' };
    }
    return product;
  });

  // Create product
  fastify.post('/', async (request, reply) => {
    const data = request.body;
    const insertObj = Object.fromEntries(
      PRODUCT_FIELDS
        .filter(k => data[k] !== undefined)
        .map(k => [toColumn(k), data[k]])
    );

    try {
      const [created] = await sql`
        insert into products ${sql(insertObj)}
        returning *
      `;

      const [[category]] = await Promise.all([
        created.categoryId
          ? sql`select * from categories where id = ${created.categoryId}`
          : Promise.resolve([null])
      ]);

      await redis.del('products:list:*');

      reply.code(201);
      return { ...created, category: category || null };
    } catch (error) {
      if (error.code === '23505') {
        reply.code(409);
        return {
          error: 'Conflict',
          message: 'Product with this platform and external ID already exists'
        };
      }
      throw error;
    }
  });

  // Update product
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params;
    const data = request.body;
    const updateObj = Object.fromEntries(
      PRODUCT_FIELDS
        .filter(k => data[k] !== undefined)
        .map(k => [toColumn(k), data[k]])
    );

    if (Object.keys(updateObj).length === 0) {
      const product = await loadProductFull(sql, id);
      if (!product) {
        reply.code(404);
        return { error: 'Product not found' };
      }
      return product;
    }

    const [updated] = await sql`
      update products
      set ${sql(updateObj)}
      where id = ${id}
      returning *
    `;

    if (!updated) {
      reply.code(404);
      return { error: 'Product not found' };
    }

    const [[category], links] = await Promise.all([
      updated.categoryId
        ? sql`select * from categories where id = ${updated.categoryId}`
        : Promise.resolve([null]),
      sql`select * from affiliate_links where product_id = ${id}`
    ]);

    await redis.del(`product:${id}`);
    await redis.del('products:list:*');

    return {
      ...updated,
      category: category || null,
      affiliateLinks: links
    };
  });

  // Delete product
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;

    const result = await sql`delete from products where id = ${id}`;

    if (result.count === 0) {
      reply.code(404);
      return { error: 'Product not found' };
    }

    await redis.del(`product:${id}`);
    await redis.del('products:list:*');

    reply.code(204);
    return;
  });

  // Bulk update status
  fastify.post('/bulk/status', async (request, reply) => {
    const { productIds, status } = request.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      reply.code(400);
      return { error: 'productIds array is required' };
    }

    if (!['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'].includes(status)) {
      reply.code(400);
      return { error: 'Invalid status value' };
    }

    const result = await sql`
      update products
      set status = ${status}
      where id in ${sql(productIds)}
    `;

    await redis.del('products:list:*');
    for (const id of productIds) {
      await redis.del(`product:${id}`);
    }

    return {
      success: true,
      updated: result.count
    };
  });

  // Bulk delete
  fastify.post('/bulk/delete', async (request, reply) => {
    const { productIds } = request.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      reply.code(400);
      return { error: 'productIds array is required' };
    }

    const result = await sql`
      delete from products where id in ${sql(productIds)}
    `;

    await redis.del('products:list:*');
    for (const id of productIds) {
      await redis.del(`product:${id}`);
    }

    return {
      success: true,
      deleted: result.count
    };
  });

  // Dashboard stats
  fastify.get('/stats/dashboard', async (request, reply) => {
    const [
      [{ count: totalProducts }],
      [{ count: activeProducts }],
      [{ count: outOfStock }],
      [{ count: totalCategories }],
      [{ count: totalReviews }],
      recentProducts
    ] = await Promise.all([
      sql`select count(*)::int as count from products`,
      sql`select count(*)::int as count from products where status = 'ACTIVE'`,
      sql`select count(*)::int as count from products where status = 'OUT_OF_STOCK'`,
      sql`select count(*)::int as count from categories`,
      sql`select count(*)::int as count from reviews`,
      sql`select * from products order by created_at desc limit 5`
    ]);

    return {
      stats: {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        outOfStock,
        totalCategories,
        totalReviews
      },
      recentProducts: await attachRelations(sql, recentProducts)
    };
  });
}
