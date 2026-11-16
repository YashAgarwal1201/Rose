<!-- src/components/docs/DocTableContextBar.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { Editor } from "@tiptap/vue-3";
import { useDocTableActions } from "@/composables/docs/useDocTableActions";
import { A4_SHEET_WIDTH_PX } from "@/composables/docs/usePageView";

const props = defineProps<{
  editor?: Editor;
  isReadMode?: boolean;
  isPageView?: boolean;
  isFullWidth?: boolean;
  effectiveScale?: number;
}>();

const editorRef = computed(() => props.editor);
const {
  isCellBgPickerOpen,
  cellBgRootRef,
  cellBgTriggerRef,
  cellBgPopoverRef,
  cellBgAnchor,
  CELL_BG_COLORS,
  isTableAtMaxRows,
  isTableAtMaxCols,
  isCurrentTableBordered,
  toggleTableBorders,
  addRowBeforeGuarded,
  addRowAfterGuarded,
  addColumnBeforeGuarded,
  addColumnAfterGuarded,
  toggleCellBgPicker,
  applyCellBackground,
} = useDocTableActions({ editor: editorRef });
</script>

<template>
  <div
    v-if="!isReadMode && editor?.isActive('table')"
    ref="cellBgRootRef"
    class="relative mb-3 mt-2 rounded-lg bg-rose-surface border border-rose-border shrink-0"
    :style="{
      maxWidth: isPageView
        ? `${A4_SHEET_WIDTH_PX * (effectiveScale ?? 1)}px`
        : isFullWidth
          ? 'min(100%, 1400px)'
          : 'clamp(320px, 72ch, 860px)',
      marginLeft: 'auto',
      marginRight: 'auto',
      width: '100%',
    }"
  >
    <div
      v-if="isCellBgPickerOpen"
      class="fixed inset-0 z-10"
      @click="
        isCellBgPickerOpen = false;
        cellBgAnchor.close();
      "
    ></div>

    <div class="flex items-center gap-1 p-1.5 overflow-x-auto" style="scrollbar-width: none">
      <span class="text-xs text-rose-text-muted px-1 shrink-0">Table:</span>
      <button
        class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
        :disabled="isTableAtMaxRows()"
        aria-label="Insert row above"
        @click="addRowBeforeGuarded"
      >
        ↑ Row
      </button>
      <button
        class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
        :disabled="isTableAtMaxRows()"
        aria-label="Insert row below"
        @click="addRowAfterGuarded"
      >
        ↓ Row
      </button>
      <button
        class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
        aria-label="Delete current row"
        @click="editor?.chain().focus().deleteRow().run()"
      >
        Del row
      </button>

      <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0" role="separator"></div>

      <button
        class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
        :disabled="isTableAtMaxCols()"
        aria-label="Insert column before"
        @click="addColumnBeforeGuarded"
      >
        ← Col
      </button>
      <button
        class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
        :disabled="isTableAtMaxCols()"
        aria-label="Insert column after"
        @click="addColumnAfterGuarded"
      >
        → Col
      </button>
      <button
        class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
        aria-label="Delete current column"
        @click="editor?.chain().focus().deleteColumn().run()"
      >
        Del col
      </button>

      <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0" role="separator"></div>

      <button
        ref="cellBgTriggerRef"
        class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt"
        :aria-expanded="isCellBgPickerOpen"
        aria-haspopup="dialog"
        aria-label="Cell background color"
        @click="toggleCellBgPicker"
      >
        Cell color
      </button>

      <button
        class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
        :aria-label="isCurrentTableBordered() ? 'Hide table borders' : 'Show table borders'"
        @click="toggleTableBorders"
      >
        {{ isCurrentTableBordered() ? "Hide borders" : "Show borders" }}
      </button>

      <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0" role="separator"></div>

      <button
        class="px-2 py-1 rounded text-xs text-red-400 hover:bg-rose-surface-alt shrink-0"
        aria-label="Delete table"
        @click="editor?.chain().focus().deleteTable().run()"
      >
        Delete table
      </button>
    </div>

    <div
      v-if="isCellBgPickerOpen"
      ref="cellBgPopoverRef"
      class="absolute z-20 grid grid-cols-4 gap-1.5 p-2 w-40 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="cellBgAnchor.style"
    >
      <button
        v-for="color in CELL_BG_COLORS"
        :key="color.label"
        class="w-6 h-6 rounded-full border border-rose-border flex items-center justify-center text-xs"
        :style="color.value ? { backgroundColor: color.value } : {}"
        :title="color.label"
        :aria-label="
          color.value ? `Set cell background to ${color.label}` : 'Clear cell background color'
        "
        @click="applyCellBackground(color.value)"
      >
        <span v-if="!color.value" class="text-rose-text-muted">×</span>
      </button>
    </div>
  </div>
</template>
