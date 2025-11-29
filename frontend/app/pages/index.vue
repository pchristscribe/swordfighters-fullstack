<script setup lang="ts">
import type { Platform } from '~/types'

const productStore = useProductStore()

// Fetch products and categories on mount
onMounted(async () => {
  await Promise.all([
    productStore.fetchProducts(),
    productStore.fetchCategories(),
  ])
})

// Filter handlers
const handlePlatformFilter = (platform: Platform | '') => {
  productStore.setFilters({ platform: platform || undefined, page: 1 })
  productStore.fetchProducts()
}

const handleCategoryFilter = (categoryId: string) => {
  productStore.setFilters({ categoryId: categoryId || undefined, page: 1 })
  productStore.fetchProducts()
}

const handlePriceFilter = (min?: number, max?: number) => {
  productStore.setFilters({ minPrice: min, maxPrice: max, page: 1 })
  productStore.fetchProducts()
}

const handlePageChange = (page: number) => {
  productStore.setFilters({ page })
  productStore.fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 mb-8 text-white">
      <h1 class="text-4xl font-bold mb-2">Curated Products for Gay Men</h1>
      <p class="text-lg opacity-90">
        Discover quality products from DHgate, AliExpress, Amazon, and Wish
      </p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Filters</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Platform Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Platform</label>
          <select
            @change="handlePlatformFilter(($event.target as HTMLSelectElement).value as Platform | '')"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Platforms</option>
            <option value="DHGATE">DHgate</option>
            <option value="ALIEXPRESS">AliExpress</option>
            <option value="AMAZON">Amazon</option>
            <option value="WISH">Wish</option>
          </select>
        </div>

        <!-- Category Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            @change="handleCategoryFilter(($event.target as HTMLSelectElement).value)"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            <option
              v-for="category in productStore.categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }} ({{ category._count?.products || 0 }})
            </option>
          </select>
        </div>

        <!-- Quick Price Filters -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
          <div class="flex gap-2">
            <button
              @click="handlePriceFilter(undefined, 20)"
              class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Under $20
            </button>
            <button
              @click="handlePriceFilter(20, 50)"
              class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              $20-$50
            </button>
            <button
              @click="handlePriceFilter(50, undefined)"
              class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              $50+
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="productStore.loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p class="mt-4 text-gray-600">Loading products...</p>
    </div>

    <!-- Products Grid -->
    <div v-else-if="productStore.products.length > 0" class="space-y-6">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-600">
          Showing {{ productStore.products.length }} of {{ productStore.totalProducts }} products
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="product in productStore.products"
          :key="product.id"
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <NuxtLink :to="`/products/${product.id}`">
            <img
              :src="product.imageUrl"
              :alt="product.title"
              class="w-full h-48 object-cover"
            />
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="inline-block px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                  {{ product.platform }}
                </span>
                <span class="text-lg font-bold text-gray-900">
                  ${{ product.price.toFixed(2) }}
                </span>
              </div>
              <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">
                {{ product.title }}
              </h3>
              <p class="text-sm text-gray-600 line-clamp-2 mb-3">
                {{ product.description }}
              </p>
              <div class="flex items-center justify-between text-sm text-gray-500">
                <span>{{ product.category?.name }}</span>
                <span v-if="product.reviewCount > 0">
                  ⭐ {{ product.rating?.toFixed(1) }} ({{ product.reviewCount }})
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="productStore.pagination && productStore.pagination.pages > 1" class="flex justify-center gap-2 mt-8">
        <button
          v-for="page in productStore.pagination.pages"
          :key="page"
          @click="handlePageChange(page)"
          :class="[
            'px-4 py-2 rounded-md',
            page === productStore.pagination.page
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          ]"
        >
          {{ page }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <p class="text-gray-600 mb-4">No products found</p>
      <button
        @click="productStore.resetFilters(); productStore.fetchProducts()"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>
