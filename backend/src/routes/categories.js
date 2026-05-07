function withCountShape(row) {
  const { productCount, ...rest } = row
  return { ...rest, _count: { products: Number(productCount ?? 0) } }
}

export default async function categoryRoutes(fastify, options) {
  const { sql, redis } = fastify;

  // List categories
  fastify.get('/', async (request, reply) => {
    const cached = await redis.get('categories:all');
    if (cached) {
      return JSON.parse(cached);
    }

    const rows = await sql`
      select c.*,
        (select count(*)::int from products p where p.category_id = c.id) as product_count
      from categories c
      order by c.name asc
    `;

    const categories = rows.map(withCountShape);
    await redis.setex('categories:all', 1800, JSON.stringify(categories));

    return categories;
  });

  // Get category by ID or slug
  fastify.get('/:identifier', async (request, reply) => {
    const { identifier } = request.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    const [row] = isUuid
      ? await sql`
          select c.*,
            (select count(*)::int from products p where p.category_id = c.id) as product_count
          from categories c
          where c.id = ${identifier}::uuid
          limit 1
        `
      : await sql`
          select c.*,
            (select count(*)::int from products p where p.category_id = c.id) as product_count
          from categories c
          where c.slug = ${identifier}
          limit 1
        `;

    if (!row) {
      reply.code(404);
      return { error: 'Category not found' };
    }

    const products = await sql`
      select * from products
      where category_id = ${row.id} and status = 'ACTIVE'
      order by created_at desc
      limit 12
    `;

    return {
      ...withCountShape(row),
      products
    };
  });

  // Write operations live in backend/src/routes/admin/categories.js
}
