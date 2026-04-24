import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCardSimple from '../app/components/ProductCardSimple.vue'
import ProductCard from '../app/components/ProductCard.vue'
import type { Product } from '../app/types'

// ProductCardSimple is a thin wrapper around ProductCard with variant="simple".
// These tests verify the delegation contract: correct rendering and event forwarding.

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }
// ProductCard is auto-imported by Nuxt at runtime; in tests we must register it
// explicitly so the wrapper's <ProductCard> resolves.
const global = { stubs: { NuxtLink: NuxtLinkStub }, components: { ProductCard } }

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

const mockProductWithDiscount: Product & { originalPrice: number } = {
  ...mockProduct,
  id: 'product-2',
  price: 9.99,
  originalPrice: 19.99,
}

describe('ProductCardSimple Component', () => {
  describe('Rendering (simple variant)', () => {
    it('renders product image with correct src attribute', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.find('img').attributes('src')).toBe(mockProduct.imageUrl)
    })

    it('renders product image with correct alt attribute', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.find('img').attributes('alt')).toBe(mockProduct.title)
    })

    it('renders product title in h3 element', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.find('h3').text()).toBe(mockProduct.title)
    })

    it('renders product price', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.text()).toContain('$12.99')
    })

    it('renders exactly one Add to Cart button', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(1)
      expect(buttons[0].text()).toBe('Add to Cart')
    })

    it('does NOT render a View Details button (simple variant)', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.findAll('button').some(b => b.text() === 'View Details')).toBe(false)
    })

    it('does NOT render the affiliate disclosure badge (simple variant)', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.find('[aria-label="Affiliate product"]').exists()).toBe(false)
    })

    it('does NOT render product description (simple variant)', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.text()).not.toContain(mockProduct.description)
    })

    it('uses shorter image height than full variant', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.find('img').classes()).toContain('h-36')
    })
  })

  describe('Discount badge (shown in simple variant)', () => {
    it('does not render discount badge when showDiscount is false (default)', () => {
      const wrapper = mount(ProductCardSimple, {
        props: { product: mockProductWithDiscount },
        global,
      })
      expect(wrapper.find('[aria-label$="% discount"]').exists()).toBe(false)
    })

    it('renders discount badge when showDiscount is true and originalPrice exists', () => {
      const wrapper = mount(ProductCardSimple, {
        props: { product: mockProductWithDiscount, showDiscount: true },
        global,
      })
      const badge = wrapper.find('[aria-label$="% discount"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('50% OFF')
    })

    it('does not render discount badge when no originalPrice', () => {
      const wrapper = mount(ProductCardSimple, {
        props: { product: mockProduct, showDiscount: true },
        global,
      })
      expect(wrapper.find('[aria-label$="% discount"]').exists()).toBe(false)
    })

    it('calculates 25% discount correctly', () => {
      const wrapper = mount(ProductCardSimple, {
        props: {
          product: { ...mockProduct, price: 15.0, originalPrice: 20.0 },
          showDiscount: true,
        },
        global,
      })
      expect(wrapper.find('[aria-label$="% discount"]').text()).toBe('25% OFF')
    })

    it('does not show discount for percentages that round to 0', () => {
      const wrapper = mount(ProductCardSimple, {
        props: {
          product: { ...mockProduct, price: 19.99, originalPrice: 20.0 },
          showDiscount: true,
        },
        global,
      })
      expect(wrapper.find('[aria-label$="% discount"]').exists()).toBe(false)
    })
  })

  describe('Event Emissions', () => {
    it('emits add-to-cart when button is clicked', async () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('add-to-cart')?.[0]).toEqual([mockProduct])
    })

    it('emits the correct product in the add-to-cart payload', async () => {
      const wrapper = mount(ProductCardSimple, {
        props: { product: mockProductWithDiscount },
        global,
      })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('add-to-cart')?.[0][0]).toEqual(mockProductWithDiscount)
    })

    it('emits multiple add-to-cart events when clicked multiple times', async () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      const btn = wrapper.find('button')
      await btn.trigger('click')
      await btn.trigger('click')
      await btn.trigger('click')
      expect(wrapper.emitted('add-to-cart')).toHaveLength(3)
    })
  })

  describe('Edge Cases', () => {
    it('handles product with empty title', () => {
      const wrapper = mount(ProductCardSimple, {
        props: { product: { ...mockProduct, title: '' } },
        global,
      })
      expect(wrapper.find('h3').text()).toBe('')
    })

    it('handles product with very long title', () => {
      const longTitle = 'A'.repeat(200)
      const wrapper = mount(ProductCardSimple, {
        props: { product: { ...mockProduct, title: longTitle } },
        global,
      })
      expect(wrapper.find('h3').text()).toBe(longTitle)
    })

    it('handles product with empty imageUrl', () => {
      const wrapper = mount(ProductCardSimple, {
        props: { product: { ...mockProduct, imageUrl: '' } },
        global,
      })
      expect(wrapper.find('img').attributes('src')).toBe('')
    })
  })

  describe('Accessibility', () => {
    it('image has non-empty alt text', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.find('img').attributes('alt')).toBeTruthy()
    })

    it('article has aria-label containing the product title', () => {
      const wrapper = mount(ProductCardSimple, { props: { product: mockProduct }, global })
      expect(wrapper.find('article').attributes('aria-label')).toContain(mockProduct.title)
    })
  })
})
