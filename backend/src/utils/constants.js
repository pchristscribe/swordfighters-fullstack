export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const SORTABLE = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  price: 'price',
  rating: 'rating',
  reviewCount: 'review_count',
  title: 'title'
}

// Admin list includes priceUpdatedAt (DB-managed, not API-settable)
export const ADMIN_SORTABLE = {
  ...SORTABLE,
  priceUpdatedAt: 'price_updated_at'
}

// Mirror the platform and product_status Postgres enums
export const VALID_PLATFORMS = ['DHGATE', 'ALIEXPRESS', 'AMAZON', 'WISH']
export const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']
