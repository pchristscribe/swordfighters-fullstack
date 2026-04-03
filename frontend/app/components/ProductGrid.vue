<script setup lang="ts">
import type { Product } from '~/types'

interface Props {
  products: Product[]
  loading?: boolean
}

defineProps<Props>()

const formatPrice = (price: number): string => price.toFixed(2)
const formatRating = (rating?: number): string => rating ? rating.toFixed(1) : '0.0'
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <div
        v-for="i in 8"
        :key="i"
        class="bg-surface dark:bg-surface-raised rounded-card shadow-card overflow-hidden animate-pulse"
      >
        <div class="w-full h-48 bg-gray-200 dark:bg-gray-700" />
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    </div>

    <!-- Product grid -->
    <div
      v-else-if="products.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      role="group"
      aria-label="Products"
    >
      <NuxtLink
        v-for="product in products"
        :key="product.id"
        :to="`/products/${product.id}`"
        class="group bg-surface dark:bg-surface-raised rounded-card shadow-card hover:shadow-raised transition-all duration-base ease-smooth overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-brand-muted"
      >
        <!-- Product Image -->
        <div class="relative overflow-hidden bg-surface-light dark:bg-surface-dark">
          <img
            :src="product.imageUrl"
            :alt="product.title"
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-slow ease-smooth"
          >
          <div class="absolute top-2 left-2">
            <span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-pill bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-sm text-ink dark:text-ink-inverse shadow-card">
              {{ product.platform }}
            </span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="p-4">
          <!-- Price and Rating -->
          <div class="flex items-start justify-between mb-2">
            <span class="text-xl font-bold text-ink dark:text-ink-inverse">
              ${{ formatPrice(product.price) }}
            </span>
            <div
              v-if="product.rating && product.reviewCount > 0"
              class="flex items-center gap-1 text-sm"
            >
              <span class="text-yellow-500">⭐</span>
              <span class="font-medium text-ink-muted dark:text-ink-subtle">
                {{ formatRating(product.rating) }}
              </span>
              <span class="text-ink-subtle">
                ({{ product.reviewCount }})
              </span>
            </div>
          </div>

          <!-- Title -->
          <h3 class="font-semibold text-ink dark:text-ink-inverse mb-2 line-clamp-2 group-hover:text-brand dark:group-hover:text-brand-hover transition-colors duration-base">
            {{ product.title }}
          </h3>

          <!-- Description -->
          <p class="text-sm text-ink-muted dark:text-ink-subtle line-clamp-2 mb-3">
            {{ product.description }}
          </p>

          <!-- Category + View link -->
          <div class="flex items-center justify-between">
            <span
              v-if="product.category"
              class="text-xs font-medium text-ink-subtle"
            >
              {{ product.category.name }}
            </span>
            <span class="text-xs font-medium text-brand group-hover:text-brand-hover transition-colors duration-base">
              View Details →
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-16"
    >
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-light dark:bg-surface-raised mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-ink-subtle"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-ink dark:text-ink-inverse mb-2">
        No products found
      </h3>
      <p class="text-ink-muted dark:text-ink-subtle mb-6">
        Try adjusting your filters to find what you're looking for
      </p>
    </div>
  </div>
</template>
