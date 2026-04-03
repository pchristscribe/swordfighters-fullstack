<script setup lang="ts">
import type { FilterState } from '../../types/filters'

interface SortOption {
  value: FilterState['sortBy']
  label: string
}

interface Emits {
  (e: 'update', sortBy: FilterState['sortBy'], order: 'asc' | 'desc'): void
}

const emit = defineEmits<Emits>()

const filterStore = useFilterStore()

const sortOptions: SortOption[] = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'price', label: 'Price' },
  { value: 'rating', label: 'Rating' },
  { value: 'title', label: 'Name' },
]

const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const sortBy = target.value as FilterState['sortBy']
  emit('update', sortBy, filterStore.order)
}

const toggleOrder = () => {
  const newOrder = filterStore.order === 'asc' ? 'desc' : 'asc'
  emit('update', filterStore.sortBy, newOrder)
}
</script>

<template>
  <div class="flex items-center gap-3">
    <label
      for="sort-select"
      class="text-sm font-medium text-ink-muted dark:text-ink-subtle whitespace-nowrap"
    >
      Sort by:
    </label>

    <div class="flex items-center gap-2">
      <select
        id="sort-select"
        :value="filterStore.sortBy"
        @change="handleSortChange"
        class="border border-steel rounded-input px-3 py-2 text-sm bg-surface dark:bg-surface-dark text-ink dark:text-ink-inverse focus:ring-2 focus:ring-brand focus:border-transparent dark:border-gray-600 transition-colors duration-base"
      >
        <option
          v-for="option in sortOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <button
        type="button"
        @click="toggleOrder"
        class="p-2 border border-steel rounded-input hover:bg-surface-light dark:hover:bg-surface-raised dark:border-gray-600 transition-colors duration-base"
        :title="filterStore.order === 'asc' ? 'Ascending' : 'Descending'"
      >
        <svg
          v-if="filterStore.order === 'asc'"
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-ink-muted dark:text-ink-subtle"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-ink-muted dark:text-ink-subtle"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
        </svg>
      </button>
    </div>
  </div>
</template>
