<!-- src/components/ToastContainer.vue -->
<template>
  <Teleport to="body">
    <div
      class="fixed bottom-4 right-4 z-100 flex flex-col gap-2 w-full max-w-sm px-4 md:px-0 pointer-events-none"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
          class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg bg-rose-surface border border-rose-border pointer-events-auto"
        >
          <component
            :is="iconFor(toast.type)"
            class="w-5 h-5 shrink-0"
            :class="colorFor(toast.type)"
          />
          <p class="text-base text-rose-text flex-1">{{ toast.message }}</p>
          <button type="button" @click="dismissToast(toast.id)" class="text-rose-text-muted hover:text-rose-text focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary rounded p-0.5" aria-label="Dismiss toast">
            <XIcon class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XCircleIcon, XIcon } from "@lucide/vue";
import { type ToastType, useToast } from "@/composables/ui/useToast.ts";

const { toasts, dismissToast } = useToast();

function iconFor(type: ToastType) {
  switch (type) {
    case "success": {
      return CheckCircleIcon;
    }
    case "error": {
      return XCircleIcon;
    }
    case "warning": {
      return AlertTriangleIcon;
    }
    default: {
      return InfoIcon;
    }
  }
}

function colorFor(type: ToastType) {
  switch (type) {
    case "success": {
      return "text-green-500";
    }
    case "error": {
      return "text-red-500";
    }
    case "warning": {
      return "text-amber-500";
    }
    default: {
      return "text-rose-primary";
    }
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
