<script setup lang="ts">
import type { Category } from '~/types'

interface Props {
  categories: Category[]
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div>
    <label
      for="category-filter"
      class="block text-sm font-medium text-ink-muted dark:text-ink-subtle mb-2"
    >
      Category
    </label>
    <select
      id="category-filter"
      :value="modelValue"
      @change="handleChange"
      class="w-full border border-steel rounded-input px-4 py-2.5 bg-surface dark:bg-surface-dark text-ink dark:text-ink-inverse focus:ring-2 focus:ring-brand focus:border-transparent transition-colors duration-base dark:border-gray-600"
    >
      <option value="">
        All Categories
      </option>
      <option
        v-for="category in categories"
        :key="category.id"
        :value="category.id"
      >
        {{ category.name }}
        <template v-if="category._count?.products">
          ({{ category._count.products }})
        </template>
      </option>
    </select>
  </div>
</template>
