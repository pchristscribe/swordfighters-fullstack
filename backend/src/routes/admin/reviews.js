import { adminAuth } from '../../middleware/adminAuth.js'
import {
  createReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
  listReviewsSchema,
  bulkDeleteReviewsSchema,
  bulkToggleFeaturedSchema
} from '../../schemas/review.js'

export default async function adminReviewRoutes(fastify, options) {
  const { prisma } = fastify;

  // Apply auth middleware to all routes
  fastify.addHook('onRequest', adminAuth);

  // Get all reviews
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
    const where = {}

    // Filter by product
    if (productId) where.productId = productId

    // Filter by featured status
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true'

    // Filter by rating
    if (rating) where.rating = parseInt(rating)

    // Search functionality
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true
            }
          }
        }
      }),
      prisma.review.count({ where })
    ])

    return {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });

  // Get single review
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: true
      }
    });

    if (!review) {
      reply.code(404);
      return { error: 'Review not found' };
    }

    return review;
  });

  // Create review
  fastify.post('/', { schema: createReviewSchema }, async (request, reply) => {
    try {
      const review = await prisma.review.create({
        data: request.body,
        include: {
          product: true
        }
      });

      reply.code(201);
      return review;
    } catch (error) {
      if (error.code === 'P2003') {
        reply.code(404);
        return { error: 'Product not found' };
      }
      throw error;
    }
  });

  // Update review
  fastify.patch('/:id', { schema: updateReviewSchema }, async (request, reply) => {
    const { id } = request.params;

    try {
      const review = await prisma.review.update({
        where: { id },
        data: request.body,
        include: {
          product: true
        }
      });

      return review;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.code(404);
        return { error: 'Review not found' };
      }
      throw error;
    }
  });

  // Delete review
  fastify.delete('/:id', { schema: deleteReviewSchema }, async (request, reply) => {
    const { id } = request.params;

    try {
      await prisma.review.delete({
        where: { id }
      });

      reply.code(204);
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.code(404);
        return { error: 'Review not found' };
      }
      throw error;
    }
  });

  // Toggle featured status
  fastify.post('/:id/toggle-featured', async (request, reply) => {
    const { id } = request.params;

    try {
      const review = await prisma.review.findUnique({
        where: { id },
        select: { isFeatured: true }
      });

      if (!review) {
        reply.code(404);
        return { error: 'Review not found' };
      }

      const updated = await prisma.review.update({
        where: { id },
        data: { isFeatured: !review.isFeatured },
        include: {
          product: true
        }
      });

      return updated;
    } catch (error) {
      throw error;
    }
  });

  // Bulk delete reviews
  fastify.post('/bulk/delete', { schema: bulkDeleteReviewsSchema }, async (request, reply) => {
    const { reviewIds } = request.body

    const result = await prisma.review.deleteMany({
      where: { id: { in: reviewIds } }
    })

    return {
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} reviews`
    }
  })

  // Bulk toggle featured status
  fastify.post('/bulk/toggle-featured', { schema: bulkToggleFeaturedSchema }, async (request, reply) => {
    const { reviewIds, isFeatured } = request.body

    const result = await prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: { isFeatured }
    })

    return {
      success: true,
      updated: result.count,
      isFeatured,
      message: `Successfully updated ${result.count} reviews`
    }
  })
}
