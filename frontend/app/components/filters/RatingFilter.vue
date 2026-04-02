<script setup lang="ts">
import { RATING_OPTIONS } from '../../types/filters'

interface Props {
  modelValue: number
}

interface Emits {
  (e: 'update:modelValue', value: number): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const renderStars = (count: number) => {
  return '⭐'.repeat(count)
}
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-ink-muted dark:text-ink-subtle mb-2">
      Minimum Rating
    </label>
    <div class="space-y-2">
      <button
        v-for="option in RATING_OPTIONS"
        :key="option.value"
        type="button"
        @click="emit('update:modelValue', option.value)"
        class="w-full px-4 py-2.5 text-left border rounded-input transition-all duration-base"
        :class="
          modelValue === option.value
            ? 'border-brand bg-brand-muted text-brand font-medium'
            : 'border-steel text-ink-muted hover:border-ink-muted hover:bg-surface-light dark:border-gray-600 dark:text-ink-subtle dark:hover:bg-surface-raised'
        "
      >
        <div class="flex items-center justify-between">
          <span class="text-sm">{{ option.label }}</span>
          <span v-if="option.stars > 0" class="text-base">
            {{ renderStars(Math.floor(option.stars)) }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
