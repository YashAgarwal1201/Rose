<!-- src/components/onboarding/ImportStep.vue -->
<template>
  <div>
    <img :src="ImportIllustration" alt="Import Data" class="w-48 h-auto mx-auto mb-6 select-none pointer-events-none" />
    <h2 class="text-xl font-semibold text-rose-text text-center">
      Restore from backup
    </h2>
    <p class="text-sm text-rose-text-muted text-center mt-2 leading-relaxed">
      Pick your <span class="font-mono text-xs text-rose-text">rosejournal_backup_*.json</span> file
      and we'll restore your data. You can choose what to import.
    </p>

    <!-- File drop zone (no file chosen yet) -->
    <div v-if="!parsedPayload"
      class="mt-6 rounded-xl border-2 border-dashed transition-colors duration-150 p-6 text-center cursor-pointer"
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
      <input ref="fileInputRef" type="file" accept=".json,application/json" class="hidden" @change="handleFileInput" />
    </div>

    <!-- Validation error -->
    <div v-if="parseError"
      class="mt-4 rounded-lg bg-red-400/10 border border-red-400/30 px-4 py-3 flex items-start gap-2">
      <AlertCircleIcon :size="16" class="text-red-400 mt-0.5 shrink-0" />
      <p class="text-xs text-red-400 leading-relaxed">{{ parseError }}</p>
    </div>

    <!-- Summary & options (file was valid) -->
    <template v-if="parsedPayload && summary">
      <div class="mt-5 rounded-xl border border-rose-border bg-rose-surface-alt p-4">
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

      <!-- What to import -->
      <div class="mt-4">
        <p class="text-xs font-semibold uppercase tracking-wider text-rose-text-muted mb-2">
          Import
        </p>
        <div class="space-y-2">
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
      </div>

      <!-- Conflict mode -->
      <div class="mt-4">
        <p class="text-xs font-semibold uppercase tracking-wider text-rose-text-muted mb-2">
          How to handle existing data
        </p>
        <div class="space-y-2">
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="radio" v-model="importMode" value="merge" class="mt-0.5" />
            <div>
              <p class="text-sm font-medium text-rose-text">Merge with existing data</p>
              <p class="text-xs text-rose-text-muted">
                Adds items from the backup without deleting what's already here.
              </p>
            </div>
          </label>
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="radio" v-model="importMode" value="replace" class="mt-0.5" />
            <div>
              <p class="text-sm font-medium text-rose-text">Replace existing data</p>
              <p class="text-xs text-rose-text-muted">
                Clears the selected data categories first, then imports from the backup.
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Replace warning -->
      <div v-if="importMode === 'replace'"
        class="mt-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30 px-4 py-3 flex items-start gap-2">
        <AlertTriangleIcon :size="14" class="text-yellow-400 mt-0.5 shrink-0" />
        <p class="text-xs text-yellow-400 leading-relaxed">
          Replace mode will permanently delete your current data in the selected categories before
          importing. This cannot be undone.
        </p>
      </div>

      <!-- Change file -->
      <button type="button" class="mt-4 text-xs text-rose-text-muted hover:text-rose-text underline underline-offset-2"
        @click="resetFile">
        Choose a different file
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  FileIcon,
} from "@lucide/vue";
import ImportIllustration from "@/assets/illustrations/import-data-step.svg";
import {
  type ImportMode,
  type ImportOptions,
  type ImportSummary,
  parseImportFile,
  summarisePayload,
} from "../../utils/importData";
import type { ExportPayload } from "../../utils/exportData";

const emit = defineEmits<{
  ready: [payload: ExportPayload, options: ImportOptions];
  notReady: [];
}>();

// ── State ─────────────────────────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const parseError = ref<string | null>(null);
const parsedPayload = ref<ExportPayload | null>(null);
const summary = ref<ImportSummary | null>(null);

const importMode = ref<ImportMode>("merge");

const selectedCategories = reactive({
  activity: true,
  docs: true,
  notes: true,
  settings: true,
  todos: true,
});

// ── Computed helpers ──────────────────────────────────────────────────────────
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
      available: summary.value.todos > 0 || (summary.value.todoLists ?? 0) > 0,
      count: summary.value.todos + (summary.value.todoLists ?? 0),
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

// ── File handling ─────────────────────────────────────────────────────────────
function openFilePicker() {
  fileInputRef.value?.click();
}

async function processFile(file: File) {
  parseError.value = null;
  parsedPayload.value = null;
  summary.value = null;
  emit("notReady");

  try {
    const payload = await parseImportFile(file);
    parsedPayload.value = payload;
    summary.value = summarisePayload(payload);

    // Disable categories that have no data in the file
    selectedCategories.settings = (summary.value.settings ?? 0) > 0;
    selectedCategories.notes = (summary.value.notes ?? 0) > 0;
    selectedCategories.docs = (summary.value.docs ?? 0) > 0;
    selectedCategories.todos =
      (summary.value.todos ?? 0) > 0 || (summary.value.todoLists ?? 0) > 0;
    selectedCategories.activity = (summary.value.activity ?? 0) > 0;

    emitReady(payload);
  } catch (error: unknown) {
    parseError.value =
      error instanceof Error ? error.message : "Could not read the backup file.";
  }
}

function emitReady(payload: ExportPayload) {
  emit("ready", payload, {
    activity: selectedCategories.activity,
    docs: selectedCategories.docs,
    mode: importMode.value,
    notes: selectedCategories.notes,
    settings: selectedCategories.settings,
    todos: selectedCategories.todos,
  });
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
  emit("notReady");
}
</script>
