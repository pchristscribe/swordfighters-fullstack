<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <!-- Teleported to <body> so no parent stacking context can clip the toasts -->
  <Teleport to="body">
    <div
      class="fixed bottom-4 inset-x-4 z-50 flex flex-col gap-2 items-stretch sm:inset-x-auto sm:right-4 sm:left-auto sm:items-end"
      aria-label="Notifications"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col gap-2 items-stretch sm:items-end"
      >
        <AppFeedbackToast
          v-for="toast in toasts"
          :key="toast.id"
          :toast="toast"
          @dismiss="dismiss"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Enter: slide up from below + fade in */
.toast-enter-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-leave-active {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
/* Smooth reflow when a toast is removed from the middle of the stack */
.toast-move {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
