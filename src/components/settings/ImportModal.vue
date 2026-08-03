<!-- src/components/settings/ImportModal.vue -->
<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="modelValue" ref="dialogRef"
        class="fixed inset-0 z-110 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4" role="dialog"
        aria-modal="true" aria-labelledby="import-dialog-title" @click.self="cancel" @keydown.escape="cancel">
        <div
          class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-border max-h-[90vh] overflow-y-auto">
          <h3 id="import-dialog-title" class="text-xl font-semibold text-rose-text mb-1">
            Import data
          </h3>
          <p class="text-sm text-rose-text-muted mb-5">
            Restore notes, documents, todos, and more from a
            <span class="font-mono text-xs">rosejournal_backup_*.json</span> file.
          </p>

          <!-- ── File drop zone ── -->
          <template v-if="!parsedPayload">
            <div class="rounded-xl border-2 border-dashed transition-colors duration-150 p-6 text-center cursor-pointer"
              :class="isDragging
                  ? 'border-rose-primary bg-rose-primary/5'
                  : 'border-rose-border hover:border-rose-text-muted'
                " @click="openFilePicker" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop">
              <FileIcon :size="22" class="mx-auto mb-2 text-rose-text-muted" />
              <p class="text-sm text-rose-text-muted">
                Drop your backup file here, or
                <span class="text-rose-primary underline underline-offset-2">browse</span>
              </p>
              <input ref="fileInputRef" type="file" accept=".json,application/json" class="hidden"
                @change="handleFileInput" />
            </div>

            <div v-if="parseError"
              class="mt-4 rounded-lg bg-red-400/10 border border-red-400/30 px-4 py-3 flex items-start gap-2">
              <AlertCircleIcon :size="16" class="text-red-400 mt-0.5 shrink-0" />
              <p class="text-xs text-red-400 leading-relaxed">{{ parseError }}</p>
            </div>
          </template>

          <!-- ── Summary & options ── -->
          <template v-else-if="parsedPayload && summary">
            <div class="rounded-xl border border-rose-border bg-rose-surface-alt p-4 mb-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-rose-text-muted mb-3">
                Backup contents
              </p>
              <ul class="space-y-1.5">
                <li v-for="row in summaryRows" :key="row.label" class="flex items-center justify-between text-sm">
                  <span class="text-rose-text-muted">{{ row.label }}</span>
                  <span class="font-medium tabular-nums"
                    :class="row.count > 0 ? 'text-rose-text' : 'text-rose-text-muted/50'">
                    {{ row.count }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Category checkboxes -->
            <p class="text-xs font-semibold uppercase tracking-wider text-rose-text-muted mb-2">
              Import
            </p>
            <div class="space-y-2 mb-5">
              <label v-for="opt in categoryOptions" :key="opt.key" class="flex items-center gap-3 cursor-pointer"
                :class="{ 'opacity-40 pointer-events-none': !opt.available }">
                <input type="checkbox" v-model="selectedCategories[opt.key]" :disabled="!opt.available"
                  class="w-4 h-4 rounded border-rose-border text-rose-primary focus:ring-rose-primary bg-rose-bg" />
                <span class="text-sm text-rose-text">{{ opt.label }}</span>
                <span class="text-xs text-rose-text-muted ml-auto">
                  {{ opt.count > 0 ? opt.count : "—" }}
                </span>
              </label>
            </div>

            <!-- Conflict mode -->
            <p class="text-xs font-semibold uppercase tracking-wider text-rose-text-muted mb-2">
              Existing data
            </p>
            <div class="space-y-2 mb-3">
              <label class="flex items-start gap-3 cursor-pointer">
                <input type="radio" v-model="importMode" value="merge" class="mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-rose-text">Merge with existing</p>
                  <p class="text-xs text-rose-text-muted">
                    Keeps current data and adds items from the backup.
                  </p>
                </div>
              </label>
              <label class="flex items-start gap-3 cursor-pointer">
                <input type="radio" v-model="importMode" value="replace" class="mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-rose-text">Replace existing</p>
                  <p class="text-xs text-rose-text-muted">
                    Clears selected categories first, then imports from backup.
                  </p>
                </div>
              </label>
            </div>

            <!-- Replace warning -->
            <div v-if="importMode === 'replace'"
              class="mb-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30 px-4 py-3 flex items-start gap-2">
              <AlertTriangleIcon :size="14" class="text-yellow-400 mt-0.5 shrink-0" />
              <p class="text-xs text-yellow-400 leading-relaxed">
                This will permanently delete your current data in the selected categories before
                importing. This cannot be undone.
              </p>
            </div>

            <!-- Change file link -->
            <button type="button" class="text-xs text-rose-text-muted hover:text-rose-text underline underline-offset-2"
              @click="resetFile">
              Choose a different file
            </button>
          </template>

          <!-- ── Action buttons ── -->
          <div class="flex justify-end gap-2 mt-6">
            <button type="button"
              class="px-4 py-2 text-sm rounded-md text-rose-text hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
              @click="cancel">
              Cancel
            </button>
            <button v-if="parsedPayload" type="button" :disabled="!hasSelection || isImporting"
              class="px-4 py-2 text-sm rounded-md bg-rose-primary text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
              @click="confirm">
              {{ isImporting ? "Importing…" : "Import" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  FileIcon,
} from "@lucide/vue";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";
import {
  importData,
  type ImportMode,
  type ImportSummary,
  parseImportFile,
  summarisePayload,
} from "../../utils/importData";
import type { ExportPayload } from "../../utils/exportData";
import { useSettingsStore } from "../../stores/settings";
import { useToast } from "@/composables/ui/useToast.ts";

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  imported: [];
}>();

const settingsStore = useSettingsStore();
const { showToast } = useToast();

// ── Focus trap ────────────────────────────────────────────────────────────────
const dialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(dialogRef, { escapeDeactivates: false });
watch(dialogRef, (el) => (el ? nextTick().then(() => activate()) : deactivate()));

// ── File state ────────────────────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const parseError = ref<string | null>(null);
const parsedPayload = ref<ExportPayload | null>(null);
const summary = ref<ImportSummary | null>(null);
const importMode = ref<ImportMode>("merge");
const isImporting = ref(false);

const selectedCategories = reactive({
  activity: true,
  docs: true,
  notes: true,
  settings: true,
  todos: true,
});

// ── Computed ──────────────────────────────────────────────────────────────────
const summaryRows = computed(() => {
  if (!summary.value) { return []; }
  return [
    { count: summary.value.notes, label: "Notes" },
    { count: summary.value.docs, label: "Documents" },
    { count: summary.value.todoLists, label: "Todo Lists" },
    { count: summary.value.todos, label: "Todos" },
    { count: summary.value.folders, label: "Folders" },
    { count: summary.value.activity, label: "Activity entries" },
    { count: summary.value.settings, label: "Settings & Profile" },
  ];
});

const categoryOptions = computed(() => {
  if (!summary.value) { return []; }
  return [
    {
      available: summary.value.settings > 0,
      count: summary.value.settings,
      key: "settings" as const,
      label: "Settings & Profile",
    },
    {
      available: summary.value.notes > 0,
      count: summary.value.notes,
      key: "notes" as const,
      label: "Notes",
    },
    {
      available: summary.value.docs > 0,
      count: summary.value.docs,
      key: "docs" as const,
      label: "Documents",
    },
    {
      available: (summary.value.todos ?? 0) > 0 || (summary.value.todoLists ?? 0) > 0,
      count: (summary.value.todos ?? 0) + (summary.value.todoLists ?? 0),
      key: "todos" as const,
      label: "Todos",
    },
    {
      available: summary.value.activity > 0,
      count: summary.value.activity,
      key: "activity" as const,
      label: "Recent Activity",
    },
  ];
});

const hasSelection = computed(() =>
  Object.values(selectedCategories).some(Boolean),
);

// ── File handling ─────────────────────────────────────────────────────────────
function openFilePicker() {
  fileInputRef.value?.click();
}

async function processFile(file: File) {
  parseError.value = null;
  parsedPayload.value = null;
  summary.value = null;

  try {
    const payload = await parseImportFile(file);
    parsedPayload.value = payload;
    summary.value = summarisePayload(payload);

    selectedCategories.settings = (summary.value.settings ?? 0) > 0;
    selectedCategories.notes = (summary.value.notes ?? 0) > 0;
    selectedCategories.docs = (summary.value.docs ?? 0) > 0;
    selectedCategories.todos =
      (summary.value.todos ?? 0) > 0 || (summary.value.todoLists ?? 0) > 0;
    selectedCategories.activity = (summary.value.activity ?? 0) > 0;
  } catch (error: unknown) {
    parseError.value =
      error instanceof Error ? error.message : "Could not read the backup file.";
  }
}

function handleFileInput(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) { processFile(file); }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) { processFile(file); }
}

function resetFile() {
  parsedPayload.value = null;
  summary.value = null;
  parseError.value = null;
  if (fileInputRef.value) { fileInputRef.value.value = ""; }
}

// ── Actions ───────────────────────────────────────────────────────────────────
function cancel() {
  if (isImporting.value) { return; }
  resetFile();
  emit("update:modelValue", false);
}

async function confirm() {
  if (!parsedPayload.value || !hasSelection.value) { return; }
  isImporting.value = true;

  try {
    await importData(parsedPayload.value, {
      activity: selectedCategories.activity,
      docs: selectedCategories.docs,
      mode: importMode.value,
      notes: selectedCategories.notes,
      settings: selectedCategories.settings,
      todos: selectedCategories.todos,
    });

    // Reload settings into the store so the UI reflects any imported profile.
    if (selectedCategories.settings) {
      await settingsStore.loadSettings();
    }

    showToast("Data imported successfully.", "success");
    emit("imported");
    resetFile();
    emit("update:modelValue", false);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    showToast(`Import failed: ${message}`, "error");
  } finally {
    isImporting.value = false;
  }
}
</script>
