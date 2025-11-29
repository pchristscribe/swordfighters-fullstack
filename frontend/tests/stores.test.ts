import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '../stores/products'

// Mock the useApi composable as a global function
const mockUseApi = vi.fn(() => ({
  getProducts: vi.fn().mockResolvedValue({
    products: [
      {
        id: '1',
        title: 'Test Product',
        platform: 'DHGATE',
        price: 29.99,
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      pages: 1,
    }
  }),
  getProduct: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Test Product',
    platform: 'DHGATE',
    price: 29.99,
  }),
  getCategories: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Test Category',
      slug: 'test-category',
    }
  ]),
}))

// Set up global mock
vi.stubGlobal('useApi', mockUseApi)

describe('Product Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with correct default state', () => {
    const store = useProductStore()

    expect(store.products).toEqual([])
    expect(store.currentProduct).toBeNull()
    expect(store.categories).toEqual([])
    expect(store.pagination).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should fetch products', async () => {
    const store = useProductStore()

    await store.fetchProducts()

    expect(store.products).toHaveLength(1)
    expect(store.products[0].title).toBe('Test Product')
    expect(store.pagination).not.toBeNull()
    expect(store.pagination?.total).toBe(1)
  })

  it('should fetch categories', async () => {
    const store = useProductStore()

    await store.fetchCategories()

    expect(store.categories).toHaveLength(1)
    expect(store.categories[0].name).toBe('Test Category')
  })

  it('should update filters', () => {
    const store = useProductStore()

    store.setFilters({ platform: 'DHGATE', page: 2 })

    expect(store.filters.platform).toBe('DHGATE')
    expect(store.filters.page).toBe(2)
  })

  it('should reset filters', () => {
    const store = useProductStore()

    store.setFilters({ platform: 'DHGATE', page: 2 })
    store.resetFilters()

    expect(store.filters.platform).toBeUndefined()
    expect(store.filters.page).toBe(1)
  })
})
