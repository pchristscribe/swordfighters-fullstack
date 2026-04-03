<script setup lang="ts">
import { computed } from 'vue'
import { PRICE_RANGE } from '../../types/filters'

interface Props {
  min: number
  max: number
}

interface Emits {
  (e: 'update', min: number, max: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const minValue = computed({
  get: () => props.min,
  set: (value: number) => {
    const newMin = Math.min(value, props.max - PRICE_RANGE.step)
    emit('update', newMin, props.max)
  },
})

const maxValue = computed({
  get: () => props.max,
  set: (value: number) => {
    const newMax = Math.max(value, props.min + PRICE_RANGE.step)
    emit('update', props.min, newMax)
  },
})

const minPercentage = computed(() =>
  ((props.min - PRICE_RANGE.min) / (PRICE_RANGE.max - PRICE_RANGE.min)) * 100
)

const maxPercentage = computed(() =>
  ((props.max - PRICE_RANGE.min) / (PRICE_RANGE.max - PRICE_RANGE.min)) * 100
)

const formatPrice = (value: number): string =>
  value >= PRICE_RANGE.max ? `$${value}+` : `$${value}`

// Shared thumb styling used on both min and max range inputs
const thumbClasses = [
  '[&::-webkit-slider-thumb]:pointer-events-auto',
  '[&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:w-5',
  '[&::-webkit-slider-thumb]:h-5',
  '[&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:bg-brand',
  '[&::-webkit-slider-thumb]:cursor-pointer',
  '[&::-webkit-slider-thumb]:border-2',
  '[&::-webkit-slider-thumb]:border-white',
  '[&::-webkit-slider-thumb]:shadow-card',
  '[&::-moz-range-thumb]:pointer-events-auto',
  '[&::-moz-range-thumb]:appearance-none',
  '[&::-moz-range-thumb]:w-5',
  '[&::-moz-range-thumb]:h-5',
  '[&::-moz-range-thumb]:rounded-full',
  '[&::-moz-range-thumb]:bg-brand',
  '[&::-moz-range-thumb]:cursor-pointer',
  '[&::-moz-range-thumb]:border-2',
  '[&::-moz-range-thumb]:border-white',
  '[&::-moz-range-thumb]:shadow-card',
].join(' ')
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-ink-muted dark:text-ink-subtle mb-2">
      Price Range
    </label>

    <div class="space-y-4">
      <!-- Display selected range -->
      <div class="flex items-center justify-between text-sm font-medium text-ink dark:text-ink-inverse">
        <span>{{ formatPrice(min) }}</span>
        <span class="text-ink-subtle">–</span>
        <span>{{ formatPrice(max) }}</span>
      </div>

      <!-- Dual range slider -->
      <div class="relative pt-2 pb-6">
        <!-- Track background -->
        <div class="absolute h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full top-0" />

        <!-- Active range highlight -->
        <div
          class="absolute h-2 bg-brand rounded-full top-0"
          :style="{ left: `${minPercentage}%`, right: `${100 - maxPercentage}%` }"
        />

        <!-- Min slider -->
        <input
          v-model.number="minValue"
          type="range"
          :min="PRICE_RANGE.min"
          :max="PRICE_RANGE.max"
          :step="PRICE_RANGE.step"
          :class="['absolute w-full h-2 bg-transparent appearance-none pointer-events-none top-0', thumbClasses]"
          :aria-label="`Minimum price: $${min}`"
        >

        <!-- Max slider -->
        <input
          v-model.number="maxValue"
          type="range"
          :min="PRICE_RANGE.min"
          :max="PRICE_RANGE.max"
          :step="PRICE_RANGE.step"
          :class="['absolute w-full h-2 bg-transparent appearance-none pointer-events-none top-0', thumbClasses]"
          :aria-label="`Maximum price: $${max}`"
        >
      </div>

      <!-- Quick price presets -->
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="[lo, hi, label] in [
            [0, 20, 'Under $20'],
            [20, 50, '$20 – $50'],
            [50, 100, '$50 – $100'],
            [100, 500, '$100+'],
          ]"
          :key="label"
          type="button"
          :class="[
            'px-3 py-1.5 text-xs font-medium border rounded-input transition-colors duration-base',
            min === lo && max === hi
              ? 'bg-brand-muted border-brand text-brand'
              : 'border-steel text-ink-muted hover:bg-surface-light dark:border-gray-600 dark:hover:bg-surface-raised',
          ]"
          @click="emit('update', lo as number, hi as number)"
        >
          {{ label }}
        </button>
      </div>
    </div>
  </div>
</template>
