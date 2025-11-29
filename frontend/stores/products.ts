import { defineStore } from 'pinia'
import type { Product, ProductFilters, Pagination, Category } from '~/types'

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [] as Product[],
    currentProduct: null as Product | null,
    categories: [] as Category[],
    pagination: null as Pagination | null,
    filters: {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'desc' as 'asc' | 'desc',
    } as ProductFilters,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProducts(filters?: ProductFilters) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        const mergedFilters = { ...this.filters, ...filters }
        const data = await api.getProducts(mergedFilters)

        this.products = data.products
        this.pagination = data.pagination
        this.filters = mergedFilters
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch products'
        console.error('Error fetching products:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchProduct(id: string) {
      this.loading = true
      this.error = null

      try {
        const api = useApi()
        this.currentProduct = await api.getProduct(id)
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch product'
        console.error('Error fetching product:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchCategories() {
      try {
        const api = useApi()
        this.categories = await api.getCategories()
      } catch (err: any) {
        console.error('Error fetching categories:', err)
      }
    },

    setFilters(filters: ProductFilters) {
      this.filters = { ...this.filters, ...filters }
    },

    resetFilters() {
      this.filters = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc',
      }
    },
  },

  getters: {
    getProductById: (state) => (id: string) => {
      return state.products.find((p) => p.id === id)
    },

    hasMore: (state) => {
      if (!state.pagination) return false
      return state.pagination.page < state.pagination.pages
    },

    totalProducts: (state) => state.pagination?.total ?? 0,
  },
})
