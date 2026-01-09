import type { Product, Category, Pagination } from '~/types'

interface FetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, unknown>
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const apiFetch = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    const url = `${apiBase}/api${endpoint}`

    try {
      const data = await $fetch<T>(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      return data
    } catch (error: unknown) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  return {
    // Products
    getProducts: (params?: Record<string, unknown>) =>
      apiFetch<{ products: Product[]; pagination: Pagination }>('/products', { params }),

    getProduct: (id: string) =>
      apiFetch<Product>(`/products/${id}`),

    // Categories
    getCategories: () =>
      apiFetch<Category[]>('/categories'),

    getCategory: (identifier: string) =>
      apiFetch<Category>(`/categories/${identifier}`),
  }
}
