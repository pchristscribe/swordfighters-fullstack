<script setup lang="ts">
interface Props {
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnOverlay: true,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick() {
  if (props.closeOnOverlay) close()
}

// Close on Escape key
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

// Trap focus within the modal panel
const panel = ref<HTMLElement | null>(null)

function trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !panel.value) return

  const focusable = panel.value.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

// Focus the panel when opened; restore focus when closed
const triggerEl = ref<Element | null>(null)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      triggerEl.value = document.activeElement
      nextTick(() => panel.value?.focus())
    } else {
      (triggerEl.value as HTMLElement | null)?.focus()
    }
  }
)

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown.capture="trapFocus"
        @keydown="onKeydown"
      >
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-ink/60 dark:bg-ink/80 backdrop-blur-sm"
          aria-hidden="true"
          @click="onOverlayClick"
        />

        <!-- Dialog panel -->
        <div
          ref="panel"
          :class="['relative w-full rounded-card bg-surface dark:bg-surface-raised shadow-overlay', sizeClasses[size]]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`"
          tabindex="-1"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2
              :id="`modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`"
              class="text-base font-semibold text-ink dark:text-ink-inverse"
            >
              {{ title }}
            </h2>
            <button
              type="button"
              class="rounded p-1 text-ink-muted hover:text-ink hover:bg-surface-light dark:hover:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-brand transition-colors duration-base"
              aria-label="Close dialog"
              @click="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 text-sm text-ink-muted dark:text-ink-subtle">
            <slot />
          </div>

          <!-- Footer (optional) -->
          <div
            v-if="$slots.footer"
            class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700"
          >
            <slot name="footer" :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay + panel animate together as one unit */
.modal-enter-active {
  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(0.5rem);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
