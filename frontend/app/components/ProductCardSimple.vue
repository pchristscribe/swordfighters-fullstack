<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '~/types'

interface Props {
  product: Product & { originalPrice?: number }
  showDiscount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDiscount: false
})

const emit = defineEmits<{
  'add-to-cart': [product: Product]
}>()

const discountPercentage = computed(() => {
  if (!props.showDiscount || !props.product.originalPrice) return 0
  return Math.round(((props.product.originalPrice - props.product.price) / props.product.originalPrice) * 100)
})
</script>

<template>
  <div class="product-card">
    <img :src="product.imageUrl" :alt="product.title" />
    <h3>{{ product.title }}</h3>
    <div v-if="showDiscount && discountPercentage !== 0" class="discount">
      {{ discountPercentage }}% OFF
    </div>
    <p class="price">${{ product.price }}</p>
    <button @click="emit('add-to-cart', product)">
      Add to Cart
    </button>
  </div>
</template>
