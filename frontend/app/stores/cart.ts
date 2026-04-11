import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface CartItem {
  productId: string
  title: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const loading = ref(false)

  const totalItems = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  )

  async function addItem(productId: string, quantity: number = 1) {
    const existing = items.value.find(item => item.productId === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      loading.value = true
      try {
        const supabaseProducts = useSupabaseProducts()
        const product = await supabaseProducts.getProduct(productId)
        items.value.push({
          productId,
          title: product.title,
          price: product.price,
          quantity,
        })
      } finally {
        loading.value = false
      }
    }
  }

  function removeItem(productId: string) {
    const index = items.value.findIndex(item => item.productId === productId)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }

  return { items, loading, totalItems, totalPrice, addItem, removeItem }
})
