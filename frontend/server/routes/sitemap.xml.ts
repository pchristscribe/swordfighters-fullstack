// Sitemap for search engine crawlers.
// Emits static routes + every ACTIVE product row from Supabase.
//
// Uses the anon key so it respects RLS (inactive/draft products are hidden
// automatically). Cached for 1 hour at the edge.
//
// Season slugs are duplicated from app/utils/seasons.ts to keep the server
// bundle independent of the client one. If you add a season, update both.

const SEASON_SLUGS = ['spring', 'summer', 'pride', 'fall', 'holiday', 'winter'] as const

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function renderSitemap(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts = [`    <loc>${escapeXml(u.loc)}</loc>`]
      if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`)
      if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`)
      if (u.priority !== undefined) parts.push(`    <priority>${u.priority.toFixed(1)}</priority>`)
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = config.public.supabaseKey as string

  const urls: SitemapUrl[] = [
    { loc: `${siteUrl}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${siteUrl}/categories`, changefreq: 'weekly', priority: 0.7 },
    ...SEASON_SLUGS.map((slug) => ({
      loc: `${siteUrl}/seasonal/${slug}`,
      changefreq: 'weekly' as const,
      priority: 0.6,
    })),
  ]

  // Pull product ids from Supabase REST (no SDK in server route to keep
  // the bundle lean).
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await $fetch<Array<{ id: string; updated_at: string }>>(
        `${supabaseUrl}/rest/v1/products`,
        {
          query: {
            select: 'id,updated_at',
            status: 'eq.ACTIVE',
            order: 'updated_at.desc',
            limit: '5000',
          },
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      )
      for (const row of res) {
        urls.push({
          loc: `${siteUrl}/products/${row.id}`,
          lastmod: row.updated_at?.slice(0, 10),
          changefreq: 'weekly',
          priority: 0.8,
        })
      }
    } catch (err) {
      console.error('sitemap.xml: failed to fetch products', err)
    }
  }

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=3600')
  return renderSitemap(urls)
})
