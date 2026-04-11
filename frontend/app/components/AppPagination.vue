<script setup lang="ts">
import type { Pagination as PaginationType } from '~/types'

interface Props {
  pagination: PaginationType
}

interface Emits {
  (e: 'change', page: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visiblePages = computed(() => {
  const { page, pages } = props.pagination
  const delta = 2
  const range: number[] = []
  const rangeWithDots: (number | string)[] = []

  for (
    let i = Math.max(2, page - delta);
    i <= Math.min(pages - 1, page + delta);
    i++
  ) {
    range.push(i)
  }

  if (page - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (page + delta < pages - 1) {
    rangeWithDots.push('...', pages)
  } else if (pages > 1) {
    rangeWithDots.push(pages)
  }

  return rangeWithDots
})

const handlePageChange = (page: number) => {
  if (page !== props.pagination.page && page >= 1 && page <= props.pagination.pages) {
    emit('change', page)
  }
}
</script>

<template>
  <div
    v-if="pagination.pages > 1"
    class="flex items-center justify-center gap-2"
  >
    <!-- Previous Button -->
    <button
      type="button"
      @click="handlePageChange(pagination.page - 1)"
      :disabled="pagination.page === 1"
      class="px-4 py-2 text-sm font-medium rounded-input border transition-colors duration-base ease-smooth disabled:opacity-50 disabled:cursor-not-allowed"
      :class="
        pagination.page === 1
          ? 'border-gray-200 text-ink-subtle'
          : 'border-steel text-ink-muted hover:bg-surface-light dark:hover:bg-surface-raised dark:border-gray-600 dark:text-ink-subtle'
      "
    >
      Previous
    </button>

    <!-- Page Numbers -->
    <div class="flex items-center gap-1">
      <template
        v-for="(page, index) in visiblePages"
        :key="index"
      >
        <button
          v-if="typeof page === 'number'"
          type="button"
          @click="handlePageChange(page)"
          class="min-w-[40px] h-10 px-3 text-sm font-medium rounded-input transition-colors duration-base ease-smooth"
          :class="
            page === pagination.page
              ? 'bg-brand text-ink-inverse'
              : 'text-ink-muted hover:bg-surface-light dark:hover:bg-surface-raised border border-steel dark:border-gray-600'
          "
        >
          {{ page }}
        </button>
        <span
          v-else
          class="px-2 text-ink-subtle"
        >
          {{ page }}
        </span>
      </template>
    </div>

    <!-- Next Button -->
    <button
      type="button"
      @click="handlePageChange(pagination.page + 1)"
      :disabled="pagination.page === pagination.pages"
      class="px-4 py-2 text-sm font-medium rounded-input border transition-colors duration-base ease-smooth disabled:opacity-50 disabled:cursor-not-allowed"
      :class="
        pagination.page === pagination.pages
          ? 'border-gray-200 text-ink-subtle'
          : 'border-steel text-ink-muted hover:bg-surface-light dark:hover:bg-surface-raised dark:border-gray-600 dark:text-ink-subtle'
      "
    >
      Next
    </button>
  </div>
</template>
