export default async function productRoutes(fastify, options) {
  const { prisma, redis } = fastify;

  // Get all products with filtering and pagination
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
    } = request.query;

    const skip = (page - 1) * limit;
    const where = { status };

    if (platform) where.platform = platform;
    if (categoryId) where.categoryId = categoryId;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Create a cache key from the query parameters
    const cacheKey = `products:list:${JSON.stringify(request.query)}`;

    // Check if we have cached results
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached); // Return cached data immediately
    }

    // If no cache, fetch from database
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          category: true,
          affiliateLinks: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { reviews: true }
          }
        },
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache the result for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  });

  // Get single product by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;

    // Try cache first
    const cached = await redis.get(`product:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        affiliateLinks: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      reply.code(404);
      return { error: 'Product not found' };
    }

    // Cache for 1 hour
    await redis.setex(`product:${id}`, 3600, JSON.stringify(product));

    return product;
  });

  // Write operations (POST, PATCH, DELETE) are only available through admin routes
  // See: backend/src/routes/admin/products.js for authenticated admin endpoints
}
