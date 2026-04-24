import { ref } from 'vue'
import type { Ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number  // ms — 0 means persistent until manually dismissed
  action?: ToastAction
}

// Module-level singleton — client-only state, safe for SSR because
// toasts are only ever added after user interactions (never during render)
const toasts: Ref<Toast[]> = ref([])
let counter = 0

function add(toast: Omit<Toast, 'id'>): string {
  const id = `toast-${++counter}`
  toasts.value.push({ id, ...toast })

  if (toast.duration > 0) {
    setTimeout(() => dismiss(id), toast.duration)
  }

  return id
}

function dismiss(id: string): void {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) toasts.value.splice(index, 1)
}

function clear(): void {
  toasts.value = []
}

type ToastOptions = Partial<Pick<Toast, 'duration' | 'action'>>

export function useToast() {
  return {
    toasts,
    dismiss,
    clear,
    success: (message: string, opts?: ToastOptions) =>
      add({ type: 'success', message, duration: 4000, ...opts }),
    error: (message: string, opts?: ToastOptions) =>
      add({ type: 'error', message, duration: 6000, ...opts }),
    warning: (message: string, opts?: ToastOptions) =>
      add({ type: 'warning', message, duration: 5000, ...opts }),
    info: (message: string, opts?: ToastOptions) =>
      add({ type: 'info', message, duration: 4000, ...opts }),
  }
}
