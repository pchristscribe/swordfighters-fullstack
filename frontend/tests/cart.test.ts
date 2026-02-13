import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../app/stores/cart'

// Define CartItem interface for the test
interface CartItem {
  productId: string
  title: string
  price: number
  quantity: number
}

// Mock the fetchProduct API call
const mockFetchProduct = vi.fn()
vi.mock('../app/composables/useApi', () => ({
  fetchProduct: (productId: string) => mockFetchProduct(productId),
}))

// Make fetchProduct available globally for the store
global.fetchProduct = mockFetchProduct

describe('useCartStore', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance before each test
    setActivePinia(createPinia())
    // Reset mock
    mockFetchProduct.mockReset()
  })

  describe('Initial State', () => {
    it('should initialize with empty cart', () => {
      const cart = useCartStore()

      expect(cart.items).toEqual([])
      expect(cart.loading).toBe(false)
      expect(cart.totalItems).toBe(0)
      expect(cart.totalPrice).toBe(0)
    })
  })

  describe('Computed Properties', () => {
    it('should calculate totalItems correctly', () => {
      const cart = useCartStore()

      cart.items = [
        { productId: '1', title: 'Product 1', price: 10, quantity: 2 },
        { productId: '2', title: 'Product 2', price: 20, quantity: 3 },
      ]

      expect(cart.totalItems).toBe(5)
    })

    it('should calculate totalPrice correctly', () => {
      const cart = useCartStore()

      cart.items = [
        { productId: '1', title: 'Product 1', price: 10, quantity: 2 },
        { productId: '2', title: 'Product 2', price: 20, quantity: 3 },
      ]

      expect(cart.totalPrice).toBe(80) // (10 * 2) + (20 * 3)
    })

    it('should return 0 for totalItems when cart is empty', () => {
      const cart = useCartStore()

      expect(cart.totalItems).toBe(0)
    })

    it('should return 0 for totalPrice when cart is empty', () => {
      const cart = useCartStore()

      expect(cart.totalPrice).toBe(0)
    })

    it('should handle decimal prices correctly', () => {
      const cart = useCartStore()

      cart.items = [
        { productId: '1', title: 'Product 1', price: 10.99, quantity: 2 },
        { productId: '2', title: 'Product 2', price: 5.50, quantity: 1 },
      ]

      expect(cart.totalPrice).toBe(27.48) // (10.99 * 2) + (5.50 * 1)
    })
  })

  describe('addItem', () => {
    it('should add a new item to the cart', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Test Product',
        price: 29.99,
      })

      await cart.addItem('product-1', 2)

      expect(cart.items).toHaveLength(1)
      expect(cart.items[0]).toEqual({
        productId: 'product-1',
        title: 'Test Product',
        price: 29.99,
        quantity: 2,
      })
      expect(mockFetchProduct).toHaveBeenCalledWith('product-1')
      expect(mockFetchProduct).toHaveBeenCalledTimes(1)
    })

    it('should default quantity to 1 when not provided', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Test Product',
        price: 29.99,
      })

      await cart.addItem('product-1')

      expect(cart.items[0].quantity).toBe(1)
    })

    it('should increment quantity for existing item', async () => {
      const cart = useCartStore()

      // Add initial item
      cart.items = [
        { productId: 'product-1', title: 'Existing Product', price: 19.99, quantity: 2 },
      ]

      // Add same product again
      await cart.addItem('product-1', 3)

      expect(cart.items).toHaveLength(1)
      expect(cart.items[0].quantity).toBe(5) // 2 + 3
      expect(mockFetchProduct).not.toHaveBeenCalled() // Should not fetch for existing item
    })

    it('should set loading to true while fetching product', async () => {
      const cart = useCartStore()

      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetchProduct.mockReturnValue(promise)

      const addPromise = cart.addItem('product-1')

      expect(cart.loading).toBe(true)

      resolvePromise!({ title: 'Test Product', price: 29.99 })
      await addPromise

      expect(cart.loading).toBe(false)
    })

    it('should add multiple different products', async () => {
      const cart = useCartStore()

      mockFetchProduct
        .mockResolvedValueOnce({ title: 'Product 1', price: 10 })
        .mockResolvedValueOnce({ title: 'Product 2', price: 20 })

      await cart.addItem('product-1', 1)
      await cart.addItem('product-2', 2)

      expect(cart.items).toHaveLength(2)
      expect(cart.items[0].productId).toBe('product-1')
      expect(cart.items[1].productId).toBe('product-2')
      expect(mockFetchProduct).toHaveBeenCalledTimes(2)
    })

    it('should handle zero quantity addition', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Test Product',
        price: 29.99,
      })

      await cart.addItem('product-1', 0)

      expect(cart.items[0].quantity).toBe(0)
    })

    it('should handle negative quantity addition', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Test Product',
        price: 29.99,
      })

      await cart.addItem('product-1', -5)

      expect(cart.items[0].quantity).toBe(-5)
    })

    it('should handle API errors gracefully', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockRejectedValue(new Error('API Error'))

      await expect(cart.addItem('product-1')).rejects.toThrow('API Error')

      expect(cart.items).toHaveLength(0)
      expect(cart.loading).toBe(false)
    })
  })

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      const cart = useCartStore()

      cart.items = [
        { productId: '1', title: 'Product 1', price: 10, quantity: 2 },
        { productId: '2', title: 'Product 2', price: 20, quantity: 1 },
      ]

      cart.removeItem('1')

      expect(cart.items).toHaveLength(1)
      expect(cart.items[0].productId).toBe('2')
    })

    it('should handle removing non-existent item', () => {
      const cart = useCartStore()

      cart.items = [
        { productId: '1', title: 'Product 1', price: 10, quantity: 2 },
      ]

      cart.removeItem('non-existent')

      expect(cart.items).toHaveLength(1)
      expect(cart.items[0].productId).toBe('1')
    })

    it('should handle removing from empty cart', () => {
      const cart = useCartStore()

      cart.removeItem('product-1')

      expect(cart.items).toHaveLength(0)
    })

    it('should remove the last item in cart', () => {
      const cart = useCartStore()

      cart.items = [
        { productId: '1', title: 'Product 1', price: 10, quantity: 2 },
      ]

      cart.removeItem('1')

      expect(cart.items).toHaveLength(0)
      expect(cart.totalItems).toBe(0)
      expect(cart.totalPrice).toBe(0)
    })

    it('should remove item from middle of cart', () => {
      const cart = useCartStore()

      cart.items = [
        { productId: '1', title: 'Product 1', price: 10, quantity: 1 },
        { productId: '2', title: 'Product 2', price: 20, quantity: 1 },
        { productId: '3', title: 'Product 3', price: 30, quantity: 1 },
      ]

      cart.removeItem('2')

      expect(cart.items).toHaveLength(2)
      expect(cart.items[0].productId).toBe('1')
      expect(cart.items[1].productId).toBe('3')
    })

    it('should update computed properties after removal', () => {
      const cart = useCartStore()

      cart.items = [
        { productId: '1', title: 'Product 1', price: 10, quantity: 2 },
        { productId: '2', title: 'Product 2', price: 20, quantity: 3 },
      ]

      expect(cart.totalItems).toBe(5)
      expect(cart.totalPrice).toBe(80)

      cart.removeItem('1')

      expect(cart.totalItems).toBe(3)
      expect(cart.totalPrice).toBe(60)
    })
  })

  describe('Edge Cases', () => {
    it('should handle product with zero price', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Free Product',
        price: 0,
      })

      await cart.addItem('free-product', 5)

      expect(cart.totalPrice).toBe(0)
      expect(cart.totalItems).toBe(5)
    })

    it('should handle very large quantities', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Bulk Product',
        price: 1,
      })

      await cart.addItem('bulk-product', 999999)

      expect(cart.totalItems).toBe(999999)
      expect(cart.totalPrice).toBe(999999)
    })

    it('should handle very high prices', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Expensive Product',
        price: 9999999.99,
      })

      await cart.addItem('expensive-product', 1)

      expect(cart.totalPrice).toBe(9999999.99)
    })

    it('should handle empty product ID', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Test Product',
        price: 10,
      })

      await cart.addItem('', 1)

      expect(cart.items[0].productId).toBe('')
    })

    it('should handle concurrent addItem calls', async () => {
      const cart = useCartStore()

      mockFetchProduct
        .mockResolvedValueOnce({ title: 'Product 1', price: 10 })
        .mockResolvedValueOnce({ title: 'Product 2', price: 20 })
        .mockResolvedValueOnce({ title: 'Product 3', price: 30 })

      await Promise.all([
        cart.addItem('product-1', 1),
        cart.addItem('product-2', 2),
        cart.addItem('product-3', 3),
      ])

      expect(cart.items).toHaveLength(3)
      expect(cart.totalItems).toBe(6)
    })

    it('should handle adding then removing the same item', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockResolvedValue({
        title: 'Test Product',
        price: 29.99,
      })

      await cart.addItem('product-1', 2)
      expect(cart.items).toHaveLength(1)

      cart.removeItem('product-1')
      expect(cart.items).toHaveLength(0)
      expect(cart.totalItems).toBe(0)
      expect(cart.totalPrice).toBe(0)
    })

    it('should maintain cart state across multiple operations', async () => {
      const cart = useCartStore()

      mockFetchProduct
        .mockResolvedValueOnce({ title: 'Product 1', price: 10 })
        .mockResolvedValueOnce({ title: 'Product 2', price: 20 })
        .mockResolvedValueOnce({ title: 'Product 1', price: 10 })

      await cart.addItem('product-1', 2)
      await cart.addItem('product-2', 3)
      cart.removeItem('product-1')
      await cart.addItem('product-1', 1)

      expect(cart.items).toHaveLength(2)
      expect(cart.totalItems).toBe(4) // 3 + 1
      expect(cart.totalPrice).toBe(70) // (20 * 3) + (10 * 1)
    })
  })

  describe('Async Behavior', () => {
    it('should set loading to false even if fetch fails', async () => {
      const cart = useCartStore()

      mockFetchProduct.mockRejectedValue(new Error('Network error'))

      try {
        await cart.addItem('product-1')
      } catch (error) {
        // Expected to throw
      }

      expect(cart.loading).toBe(false)
    })

    it('should handle slow API responses', async () => {
      const cart = useCartStore()

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

      mockFetchProduct.mockImplementation(async () => {
        await delay(100)
        return { title: 'Slow Product', price: 15 }
      })

      const startTime = Date.now()
      await cart.addItem('slow-product', 1)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(95)
      expect(cart.items).toHaveLength(1)
      expect(cart.loading).toBe(false)
    })

    it('should handle multiple sequential addItem calls correctly', async () => {
      const cart = useCartStore()

      mockFetchProduct
        .mockResolvedValueOnce({ title: 'Product 1', price: 10 })
        .mockResolvedValueOnce({ title: 'Product 2', price: 20 })

      await cart.addItem('product-1', 1)
      await cart.addItem('product-2', 2)

      expect(cart.items).toHaveLength(2)
      expect(cart.loading).toBe(false)
    })

    it('should not set loading for existing items', async () => {
      const cart = useCartStore()

      cart.items = [
        { productId: 'product-1', title: 'Existing Product', price: 19.99, quantity: 2 },
      ]

      await cart.addItem('product-1', 3)

      expect(cart.loading).toBe(false)
    })
  })
})
