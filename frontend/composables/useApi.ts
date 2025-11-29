export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const apiFetch = async <T>(endpoint: string, options: any = {}): Promise<T> => {
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
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  return {
    // Products
    getProducts: (params?: Record<string, any>) =>
      apiFetch<{ products: any[]; pagination: any }>('/products', { params }),

    getProduct: (id: string) =>
      apiFetch<any>(`/products/${id}`),

    // Categories
    getCategories: () =>
      apiFetch<any[]>('/categories'),

    getCategory: (identifier: string) =>
      apiFetch<any>(`/categories/${identifier}`),
  }
}
