// src/composables/useExplorerViewMode.ts
import { ref, watch } from "vue";

export type ViewMode = "grid" | "list";
export type SortKey = "name" | "updatedAt";
export type SortDir = "asc" | "desc";

const VIEW_MODE_KEY = "rose-explorer-view-mode";
const SORT_KEY_KEY = "rose-explorer-sort-key";
const SORT_DIR_KEY = "rose-explorer-sort-dir";

const VALID_VIEW_MODES: ViewMode[] = ["grid", "list"];
const VALID_SORT_KEYS: SortKey[] = ["name", "updatedAt"];
const VALID_SORT_DIRS: SortDir[] = ["asc", "desc"];

function readStored<TValue extends string>(
  key: string,
  validValues: TValue[],
  fallback: TValue,
): TValue {
  const stored = localStorage.getItem(key);
  return (validValues as string[]).includes(stored ?? "") ? (stored as TValue) : fallback;
}

const viewMode = ref<ViewMode>(readStored(VIEW_MODE_KEY, VALID_VIEW_MODES, "grid"));
const sortKey = ref<SortKey>(readStored(SORT_KEY_KEY, VALID_SORT_KEYS, "name"));
const sortDir = ref<SortDir>(readStored(SORT_DIR_KEY, VALID_SORT_DIRS, "asc"));

watch(viewMode, (value) => localStorage.setItem(VIEW_MODE_KEY, value));
watch(sortKey, (value) => localStorage.setItem(SORT_KEY_KEY, value));
watch(sortDir, (value) => localStorage.setItem(SORT_DIR_KEY, value));

export function useExplorerViewMode() {
  function toggleViewMode() {
    viewMode.value = viewMode.value === "grid" ? "list" : "grid";
  }

  function setSortKey(key: SortKey) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    } else {
      sortKey.value = key;
      sortDir.value = "asc";
    }
  }

  return { setSortKey, sortDir, sortKey, toggleViewMode, viewMode };
}
