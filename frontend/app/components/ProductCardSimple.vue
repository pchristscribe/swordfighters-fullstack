<script setup lang="ts">
import type { Product } from '~/types'

// ProductCardSimple is a convenience alias for ProductCard variant="simple".
// Add any new logic to ProductCard.vue instead.
interface Props {
  product: Product & { originalPrice?: number }
  showDiscount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDiscount: false,
})

const emit = defineEmits<{
  'add-to-cart': [product: Product]
}>()
</script>

<template>
  <ProductCard
    :product="props.product"
    :show-discount="props.showDiscount"
    variant="simple"
    @add-to-cart="emit('add-to-cart', $event)"
  />
</template>
