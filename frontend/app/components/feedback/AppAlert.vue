<script setup lang="ts">
import { ref } from 'vue'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface Props {
  type?: AlertType
  title?: string
  dismissible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  dismissible: false,
})

const emit = defineEmits<{ dismiss: [] }>()

const isDismissed = ref(false)

const containerClasses: Record<AlertType, string> = {
  success: 'bg-green-50  border-green-200 dark:bg-green-950/30 dark:border-green-800',
  error:   'bg-brand-muted border-brand/30 dark:bg-brand/10 dark:border-brand/40',
  warning: 'bg-accent-muted border-accent/30 dark:bg-accent/10 dark:border-accent/40',
  info:    'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
}

const iconColorClasses: Record<AlertType, string> = {
  success: 'text-status-success',
  error:   'text-brand',
  warning: 'text-accent-hover',
  info:    'text-status-info',
}

const titleColorClasses: Record<AlertType, string> = {
  success: 'text-green-800 dark:text-green-200',
  error:   'text-brand dark:text-brand-muted',
  warning: 'text-ink dark:text-ink-inverse',
  info:    'text-blue-800 dark:text-blue-200',
}

const iconByType: Record<AlertType, string> = {
  success: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
  error:   `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />`,
  warning: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />`,
  info:    `<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />`,
}
</script>

<template>
  <div
    v-if="!isDismissed"
    :class="[
      'flex gap-3 rounded-input border p-4',
      containerClasses[type],
    ]"
    role="alert"
    :aria-live="type === 'error' ? 'assertive' : 'polite'"
  >
    <!-- Icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      :class="['w-5 h-5 flex-shrink-0 mt-0.5', iconColorClasses[type]]"
      aria-hidden="true"
      v-html="iconByType[type]"
    />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p v-if="title" :class="['text-sm font-semibold mb-1', titleColorClasses[type]]">
        {{ title }}
      </p>
      <div class="text-sm text-ink-muted dark:text-ink-subtle">
        <slot />
      </div>
      <!-- Optional action slot (e.g. a link or button) -->
      <div v-if="$slots.action" class="mt-2">
        <slot name="action" />
      </div>
    </div>

    <!-- Dismiss -->
    <button
      v-if="dismissible"
      type="button"
      class="flex-shrink-0 rounded p-0.5 text-ink-muted hover:text-ink opacity-60 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-current transition-opacity duration-base"
      aria-label="Dismiss"
      @click="isDismissed = true; emit('dismiss')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4" aria-hidden="true">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    </button>
  </div>
</template>
