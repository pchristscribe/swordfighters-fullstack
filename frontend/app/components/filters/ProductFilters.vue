<script setup lang="ts">
import type { Category } from '~/types'

interface Props {
  categories: Category[]
}

interface Emits {
  (e: 'apply'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const filterStore = useFilterStore()

// Watch for filter changes and emit apply event
const applyFilters = () => {
  emit('apply')
}

const handleClearAll = () => {
  filterStore.clearAllFilters()
  applyFilters()
}
</script>

<template>
  <div class="bg-surface dark:bg-surface-raised rounded-card shadow-card border border-gray-100 dark:border-gray-700">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink dark:text-ink-inverse">
            Filters
          </h2>
          <span
            v-if="filterStore.activeFiltersCount > 0"
            class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-pill text-xs font-medium bg-brand-muted text-brand"
          >
            {{ filterStore.activeFiltersCount }} active
          </span>
        </div>
        <button
          v-if="filterStore.hasActiveFilters"
          type="button"
          @click="handleClearAll"
          class="text-sm font-medium text-brand hover:text-brand-hover transition-colors duration-base"
        >
          Clear all
        </button>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="p-6 space-y-6">
      <!-- Category Filter -->
      <CategoryFilter
        v-model="filterStore.categoryId"
        :categories="categories"
        @update:model-value="applyFilters"
      />

      <!-- Price Range Filter -->
      <PriceRangeFilter
        :min="filterStore.minPrice"
        :max="filterStore.maxPrice"
        @update="(min, max) => {
          filterStore.setPriceRange(min, max)
          applyFilters()
        }"
      />

      <!-- Rating Filter -->
      <RatingFilter
        v-model="filterStore.minRating"
        @update:model-value="applyFilters"
      />
    </div>
  </div>
</template>
