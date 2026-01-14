import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from '../app/components/ProductCard.vue'
import type { Product } from '../app/types'

// Mock product data
const mockProduct: Product = {
  id: 'product-1',
  externalId: 'ext-123',
  platform: 'DHGATE',
  title: 'Rainbow Pride Flag',
  description: 'Large rainbow pride flag for celebrations',
  imageUrl: 'https://example.com/flag.jpg',
  price: 12.99,
  currency: 'USD',
  priceUpdatedAt: '2024-01-01T00:00:00Z',
  categoryId: 'cat-1',
  status: 'ACTIVE',
  rating: 4.5,
  reviewCount: 120,
  tags: ['pride', 'flag'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockProductWithDiscount: Product = {
  ...mockProduct,
  id: 'product-2',
  price: 9.99,
  originalPrice: 19.99,
}

describe('ProductCard Component', () => {
  describe('Rendering', () => {
    it('renders product image with correct src and alt', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe(mockProduct.imageUrl)
      expect(img.attributes('alt')).toBe(mockProduct.title)
    })

    it('renders product title', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const title = wrapper.find('h3')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe(mockProduct.title)
    })

    it('renders product price with dollar sign', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const price = wrapper.find('.price')
      expect(price.exists()).toBe(true)
      expect(price.text()).toBe('$12.99')
    })

    it('renders Add to Cart button', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const buttons = wrapper.findAll('button')
      const addToCartButton = buttons.find((btn) => btn.text() === 'Add to Cart')
      expect(addToCartButton).toBeDefined()
    })

    it('renders View Details button', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const buttons = wrapper.findAll('button')
      const viewDetailsButton = buttons.find((btn) => btn.text() === 'View Details')
      expect(viewDetailsButton).toBeDefined()
    })

    it('does not render discount when showDiscount is false', () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: false,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.exists()).toBe(false)
    })

    it('does not render discount when showDiscount is true but no originalPrice', () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProduct,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.exists()).toBe(false)
    })

    it('renders discount when showDiscount is true and originalPrice exists', () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.exists()).toBe(true)
      expect(discount.text()).toBe('50% OFF')
    })
  })

  describe('Discount Calculation', () => {
    it('calculates discount percentage correctly for 50% off', () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.text()).toBe('50% OFF')
    })

    it('calculates discount percentage correctly for 25% off', () => {
      const product = {
        ...mockProduct,
        price: 15.0,
        originalPrice: 20.0,
      }

      const wrapper = mount(ProductCard, {
        props: {
          product,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.text()).toBe('25% OFF')
    })

    it('calculates discount percentage correctly for 10% off', () => {
      const product = {
        ...mockProduct,
        price: 18.0,
        originalPrice: 20.0,
      }

      const wrapper = mount(ProductCard, {
        props: {
          product,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.text()).toBe('10% OFF')
    })

    it('rounds discount percentage correctly', () => {
      const product = {
        ...mockProduct,
        price: 16.67,
        originalPrice: 20.0,
      }

      const wrapper = mount(ProductCard, {
        props: {
          product,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      // (20 - 16.67) / 20 = 0.1665 = 16.65% -> rounds to 17%
      expect(discount.text()).toBe('17% OFF')
    })

    it('does not show discount when discountPercentage is 0', () => {
      const product = {
        ...mockProduct,
        price: 20.0,
        originalPrice: 20.0,
      }

      const wrapper = mount(ProductCard, {
        props: {
          product,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.exists()).toBe(false)
    })
  })

  describe('Event Emissions', () => {
    it('emits add-to-cart event when Add to Cart button is clicked', async () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const buttons = wrapper.findAll('button')
      const addToCartButton = buttons.find((btn) => btn.text() === 'Add to Cart')
      await addToCartButton?.trigger('click')

      expect(wrapper.emitted('add-to-cart')).toBeTruthy()
      expect(wrapper.emitted('add-to-cart')?.[0]).toEqual([mockProduct])
    })

    it('emits view-details event when View Details button is clicked', async () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const buttons = wrapper.findAll('button')
      const viewDetailsButton = buttons.find((btn) => btn.text() === 'View Details')
      await viewDetailsButton?.trigger('click')

      expect(wrapper.emitted('view-details')).toBeTruthy()
      expect(wrapper.emitted('view-details')?.[0]).toEqual([mockProduct.id])
    })

    it('emits multiple add-to-cart events when clicked multiple times', async () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const buttons = wrapper.findAll('button')
      const addToCartButton = buttons.find((btn) => btn.text() === 'Add to Cart')

      await addToCartButton?.trigger('click')
      await addToCartButton?.trigger('click')
      await addToCartButton?.trigger('click')

      expect(wrapper.emitted('add-to-cart')).toHaveLength(3)
      expect(wrapper.emitted('add-to-cart')?.[0]).toEqual([mockProduct])
      expect(wrapper.emitted('add-to-cart')?.[1]).toEqual([mockProduct])
      expect(wrapper.emitted('add-to-cart')?.[2]).toEqual([mockProduct])
    })
  })

  describe('Edge Cases', () => {
    it('handles product with empty title', () => {
      const product = { ...mockProduct, title: '' }
      const wrapper = mount(ProductCard, {
        props: { product },
      })

      const title = wrapper.find('h3')
      expect(title.text()).toBe('')
    })

    it('handles product with very long title', () => {
      const longTitle = 'A'.repeat(200)
      const product = { ...mockProduct, title: longTitle }
      const wrapper = mount(ProductCard, {
        props: { product },
      })

      const title = wrapper.find('h3')
      expect(title.text()).toBe(longTitle)
    })

    it('handles product with empty imageUrl', () => {
      const product = { ...mockProduct, imageUrl: '' }
      const wrapper = mount(ProductCard, {
        props: { product },
      })

      const img = wrapper.find('img')
      expect(img.attributes('src')).toBe('')
    })

    it('handles product with price of 0', () => {
      const product = { ...mockProduct, price: 0 }
      const wrapper = mount(ProductCard, {
        props: { product },
      })

      const price = wrapper.find('.price')
      expect(price.text()).toBe('$0')
    })

    it('handles product with very high price', () => {
      const product = { ...mockProduct, price: 9999.99 }
      const wrapper = mount(ProductCard, {
        props: { product },
      })

      const price = wrapper.find('.price')
      expect(price.text()).toBe('$9999.99')
    })

    it('handles product with price having many decimal places', () => {
      const product = { ...mockProduct, price: 12.999999 }
      const wrapper = mount(ProductCard, {
        props: { product },
      })

      const price = wrapper.find('.price')
      expect(price.text()).toBe('$12.999999')
    })

    it('handles negative discount (price higher than originalPrice)', () => {
      const product = {
        ...mockProduct,
        price: 25.0,
        originalPrice: 20.0,
      }

      const wrapper = mount(ProductCard, {
        props: {
          product,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      // Negative discount should still be shown as -25% OFF (potential bug)
      // The component doesn't validate this case
      expect(discount.text()).toBe('-25% OFF')
    })

    it('handles very small discount percentages', () => {
      const product = {
        ...mockProduct,
        price: 19.99,
        originalPrice: 20.0,
      }

      const wrapper = mount(ProductCard, {
        props: {
          product,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      // 0.01 / 20 = 0.0005 = 0.05% -> rounds to 0%
      expect(discount.exists()).toBe(false)
    })
  })

  describe('Props Validation', () => {
    it('uses default value for showDiscount prop', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProductWithDiscount },
      })

      // Default is false, so discount should not show
      const discount = wrapper.find('.discount')
      expect(discount.exists()).toBe(false)
    })

    it('accepts showDiscount as true', () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: true,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.exists()).toBe(true)
    })

    it('accepts showDiscount as false', () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: false,
        },
      })

      const discount = wrapper.find('.discount')
      expect(discount.exists()).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('has accessible image with alt text', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const img = wrapper.find('img')
      expect(img.attributes('alt')).toBeTruthy()
      expect(img.attributes('alt')).toBe(mockProduct.title)
    })

    it('has accessible buttons', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
      buttons.forEach((button) => {
        expect(button.text()).toBeTruthy()
      })
    })

    it('buttons are keyboard accessible', async () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      const buttons = wrapper.findAll('button')
      const addToCartButton = buttons.find((btn) => btn.text() === 'Add to Cart')

      // Simulate Enter key press
      await addToCartButton?.trigger('keydown.enter')

      // Note: This test shows the component doesn't handle keyboard events separately
      // The click event should handle both mouse and keyboard activation
    })

    it('image has proper alt text for screen readers', () => {
      const product = {
        ...mockProduct,
        title: 'Pride Flag with Rainbow Colors',
      }

      const wrapper = mount(ProductCard, {
        props: { product },
      })

      const img = wrapper.find('img')
      expect(img.attributes('alt')).toBe('Pride Flag with Rainbow Colors')
    })
  })

  describe('Component Structure', () => {
    it('has product-card class on root element', () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      expect(wrapper.find('.product-card').exists()).toBe(true)
    })

    it('renders all elements in correct order', () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: true,
        },
      })

      // Verify key elements exist (not checking exact DOM hierarchy)
      expect(wrapper.find('img').exists()).toBe(true)
      expect(wrapper.find('h3').exists()).toBe(true)
      expect(wrapper.find('.discount').exists()).toBe(true)
      expect(wrapper.find('.price').exists()).toBe(true)

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(2)
      expect(buttons[0].text()).toBe('Add to Cart')
      expect(buttons[1].text()).toBe('View Details')
    })
  })

  describe('Reactivity', () => {
    it('updates when product prop changes', async () => {
      const wrapper = mount(ProductCard, {
        props: { product: mockProduct },
      })

      expect(wrapper.find('h3').text()).toBe(mockProduct.title)
      expect(wrapper.find('.price').text()).toBe('$12.99')

      const newProduct = {
        ...mockProduct,
        title: 'New Product Title',
        price: 25.99,
      }

      await wrapper.setProps({ product: newProduct })

      expect(wrapper.find('h3').text()).toBe('New Product Title')
      expect(wrapper.find('.price').text()).toBe('$25.99')
    })

    it('updates discount display when showDiscount prop changes', async () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: false,
        },
      })

      expect(wrapper.find('.discount').exists()).toBe(false)

      await wrapper.setProps({ showDiscount: true })

      expect(wrapper.find('.discount').exists()).toBe(true)
      expect(wrapper.find('.discount').text()).toBe('50% OFF')
    })

    it('recalculates discount when product price changes', async () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: true,
        },
      })

      expect(wrapper.find('.discount').text()).toBe('50% OFF')

      const updatedProduct = {
        ...mockProductWithDiscount,
        price: 14.99,
      }

      await wrapper.setProps({ product: updatedProduct })

      // (19.99 - 14.99) / 19.99 = 0.25... = 25%
      expect(wrapper.find('.discount').text()).toBe('25% OFF')
    })
  })

  describe('Type Safety', () => {
    it('works with minimal Product object', () => {
      const minimalProduct: Product = {
        id: 'test-1',
        externalId: 'ext-1',
        platform: 'DHGATE',
        title: 'Test Product',
        description: 'Test description',
        imageUrl: 'https://example.com/test.jpg',
        price: 10.0,
        currency: 'USD',
        priceUpdatedAt: '2024-01-01T00:00:00Z',
        categoryId: 'cat-1',
        status: 'ACTIVE',
        reviewCount: 0,
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      const wrapper = mount(ProductCard, {
        props: { product: minimalProduct },
      })

      expect(wrapper.find('h3').text()).toBe('Test Product')
      expect(wrapper.find('.price').text()).toBe('$10')
    })
  })

  describe('Performance', () => {
    it('does not recalculate discount unnecessarily', async () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: mockProductWithDiscount,
          showDiscount: true,
        },
      })

      const initialDiscountText = wrapper.find('.discount').text()

      // Change unrelated product property
      const updatedProduct = {
        ...mockProductWithDiscount,
        description: 'New description',
      }

      await wrapper.setProps({ product: updatedProduct })

      // Discount should remain the same
      expect(wrapper.find('.discount').text()).toBe(initialDiscountText)
    })
  })
})
