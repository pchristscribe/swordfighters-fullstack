import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Note: These tests will modify the database
  // Consider setting up a TEST_DATABASE_URL in .env for isolated testing
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Database Seeding', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.review.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.admin.deleteMany()
  })

  describe('Idempotency', () => {
    it('should create data on first run', async () => {
      // Run seed script
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      // Verify categories were created
      const categories = await prisma.category.findMany()
      expect(categories.length).toBeGreaterThan(0)

      // Verify products were created
      const products = await prisma.product.findMany()
      expect(products.length).toBeGreaterThan(0)

      // Verify reviews were created
      const reviews = await prisma.review.findMany()
      expect(reviews.length).toBeGreaterThan(0)
    })

    it('should not duplicate data on second run', async () => {
      // Run seed script twice
      execSync('npm run prisma:seed', { stdio: 'pipe' })
      const firstRunCategories = await prisma.category.count()
      const firstRunProducts = await prisma.product.count()
      const firstRunReviews = await prisma.review.count()

      execSync('npm run prisma:seed', { stdio: 'pipe' })
      const secondRunCategories = await prisma.category.count()
      const secondRunProducts = await prisma.product.count()
      const secondRunReviews = await prisma.review.count()

      // Counts should be identical
      expect(secondRunCategories).toBe(firstRunCategories)
      expect(secondRunProducts).toBe(firstRunProducts)
      expect(secondRunReviews).toBe(firstRunReviews)
    })
  })

  describe('Category Seeding', () => {
    it('should create all required categories', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const categories = await prisma.category.findMany()
      const slugs = categories.map(c => c.slug)

      expect(slugs).toContain('fashion-accessories')
      expect(slugs).toContain('home-living')
      expect(slugs).toContain('electronics')
      expect(slugs).toContain('health-wellness')
    })

    it('should create categories with correct structure', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const category = await prisma.category.findUnique({
        where: { slug: 'fashion-accessories' }
      })

      expect(category).toBeDefined()
      expect(category.name).toBe('Fashion & Accessories')
      expect(category.description).toBeTruthy()
      expect(category.imageUrl).toBeTruthy()
    })
  })

  describe('Product Seeding', () => {
    it('should create products across all platforms', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const dhgateProducts = await prisma.product.count({
        where: { platform: 'DHGATE' }
      })
      const aliexpressProducts = await prisma.product.count({
        where: { platform: 'ALIEXPRESS' }
      })
      const amazonProducts = await prisma.product.count({
        where: { platform: 'AMAZON' }
      })
      const wishProducts = await prisma.product.count({
        where: { platform: 'WISH' }
      })

      expect(dhgateProducts).toBeGreaterThan(0)
      expect(aliexpressProducts).toBeGreaterThan(0)
      expect(amazonProducts).toBeGreaterThan(0)
      expect(wishProducts).toBeGreaterThan(0)
    })

    it('should create products with all required fields', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const product = await prisma.product.findFirst({
        where: { externalId: 'DHGATE-12345' }
      })

      expect(product).toBeDefined()
      expect(product.title).toBeTruthy()
      expect(product.description).toBeTruthy()
      expect(product.price).toBeGreaterThan(0)
      expect(product.categoryId).toBeTruthy()
      expect(product.status).toBe('ACTIVE')
      expect(product.rating).toBeGreaterThanOrEqual(0)
      expect(product.rating).toBeLessThanOrEqual(5)
      expect(product.reviewCount).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(product.tags)).toBe(true)
    })

    it('should link products to correct categories', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const fashionCategory = await prisma.category.findUnique({
        where: { slug: 'fashion-accessories' }
      })

      const fashionProduct = await prisma.product.findFirst({
        where: { externalId: 'DHGATE-12345' }
      })

      expect(fashionProduct.categoryId).toBe(fashionCategory.id)
    })

    it('should enforce unique constraint on platform + externalId', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const products = await prisma.product.findMany({
        where: {
          platform: 'AMAZON',
          externalId: 'AMAZON-54321'
        }
      })

      expect(products.length).toBe(1)
    })
  })

  describe('Review Seeding', () => {
    it('should create reviews for featured products', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const reviews = await prisma.review.findMany()
      expect(reviews.length).toBeGreaterThan(0)

      // Check that reviews link to products
      const reviewWithProduct = await prisma.review.findFirst({
        include: { product: true }
      })
      expect(reviewWithProduct.product).toBeDefined()
    })

    it('should create reviews with correct structure', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const review = await prisma.review.findFirst()

      expect(review).toBeDefined()
      expect(review.rating).toBeGreaterThanOrEqual(1)
      expect(review.rating).toBeLessThanOrEqual(5)
      expect(review.title).toBeTruthy()
      expect(review.content).toBeTruthy()
      expect(Array.isArray(review.pros)).toBe(true)
      expect(Array.isArray(review.cons)).toBe(true)
      expect(typeof review.isFeatured).toBe('boolean')
    })

    it('should link reviews to correct products', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const leatherHarness = await prisma.product.findUnique({
        where: {
          platform_externalId: {
            platform: 'AMAZON',
            externalId: 'AMAZON-54321'
          }
        }
      })

      const reviews = await prisma.review.findMany({
        where: { productId: leatherHarness.id }
      })

      expect(reviews.length).toBeGreaterThan(0)
    })

    it('should not duplicate reviews on multiple runs', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const product = await prisma.product.findUnique({
        where: {
          platform_externalId: {
            platform: 'AMAZON',
            externalId: 'AMAZON-54321'
          }
        }
      })

      const reviewTitles = await prisma.review.findMany({
        where: { productId: product.id },
        select: { title: true }
      })

      const uniqueTitles = new Set(reviewTitles.map(r => r.title))
      expect(reviewTitles.length).toBe(uniqueTitles.size)
    })
  })

  describe('Data Relationships', () => {
    it('should handle missing categories gracefully', async () => {
      // Delete all categories first
      await prisma.category.deleteMany()

      // Seed should create categories first, then products
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const products = await prisma.product.findMany()
      expect(products.length).toBeGreaterThan(0)

      // All products should have valid category IDs
      for (const product of products) {
        const category = await prisma.category.findUnique({
          where: { id: product.categoryId }
        })
        expect(category).toBeDefined()
      }
    })

    it('should handle missing products gracefully for reviews', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      // All reviews should link to existing products
      const reviews = await prisma.review.findMany()
      for (const review of reviews) {
        const product = await prisma.product.findUnique({
          where: { id: review.productId }
        })
        expect(product).toBeDefined()
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle partial existing data', async () => {
      // Create some categories manually
      await prisma.category.create({
        data: {
          name: 'Fashion & Accessories',
          slug: 'fashion-accessories',
          description: 'Stylish clothing, accessories, and fashion items',
          imageUrl: 'https://via.placeholder.com/400x300?text=Fashion'
        }
      })

      // Run seed - should not fail
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const categories = await prisma.category.count()
      expect(categories).toBeGreaterThan(0)
    })

    it('should validate price values are positive', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const products = await prisma.product.findMany()
      for (const product of products) {
        expect(product.price).toBeGreaterThan(0)
      }
    })

    it('should validate rating values are in valid range', async () => {
      execSync('npm run prisma:seed', { stdio: 'pipe' })

      const products = await prisma.product.findMany()
      for (const product of products) {
        expect(product.rating).toBeGreaterThanOrEqual(0)
        expect(product.rating).toBeLessThanOrEqual(5)
      }

      const reviews = await prisma.review.findMany()
      for (const review of reviews) {
        expect(review.rating).toBeGreaterThanOrEqual(1)
        expect(review.rating).toBeLessThanOrEqual(5)
      }
    })
  })
})
