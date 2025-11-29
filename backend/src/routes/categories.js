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

  // Create category
  fastify.post('/', async (request, reply) => {
    const category = await prisma.category.create({
      data: request.body,
    });

    // Invalidate cache
    await redis.del('categories:all');

    reply.code(201);
    return category;
  });

  // Update category
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params;

    const category = await prisma.category.update({
      where: { id },
      data: request.body,
    });

    // Invalidate cache
    await redis.del('categories:all');

    return category;
  });

  // Delete category
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;

    await prisma.category.delete({
      where: { id },
    });

    // Invalidate cache
    await redis.del('categories:all');

    reply.code(204);
    return;
  });
}
