// src/composables/useStorageEstimate.ts
import { ref } from "vue";

export function useStorageEstimate() {
  const isSupported = ref(false);
  const usageBytes = ref<number | null>(null);
  const quotaBytes = ref<number | null>(null);

  async function refresh() {
    if (!navigator.storage?.estimate) {
      isSupported.value = false;
      return;
    }
    isSupported.value = true;
    const estimate = await navigator.storage.estimate();
    usageBytes.value = estimate.usage ?? null;
    quotaBytes.value = estimate.quota ?? null;
  }

  return { isSupported, quotaBytes, refresh, usageBytes };
}
