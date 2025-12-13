export default async function categoryRoutes(fastify, options) {
  const { prisma, redis } = fastify;

  // Get all categories
  fastify.get('/', async (request, reply) => {
    // Try cache first
    const cached = await redis.get('categories:all');
    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Cache for 30 minutes
    await redis.setex('categories:all', 1800, JSON.stringify(categories));

    return categories;
  });

  // Get category by ID or slug
  fastify.get('/:identifier', async (request, reply) => {
    const { identifier } = request.params;

    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
        ],
      },
      include: {
        products: {
          where: { status: 'ACTIVE' },
          take: 12,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      reply.code(404);
      return { error: 'Category not found' };
    }

    return category;
  });

  // Write operations (POST, PATCH, DELETE) are only available through admin routes
  // See: backend/src/routes/admin/categories.js for authenticated admin endpoints
}
