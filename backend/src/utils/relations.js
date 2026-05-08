// Enrich a product list with category, affiliateLinks, and review _count in 3 parallel queries.
// Pass latestLinkOnly:true (public catalog) to return only the newest link per product.
export async function attachRelations(sql, products, { latestLinkOnly = false } = {}) {
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
