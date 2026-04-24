<script setup lang="ts">
import type { Toast } from '~/composables/useToast'

interface Props {
  toast: Toast
}

const props = defineProps<Props>()
const emit = defineEmits<{ dismiss: [id: string] }>()

// Maps each variant to its Tailwind token classes
const variantClasses: Record<Toast['type'], string> = {
  success: 'bg-white border-l-4 border-status-success text-ink',
  error:   'bg-brand-muted border-l-4 border-brand text-brand',
  warning: 'bg-accent-muted border-l-4 border-accent text-ink',
  info:    'bg-white border-l-4 border-status-info text-ink',
}

const iconByType: Record<Toast['type'], string> = {
  success: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
  error:   `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />`,
  warning: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />`,
  info:    `<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />`,
}

const iconColorClass: Record<Toast['type'], string> = {
  success: 'text-status-success',
  error:   'text-brand',
  warning: 'text-accent',
  info:    'text-status-info',
}
</script>

<template>
  <div
    :class="[
      'flex items-start gap-3 w-full sm:max-w-sm rounded-pill px-4 py-3 shadow-raised',
      variantClasses[toast.type],
    ]"
    role="alert"
    :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
    :aria-atomic="true"
  >
    <!-- Type icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      :class="['w-5 h-5 flex-shrink-0 mt-0.5', iconColorClass[toast.type]]"
      aria-hidden="true"
      v-html="iconByType[toast.type]"
    />

    <!-- Message + optional action -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium leading-snug">{{ toast.message }}</p>
      <button
        v-if="toast.action"
        type="button"
        class="mt-1 text-xs font-semibold underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-1 focus:ring-current rounded"
        @click="toast.action!.onClick(); emit('dismiss', toast.id)"
      >
        {{ toast.action.label }}
      </button>
    </div>

    <!-- Dismiss button -->
    <button
      type="button"
      class="flex-shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-current transition-opacity duration-base"
      :aria-label="`Dismiss notification: ${toast.message}`"
      @click="emit('dismiss', toast.id)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4" aria-hidden="true">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    </button>
  </div>
</template>
