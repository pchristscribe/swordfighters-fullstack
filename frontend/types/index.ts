export type Platform = 'DHGATE' | 'ALIEXPRESS' | 'AMAZON' | 'WISH'
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
  _count?: {
    products: number
  }
}

export interface Product {
  id: string
  externalId: string
  platform: Platform
  title: string
  description: string
  imageUrl: string
  price: number
  currency: string
  priceUpdatedAt: string
  categoryId: string
  category?: Category
  status: ProductStatus
  rating?: number
  reviewCount: number
  tags: string[]
  metadata?: any
  createdAt: string
  updatedAt: string
  affiliateLinks?: AffiliateLink[]
}

export interface AffiliateLink {
  id: string
  productId: string
  originalUrl: string
  trackedUrl: string
  dubLinkId?: string
  clicks: number
  conversions: number
  revenue: number
  lastClickedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  platform?: Platform
  categoryId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}
