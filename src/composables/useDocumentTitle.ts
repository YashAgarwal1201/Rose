// src/composables/useDocumentTitle.ts
import { watch, type WatchSource } from "vue";

const APP_NAME = "Rose";

/**
 * Keeps the browser tab title in sync with a reactive value.
 * Pass a ref/getter that resolves to the page's specific title (or
 * null/undefined while it's still loading) — the app name is appended
 * automatically, and falls back to just the app name when there's nothing
 * more specific yet.
 */
export function useDocumentTitle(source: WatchSource<string | null | undefined>) {
  watch(
    source,
    (value) => {
      document.title = value ? `${value} · ${APP_NAME}` : APP_NAME;
    },
    { immediate: true },
  );
}
