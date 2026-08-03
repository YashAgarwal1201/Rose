<!-- src/views/SettingsView.vue -->
<template>
  <div class="p-4 md:p-8 lg:p-10">
    <div class="flex items-center gap-3">
      <button
        @click="goBack"
        class="p-1.5 -ml-1.5 rounded-lg text-rose-text hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
        aria-label="Go back"
      >
        <ArrowLeftIcon class="w-6 h-6" />
      </button>
      <h1 class="text-2xl sm:text-3xl font-bold text-rose-text">Settings</h1>
    </div>
    <p class="text-sm sm:text-base text-rose-cream mt-1">
      Manage your profile, enabled features, and app data.
    </p>

    <div class="flex flex-col gap-5 mt-6 max-w-2xl">
      <!-- Profile -->
      <SettingsSection :icon="UserIcon" title="Profile">
        <SettingsRow label="Username" description="Shown in your greeting on Home." v-slot="{ labelId, descriptionId }">
          <input v-model="usernameDraft" type="text" placeholder="Your name" maxlength="40" :aria-labelledby="labelId"
            :aria-describedby="descriptionId"
            class="w-full sm:w-56 rounded-lg border border-rose-border bg-rose-bg px-3 py-2 text-sm sm:text-base text-rose-text placeholder:text-rose-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            @keyup.enter="saveUsername" @blur="saveUsername" />
        </SettingsRow>
      </SettingsSection>

      <!-- Features -->
      <SettingsSection :icon="SlidersHorizontalIcon" title="Features"
        description="Turn off what you don't use. At least one must stay on.">
        <SettingsRow v-for="feature in featureOptions" :key="feature.value" :label="feature.label"
          :description="feature.description" v-slot="{ labelId, descriptionId }">
          <SettingsSwitch :model-value="settingsStore.isFeatureEnabled(feature.value)" :aria-labelledby="labelId"
            :aria-describedby="descriptionId" @update:model-value="settingsStore.toggleFeature(feature.value)" />
        </SettingsRow>
      </SettingsSection>

      <!-- General -->
      <SettingsSection :icon="RotateCcwIcon" title="General">
        <SettingsRow label="Replay onboarding" description="Go through the welcome setup again."
          v-slot="{ descriptionId }">
          <button type="button" :aria-describedby="descriptionId"
            class="px-3 py-1.5 rounded-lg border border-rose-border text-sm sm:text-base text-rose-text hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            @click="handleReplayOnboarding">
            Replay
          </button>
        </SettingsRow>
      </SettingsSection>

      <!-- Data & Storage -->
      <SettingsSection :icon="DatabaseIcon" title="Data & Storage"
        description="Everything here is stored only on this device.">
        <SettingsRow label="Storage used">
          <span class="inline-flex items-center gap-1.5">
            <span v-if="storage.status.value === 'ready'" class="text-sm sm:text-base text-rose-text-muted">
              {{ formatBytes(storage.usageBytes.value ?? 0) }}
              <template v-if="storage.quotaBytes.value">
                of ~{{ formatBytes(storage.quotaBytes.value) }} available
              </template>
            </span>
            <span v-else-if="storage.status.value === 'loading'" class="text-sm sm:text-base text-rose-text-muted">
              Calculating…
            </span>
            <span v-else-if="storage.status.value === 'error'" class="text-sm sm:text-base text-rose-text-muted">
              Couldn't check storage usage
            </span>
            <span v-else class="text-sm sm:text-base text-rose-text-muted">
              Not available in this browser
            </span>

            <SummaryComp label="About storage numbers"
              text="Browsers report this approximately, and some (like Brave) deliberately obscure the exact figures for privacy. The numbers here are a rough guide, not an exact measurement — they can look different across browsers on the same device." />
          </span>
        </SettingsRow>

        <SettingsRow label="Export data"
          description="Download a backup of your app data as a JSON file." v-slot="{ descriptionId }">
          <button type="button" :aria-describedby="descriptionId"
            class="px-3 py-1.5 rounded-lg border border-rose-border text-sm sm:text-base text-rose-text hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            @click="openExportDialog">
            Export...
          </button>
        </SettingsRow>

        <SettingsRow label="Import data"
          description="Restore from a previously exported backup file." v-slot="{ descriptionId }">
          <button type="button" :aria-describedby="descriptionId"
            class="px-3 py-1.5 rounded-lg border border-rose-border text-sm sm:text-base text-rose-text hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            @click="isImportModalOpen = true">
            Import...
          </button>
        </SettingsRow>

        <SettingsRow label="Clear all content"
          description="Deletes folders, todos, and docs. Keeps your profile and preferences."
          v-slot="{ descriptionId }">
          <button type="button" :aria-describedby="descriptionId"
            class="px-3 py-1.5 rounded-lg border border-red-400/40 text-red-400 text-sm sm:text-base font-medium hover:bg-red-400/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            @click="handleClearContent">
            Clear content
          </button>
        </SettingsRow>

        <SettingsRow label="Reset app completely"
          description="Deletes everything, including your profile. Onboarding starts over." v-slot="{ descriptionId }">
          <button type="button" :aria-describedby="descriptionId"
            class="px-3 py-1.5 rounded-lg border border-red-400/40 text-red-400 text-sm sm:text-base font-medium hover:bg-red-400/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            @click="openResetDialog">
            Reset app
          </button>
        </SettingsRow>
      </SettingsSection>
    </div>

    <!-- Export dialog -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="isExportDialogOpen" ref="exportDialogRef"
          class="fixed inset-0 z-110 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4" role="dialog"
          aria-modal="true" aria-labelledby="export-dialog-title" @click.self="cancelExport"
          @keydown.escape="cancelExport">
          <div class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-border">
            <h3 id="export-dialog-title" class="text-xl font-semibold text-rose-text mb-2">
              Export data
            </h3>
            <p class="text-sm text-rose-text-muted mb-4">
              Select the data you want to include in your backup. Folders will be automatically included if you select Notes, Docs, or Todos.
            </p>
            
            <div class="flex flex-col gap-3 mb-6">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="exportOptions.settings" class="w-4 h-4 rounded border-rose-border text-rose-primary focus:ring-rose-primary bg-rose-bg" />
                <span class="text-sm text-rose-text">Settings & Profile</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="exportOptions.notes" class="w-4 h-4 rounded border-rose-border text-rose-primary focus:ring-rose-primary bg-rose-bg" />
                <span class="text-sm text-rose-text">Notes</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="exportOptions.docs" class="w-4 h-4 rounded border-rose-border text-rose-primary focus:ring-rose-primary bg-rose-bg" />
                <span class="text-sm text-rose-text">Documents</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="exportOptions.todos" class="w-4 h-4 rounded border-rose-border text-rose-primary focus:ring-rose-primary bg-rose-bg" />
                <span class="text-sm text-rose-text">Todos</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="exportOptions.activity" class="w-4 h-4 rounded border-rose-border text-rose-primary focus:ring-rose-primary bg-rose-bg" />
                <span class="text-sm text-rose-text">Recent Activity</span>
              </label>
            </div>

            <div class="flex justify-end gap-2">
              <button
                class="px-4 py-2 text-sm rounded-md text-rose-text hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
                @click="cancelExport">
                Cancel
              </button>
              <button
                class="px-4 py-2 text-sm rounded-md bg-rose-primary text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
                :disabled="!exportOptions.settings && !exportOptions.notes && !exportOptions.docs && !exportOptions.todos && !exportOptions.activity"
                @click="confirmExport">
                Export
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Import modal -->
    <ImportModal v-model="isImportModalOpen" @imported="onImported" />

    <!-- Typed-confirmation dialog for the more destructive "Reset app" action -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="isResetDialogOpen" ref="resetDialogRef"
          class="fixed inset-0 z-110 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4" role="dialog"
          aria-modal="true" aria-labelledby="reset-dialog-title" @click.self="cancelReset"
          @keydown.escape="cancelReset">
          <div class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-border">
            <h3 id="reset-dialog-title" class="text-xl font-semibold text-rose-text mb-2">
              Reset app completely?
            </h3>
            <p class="text-sm text-rose-text-muted mb-4">
              This permanently deletes all folders, todos, docs, and your profile/preferences on
              this device. You'll go through onboarding again. This can't be undone.
            </p>
            <label for="reset-confirm-input" class="block text-xs text-rose-text-muted mb-1.5">
              Type <span class="font-mono font-semibold text-rose-text">RESET</span> to confirm
            </label>
            <input id="reset-confirm-input" v-model="resetConfirmText" type="text" autofocus
              class="w-full rounded-lg border border-rose-border bg-rose-bg px-3 py-2 text-sm text-rose-text focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 mb-5"
              @keyup.enter="confirmReset" />
            <div class="flex justify-end gap-2">
              <button
                class="px-4 py-2 text-sm rounded-md text-rose-text hover:bg-rose-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
                @click="cancelReset">
                Cancel
              </button>
              <button
                class="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                :disabled="resetConfirmText.trim().toUpperCase() !== 'RESET'" @click="confirmReset">
                Reset app
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeftIcon, DatabaseIcon, RotateCcwIcon, SlidersHorizontalIcon, UserIcon } from "@lucide/vue";
import { useSettingsStore } from "@/stores/settings";
import { useConfirm } from "@/composables/ui/useConfirm.ts";
import { useToast } from "@/composables/ui/useToast.ts";
import { useStorageEstimate } from "@/composables/app/useStorageEstimate.ts";
import { formatBytes } from "@/utils/formatBytes";
import db from "@/db";
import { exportData, type ExportOptions } from "@/utils/exportData";
import SettingsSection from "@/components/settings/SettingsSection.vue";
import SettingsRow from "@/components/settings/SettingsRow.vue";
import SettingsSwitch from "@/components/settings/SettingsSwitch.vue";
import type { FeatureType } from "@/db/types";
import SummaryComp from "@/components/ui/SummaryComp.vue";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";
import ImportModal from "@/components/settings/ImportModal.vue";

const router = useRouter();
const settingsStore = useSettingsStore();
const { confirm } = useConfirm();
const { showToast } = useToast();
const storage = useStorageEstimate();

function goBack() {
  history.go(-1);
}

const resetDialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(resetDialogRef, { escapeDeactivates: false });
watch(resetDialogRef, (el) => el ? nextTick().then(() => activate()) : deactivate());

const exportDialogRef = ref<HTMLElement | null>(null);
const { activate: activateExport, deactivate: deactivateExport } = useFocusTrap(exportDialogRef, { escapeDeactivates: false });
watch(exportDialogRef, (el) => el ? nextTick().then(() => activateExport()) : deactivateExport());

const exportOptions = ref<ExportOptions>({
  settings: true,
  notes: true,
  docs: true,
  todos: true,
  activity: true,
});
const isExportDialogOpen = ref(false);
const isImportModalOpen = ref(false);

function onImported() {
  // Force a full page reload so any imported data (including potential settings
  // changes) is reflected everywhere without requiring a manual refresh.
  globalThis.location.href = "/";
}

function openExportDialog() {
  isExportDialogOpen.value = true;
}

function cancelExport() {
  isExportDialogOpen.value = false;
}

async function confirmExport() {
  const options = { ...exportOptions.value };
  isExportDialogOpen.value = false;
  
  // Wait for the modal to close and the focus trap to deactivate completely
  // FocusTrap intercepts clicks outside the modal, which was blocking the download link
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    await exportData(options);
    showToast("Data exported successfully.", "success");
  } catch (error: unknown) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    showToast(`Failed to export data: ${message}`, "error");
  }
}

const usernameDraft = ref(settingsStore.username ?? "");

async function saveUsername() {
  const trimmed = usernameDraft.value.trim();
  if (trimmed === (settingsStore.username ?? "")) {
    return;
  }
  await settingsStore.updateUsername(usernameDraft.value);
  showToast(trimmed ? `Saved as "${trimmed}"` : "Username cleared", "info");
}

const featureOptions: { value: FeatureType; label: string; description: string }[] = [
  { description: "Checklists and folders", label: "Todos", value: "todo" },
  { description: "Handwritten sketching", label: "Notes", value: "note" },
  { description: "Rich-text documents", label: "Docs", value: "doc" },
];

async function handleReplayOnboarding() {
  const confirmed = await confirm({
    confirmLabel: "Replay",
    message: "This takes you back through the welcome setup. Your data won't be affected.",
    title: "Replay onboarding?",
  });
  if (!confirmed) {
    return;
  }
  await settingsStore.resetOnboarding();
  await router.push({ name: "onboarding" });
}

async function handleClearContent() {
  const confirmed = await confirm({
    confirmLabel: "Clear content",
    message:
      "This permanently deletes all folders, todos, and docs on this device. Your profile and preferences are kept. This can't be undone.",
    title: "Clear all content?",
  });
  if (!confirmed) {
    return;
  }
  await db.transaction("rw", [db.folders, db.todoLists, db.todos, db.notes, db.docs], async () => {
    await db.folders.clear();
    await db.todoLists.clear();
    await db.todos.clear();
    await db.notes.clear();
    await db.docs.clear();
  });
  showToast("All content cleared.", "info");
  globalThis.location.href = "/";
}

const isResetDialogOpen = ref(false);
const resetConfirmText = ref("");

function openResetDialog() {
  resetConfirmText.value = "";
  isResetDialogOpen.value = true;
}

function cancelReset() {
  isResetDialogOpen.value = false;
}

async function confirmReset() {
  if (resetConfirmText.value.trim().toUpperCase() !== "RESET") {
    return;
  }
  await db.transaction("rw", [db.folders, db.todoLists, db.todos, db.notes, db.docs, db.settings], async () => {
    await db.folders.clear();
    await db.todoLists.clear();
    await db.todos.clear();
    await db.notes.clear();
    await db.docs.clear();
    await db.settings.clear();
  });
  isResetDialogOpen.value = false;
  showToast("App has been reset.", "info");
  globalThis.location.href = "/";
}

onMounted(storage.refresh);
</script>
