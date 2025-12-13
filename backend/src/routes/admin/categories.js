import { adminAuth } from '../../middleware/adminAuth.js'
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  listCategoriesSchema,
  bulkDeleteCategoriesSchema
} from '../../schemas/category.js'

export default async function adminCategoryRoutes(fastify, options) {
  const { prisma } = fastify;

  // Apply auth middleware to all routes
  fastify.addHook('onRequest', adminAuth);

  // Get all categories
  fastify.get('/', { schema: listCategoriesSchema }, async (request, reply) => {
    const {
      search,
      page = 1,
      limit = 50,
      sortBy = 'name',
      order = 'asc'
    } = request.query

    const skip = (page - 1) * limit
    const where = {}

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          _count: {
            select: { products: true }
          }
        }
      }),
      prisma.category.count({ where })
    ])

    return {
      categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });

  // Get single category
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      reply.code(404);
      return { error: 'Category not found' };
    }

    return category;
  });

  // Create category
  fastify.post('/', { schema: createCategorySchema }, async (request, reply) => {
    try {
      const category = await prisma.category.create({
        data: request.body
      });

      reply.code(201);
      return category;
    } catch (error) {
      if (error.code === 'P2002') {
        reply.code(409);
        return {
          error: 'Conflict',
          message: 'Category with this name or slug already exists'
        };
      }
      throw error;
    }
  });

  // Update category
  fastify.patch('/:id', { schema: updateCategorySchema }, async (request, reply) => {
    const { id } = request.params;

    try {
      const category = await prisma.category.update({
        where: { id },
        data: request.body
      });

      return category;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.code(404);
        return { error: 'Category not found' };
      }
      if (error.code === 'P2002') {
        reply.code(409);
        return {
          error: 'Conflict',
          message: 'Category with this name or slug already exists'
        };
      }
      throw error;
    }
  });

  // Delete category
  fastify.delete('/:id', { schema: deleteCategorySchema }, async (request, reply) => {
    const { id } = request.params;

    try {
      // Check if category has products
      const productsCount = await prisma.product.count({
        where: { categoryId: id }
      });

      if (productsCount > 0) {
        reply.code(409);
        return {
          error: 'Cannot Delete',
          message: `Category has ${productsCount} products. Please reassign or delete them first.`
        };
      }

      await prisma.category.delete({
        where: { id }
      });

      reply.code(204);
      return;
    } catch (error) {
      if (error.code === 'P2025') {
        reply.code(404);
        return { error: 'Category not found' };
      }
      throw error;
    }
  });

  // Bulk delete categories
  fastify.post('/bulk/delete', { schema: bulkDeleteCategoriesSchema }, async (request, reply) => {
    const { categoryIds } = request.body

    // Check for categories with products
    const categoriesWithProducts = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    const cannotDelete = categoriesWithProducts.filter(cat => cat._count.products > 0)

    if (cannotDelete.length > 0) {
      reply.code(409)
      return {
        error: 'Cannot delete categories with products',
        message: `${cannotDelete.length} categories have products and cannot be deleted`,
        categories: cannotDelete.map(cat => ({
          id: cat.id,
          name: cat.name,
          productCount: cat._count.products
        }))
      }
    }

    // Delete all categories that have no products
    const result = await prisma.category.deleteMany({
      where: { id: { in: categoryIds } }
    })

    return {
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} categories`
    }
  })
}
