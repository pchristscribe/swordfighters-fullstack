import { describe, it, expect } from 'vitest'
import type { Product, Category, Platform } from '../types'

describe('Type Definitions', () => {
  it('should validate Platform enum values', () => {
    const platforms: Platform[] = ['DHGATE', 'ALIEXPRESS', 'AMAZON', 'WISH']

    platforms.forEach(platform => {
      expect(['DHGATE', 'ALIEXPRESS', 'AMAZON', 'WISH']).toContain(platform)
    })
  })

  it('should create a valid Product object', () => {
    const product: Product = {
      id: '1',
      externalId: 'ext-123',
      platform: 'DHGATE',
      title: 'Test Product',
      description: 'Test description',
      imageUrl: 'https://example.com/image.jpg',
      price: 29.99,
      currency: 'USD',
      priceUpdatedAt: new Date().toISOString(),
      categoryId: 'cat-1',
      status: 'ACTIVE',
      rating: 4.5,
      reviewCount: 10,
      tags: ['tag1', 'tag2'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    expect(product).toBeDefined()
    expect(product.platform).toBe('DHGATE')
    expect(product.price).toBe(29.99)
    expect(product.status).toBe('ACTIVE')
  })

  it('should create a valid Category object', () => {
    const category: Category = {
      id: '1',
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test description',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    expect(category).toBeDefined()
    expect(category.slug).toBe('test-category')
    expect(category.name).toBe('Test Category')
  })
})
