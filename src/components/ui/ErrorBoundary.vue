<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";
import { AlertTriangleIcon } from "@lucide/vue";

const hasError = ref(false);
const errorMessage = ref("");

onErrorCaptured((err, instance, info) => {
  console.error("ErrorBoundary caught an error:", err, info);
  hasError.value = true;
  errorMessage.value = err instanceof Error ? err.message : String(err);
  return false; // prevent the error from propagating further up
});

function retry() {
  hasError.value = false;
  errorMessage.value = "";
}
</script>

<template>
  <div v-if="hasError"
    class="flex flex-col items-center justify-center p-8 text-center h-full w-full min-h-50 bg-rose-bg rounded-xl border border-rose-border">
    <div class="bg-red-500/10 p-4 rounded-full mb-4">
      <AlertTriangleIcon class="w-8 h-8 text-red-500" />
    </div>
    <h2 class="text-xl font-bold text-rose-text mb-2">Something went wrong</h2>
    <p class="text-rose-text-muted text-sm mb-6 max-w-md">
      {{ errorMessage || "An unexpected error occurred while rendering this component." }}
    </p>
    <button @click="retry"
      class="px-4 py-2 bg-rose-primary text-white rounded-lg hover:bg-rose-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-primary font-medium">
      Retry
    </button>
  </div>
  <slot v-else />
</template>
