<!-- src/components/docs/DocHeader.vue -->
<script setup lang="ts">
import { ref } from "vue";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ChevronDownIcon,
  FileTextIcon,
  MaximizeIcon,
  MinimizeIcon,
  MinusIcon,
  PanelBottomIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PanelTopIcon,
  PencilIcon,
  PlusIcon,
} from "@lucide/vue";
import type { ToolbarPosition } from "@/composables/ui/useToolbarPosition";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

const props = defineProps<{
  title?: string;
  updatedAt?: number;
  isRenaming: boolean;
  renameValue: string;
  isReadMode: boolean;
  isDesktop: boolean;
  isPageView: boolean;
  isFullWidth: boolean;
  pageCount: number;
  zoomLevel: number | "fit";
  effectiveScale: number;
  savedPosition: ToolbarPosition;
}>();

const emit = defineEmits<{
  (e: "back"): void;
  (e: "startRename"): void;
  (e: "confirmRename"): void;
  (e: "cancelRename"): void;
  (e: "update:renameValue", val: string): void;
  (e: "setReadMode", val: boolean): void;
  (e: "togglePageView"): void;
  (e: "toggleFullWidth"): void;
  (e: "zoomIn"): void;
  (e: "zoomOut"): void;
  (e: "cycleZoom"): void;
  (e: "setPosition", pos: ToolbarPosition): void;
}>();

const isViewMenuOpen = ref(false);

function toggleViewMenu() {
  isViewMenuOpen.value = !isViewMenuOpen.value;
}

function closeViewMenu() {
  isViewMenuOpen.value = false;
}

function selectContinuous() {
  if (props.isPageView) {
    emit("togglePageView");
  }
}

const vFocus = {
  mounted: (el: HTMLElement) => el.focus(),
};
</script>

<template>
  <div class="flex items-center gap-2 px-3 pt-3 pb-2 md:px-6 md:pt-4 md:pb-2 shrink-0">
    <!-- Back button -->
    <button
      class="flex items-center gap-1.5 text-sm text-rose-text-muted hover:text-rose-text transition-colors shrink-0"
      @click="emit('back')"
      aria-label="Back to files"
    >
      <ArrowLeftIcon class="w-4 h-4" />
    </button>

    <!-- Title and Rename -->
    <div class="flex items-center gap-2 flex-1 min-w-0 ml-1 group">
      <input
        v-if="isRenaming"
        :value="renameValue"
        type="text"
        v-focus
        aria-label="Document title"
        class="text-base sm:text-xl font-bold bg-transparent border-b-2 border-rose-primary text-rose-text focus:outline-none min-w-0 flex-1"
        @input="emit('update:renameValue', ($event.target as HTMLInputElement).value)"
        @keyup.enter="emit('confirmRename')"
        @keyup.escape="emit('cancelRename')"
        @blur="emit('confirmRename')"
      />
      <template v-else>
        <h1 class="text-base sm:text-xl font-bold text-rose-text truncate">{{ title }}</h1>
        <button
          v-if="!isReadMode"
          class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary transition-opacity shrink-0"
          aria-label="Rename document"
          @click="emit('startRename')"
        >
          <PencilIcon class="w-4 h-4" />
        </button>
      </template>
    </div>

    <!-- Saved timestamp (hidden on extra small screens to conserve room) -->
    <span v-if="updatedAt" class="hidden sm:inline text-xs text-rose-text-muted shrink-0">
      Saved {{ formatRelativeTime(updatedAt) }}
    </span>

    <!-- Unified "View ▾" Dropdown (Option 3: Works for both Desktop and Mobile, Edit & Read Mode) -->
    <div class="relative shrink-0">
      <!-- Backdrop to close dropdown on click outside -->
      <div
        v-if="isViewMenuOpen"
        class="fixed inset-0 z-30"
        @click="closeViewMenu"
      ></div>

      <button
        type="button"
        class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-surface-alt border border-rose-border text-rose-text hover:bg-rose-surface transition-colors"
        :title="isPageView ? 'Page View settings' : 'View settings'"
        :aria-expanded="isViewMenuOpen"
        aria-haspopup="dialog"
        aria-label="View and layout options"
        @click="toggleViewMenu"
      >
        <FileTextIcon v-if="isPageView" class="w-4 h-4 text-rose-primary" />
        <span>{{ isPageView ? `A4 · ${Math.round(effectiveScale * 100)}%` : "Continuous" }}</span>
        <ChevronDownIcon
          class="w-3.5 h-3.5 text-rose-text-muted transition-transform"
          :class="{ 'rotate-180': isViewMenuOpen }"
        />
      </button>

      <!-- Popover Menu Panel (always mounted in DOM with v-show for instant accessibility & test stability) -->
      <div
        v-show="isViewMenuOpen"
        class="absolute right-0 top-full mt-2 z-40 w-72 p-3.5 rounded-xl bg-rose-surface border border-rose-border shadow-xl flex flex-col gap-3.5"
      >
        <!-- Page Layout section -->
        <div>
          <div class="text-xs font-semibold text-rose-text-muted uppercase tracking-wider mb-2">
            Document View
          </div>
          <div class="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-rose-bg border border-rose-border">
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors"
              :class="!isPageView ? 'bg-rose-surface text-rose-primary shadow-xs' : 'text-rose-text-muted hover:text-rose-text'"
              @click="selectContinuous"
            >
              <span>Continuous</span>
            </button>

            <button
              type="button"
              data-testid="page-view-toggle-btn"
              :aria-pressed="isPageView"
              class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors"
              :class="isPageView ? 'bg-rose-primary text-white shadow-xs' : 'text-rose-text-muted hover:text-rose-text'"
              @click="emit('togglePageView')"
            >
              <FileTextIcon class="w-4 h-4" />
              <span>A4 Page</span>
            </button>
          </div>
        </div>

        <!-- Width section (Continuous view only) -->
        <div v-if="!isPageView">
          <div class="text-xs font-semibold text-rose-text-muted uppercase tracking-wider mb-2">
            Content Width
          </div>
          <button
            type="button"
            data-testid="full-width-toggle-btn"
            :aria-pressed="isFullWidth"
            class="w-full flex items-center justify-between py-2 px-3 rounded-lg border border-rose-border text-sm text-rose-text bg-rose-surface-alt hover:bg-rose-surface transition-colors"
            @click="emit('toggleFullWidth')"
          >
            <span class="flex items-center gap-2">
              <MaximizeIcon v-if="!isFullWidth" class="w-4 h-4 text-rose-text-muted" />
              <MinimizeIcon v-else class="w-4 h-4 text-rose-primary" />
              <span>{{ isFullWidth ? "Full width layout" : "Standard width (72ch)" }}</span>
            </span>
            <span class="text-xs text-rose-text-muted font-medium">{{ isFullWidth ? "Wide" : "Centered" }}</span>
          </button>
        </div>

        <!-- Zoom & Scale section (Page View only) -->
        <div v-if="isPageView" class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs font-semibold text-rose-text-muted uppercase tracking-wider">
            <span>Zoom & Scale</span>
            <span class="text-xs text-rose-text font-semibold select-none" aria-live="polite">
              {{ pageCount }} {{ pageCount === 1 ? "page" : "pages" }}
            </span>
          </div>

          <!-- Stepper row -->
          <div
            class="flex items-center justify-between bg-rose-bg border border-rose-border rounded-lg p-1.5"
            role="group"
            aria-label="Zoom controls"
          >
            <button
              type="button"
              class="p-2 rounded-md text-rose-text-muted hover:text-rose-text hover:bg-rose-surface disabled:opacity-40 transition-colors"
              :disabled="effectiveScale <= 0.5"
              :aria-disabled="effectiveScale <= 0.5"
              title="Zoom out"
              aria-label="Zoom out"
              @click="emit('zoomOut')"
            >
              <MinusIcon class="w-4 h-4" />
            </button>

            <button
              type="button"
              data-testid="zoom-level-btn"
              class="px-3 py-1.5 text-sm font-semibold text-rose-text hover:bg-rose-surface rounded-md transition-colors"
              title="Cycle zoom preset (Fit / 100% / 125% / 75%)"
              :aria-label="`Zoom level: ${zoomLevel === 'fit' ? 'Fit to width' : Math.round(effectiveScale * 100) + '%'}. Click to change preset`"
              @click="emit('cycleZoom')"
            >
              {{ zoomLevel === "fit" ? "Fit" : `${Math.round(effectiveScale * 100)}%` }}
            </button>

            <button
              type="button"
              class="p-2 rounded-md text-rose-text-muted hover:text-rose-text hover:bg-rose-surface disabled:opacity-40 transition-colors"
              :disabled="effectiveScale >= 1.5"
              :aria-disabled="effectiveScale >= 1.5"
              title="Zoom in"
              aria-label="Zoom in"
              @click="emit('zoomIn')"
            >
              <PlusIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode toggle button (Pattern A: Persistent in header for both Read and Edit mode) -->
    <button
      type="button"
      data-testid="mode-toggle-btn"
      :title="isReadMode ? 'Switch to edit mode' : 'Switch to read mode'"
      :aria-label="isReadMode ? 'Switch to edit mode' : 'Switch to read mode'"
      class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-surface-alt border border-rose-border text-rose-text hover:bg-rose-surface transition-colors shrink-0"
      @click="emit('setReadMode', !isReadMode)"
    >
      <PencilIcon v-if="isReadMode" class="w-3.5 h-3.5 text-rose-primary" />
      <BookOpenIcon v-else class="w-3.5 h-3.5 text-rose-text-muted" />
      <span class="hidden sm:inline">{{ isReadMode ? "Edit mode" : "Read mode" }}</span>
    </button>

    <!-- Toolbar position buttons (desktop edit mode only) -->
    <div
      v-if="isDesktop && !isReadMode"
      role="toolbar"
      aria-label="Document layout and view controls"
      class="flex items-center gap-0.5 shrink-0"
    >
      <button
        v-for="pos in ['top', 'left', 'right', 'bottom'] as ToolbarPosition[]"
        :key="pos"
        :title="`Toolbar ${pos}`"
        :aria-label="`Place toolbar at ${pos}`"
        :aria-pressed="savedPosition === pos"
        class="p-1 rounded transition-colors"
        :class="
          savedPosition === pos
            ? 'text-rose-primary'
            : 'text-rose-text-muted hover:text-rose-text'
        "
        @click="emit('setPosition', pos)"
      >
        <PanelTopIcon v-if="pos === 'top'" class="w-4 h-4" />
        <PanelBottomIcon v-else-if="pos === 'bottom'" class="w-4 h-4" />
        <PanelLeftIcon v-else-if="pos === 'left'" class="w-4 h-4" />
        <PanelRightIcon v-else-if="pos === 'right'" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
