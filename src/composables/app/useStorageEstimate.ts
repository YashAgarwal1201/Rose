// src/composables/useStorageEstimate.ts
import { ref } from "vue";

export type StorageEstimateStatus = "idle" | "loading" | "ready" | "unsupported" | "error";

export function useStorageEstimate() {
  const status = ref<StorageEstimateStatus>("idle");
  const usageBytes = ref<number | null>(null);
  const quotaBytes = ref<number | null>(null);

  // Guards against out-of-order resolution — if refresh() is called again
  // before a prior call has settled, the stale response is dropped instead
  // of clobbering a newer one.
  let requestId = 0;

  async function refresh() {
    if (!navigator.storage?.estimate) {
      status.value = "unsupported";
      return;
    }

    const thisRequestId = ++requestId;
    status.value = "loading";

    try {
      const estimate = await navigator.storage.estimate();
      if (thisRequestId !== requestId) {
        return;
      }
      usageBytes.value = estimate.usage ?? null;
      quotaBytes.value = estimate.quota ?? null;
      status.value = "ready";
    } catch {
      // Can throw in private/incognito windows (Firefox, Safari) or
      // sandboxed/cross-origin iframe contexts.
      if (thisRequestId !== requestId) {
        return;
      }
      status.value = "error";
    }
  }

  return { quotaBytes, refresh, status, usageBytes };
}
