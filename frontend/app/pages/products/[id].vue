<script setup lang="ts">
const route = useRoute()
const productStore = useProductStore()

const productId = route.params.id as string

// Fetch product details
onMounted(() => {
  productStore.fetchProduct(productId)
})

const product = computed(() => productStore.currentProduct)

// Handle affiliate link click
const handleAffiliateClick = (url: string) => {
  // Open in new tab
  window.open(url, '_blank')
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="productStore.loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p class="mt-4 text-gray-600">Loading product...</p>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="max-w-6xl mx-auto">
      <NuxtLink
        to="/"
        class="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
      >
        ← Back to Products
      </NuxtLink>

      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          <!-- Product Image -->
          <div>
            <img
              :src="product.imageUrl"
              :alt="product.title"
              class="w-full rounded-lg"
            />
          </div>

          <!-- Product Info -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="inline-block px-3 py-1 text-sm font-semibold rounded bg-indigo-100 text-indigo-800">
                {{ product.platform }}
              </span>
              <span
                v-if="product.status === 'ACTIVE'"
                class="inline-block px-3 py-1 text-sm font-semibold rounded bg-green-100 text-green-800"
              >
                In Stock
              </span>
            </div>

            <h1 class="text-3xl font-bold text-gray-900 mb-4">
              {{ product.title }}
            </h1>

            <div class="flex items-baseline gap-3 mb-6">
              <span class="text-4xl font-bold text-indigo-600">
                ${{ product.price.toFixed(2) }}
              </span>
              <span class="text-sm text-gray-500">
                {{ product.currency }}
              </span>
            </div>

            <div class="mb-6">
              <p class="text-gray-700 leading-relaxed">
                {{ product.description }}
              </p>
            </div>

            <!-- Category & Tags -->
            <div class="mb-6 space-y-3">
              <div v-if="product.category">
                <span class="text-sm font-medium text-gray-700">Category:</span>
                <span class="ml-2 text-sm text-gray-600">{{ product.category.name }}</span>
              </div>

              <div v-if="product.tags && product.tags.length > 0">
                <span class="text-sm font-medium text-gray-700 block mb-2">Tags:</span>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in product.tags"
                    :key="tag"
                    class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Price Update Info -->
            <div class="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p class="text-sm text-yellow-800">
                💡 Price last updated: {{ new Date(product.priceUpdatedAt).toLocaleDateString() }}
              </p>
              <p class="text-xs text-yellow-700 mt-1">
                Actual price may vary. Check seller's site for current pricing.
              </p>
            </div>

            <!-- Affiliate Links -->
            <div v-if="product.affiliateLinks && product.affiliateLinks.length > 0" class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900">Where to Buy</h3>
              <div
                v-for="link in product.affiliateLinks"
                :key="link.id"
                class="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600">Affiliate Link</p>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ link.clicks }} clicks • {{ link.conversions }} conversions
                    </p>
                  </div>
                  <button
                    @click="handleAffiliateClick(link.trackedUrl)"
                    class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Visit Seller →
                  </button>
                </div>
              </div>

              <!-- FTC Disclosure -->
              <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p class="text-xs text-gray-600">
                  <strong>Disclosure:</strong> This is an affiliate link. We may earn a commission when you make a purchase through this link at no additional cost to you.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews Section (if any) -->
        <div v-if="product.reviews && product.reviews.length > 0" class="border-t border-gray-200 p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Our Reviews</h2>
          <div class="space-y-6">
            <div
              v-for="review in product.reviews"
              :key="review.id"
              class="border border-gray-200 rounded-lg p-6"
            >
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h4 v-if="review.title" class="font-semibold text-gray-900">{{ review.title }}</h4>
                  <p class="text-sm text-gray-600">by {{ review.authorName }}</p>
                </div>
                <div class="flex items-center">
                  <span class="text-yellow-500">★</span>
                  <span class="ml-1 font-semibold">{{ review.rating }}/5</span>
                </div>
              </div>
              <p class="text-gray-700 mb-4">{{ review.content }}</p>

              <div v-if="review.pros && review.pros.length > 0" class="mb-3">
                <p class="text-sm font-medium text-green-700 mb-1">Pros:</p>
                <ul class="text-sm text-gray-600 list-disc list-inside">
                  <li v-for="pro in review.pros" :key="pro">{{ pro }}</li>
                </ul>
              </div>

              <div v-if="review.cons && review.cons.length > 0">
                <p class="text-sm font-medium text-red-700 mb-1">Cons:</p>
                <ul class="text-sm text-gray-600 list-disc list-inside">
                  <li v-for="con in review.cons" :key="con">{{ con }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <p class="text-gray-600 mb-4">Product not found</p>
      <NuxtLink
        to="/"
        class="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Back to Products
      </NuxtLink>
    </div>
  </div>
</template>
