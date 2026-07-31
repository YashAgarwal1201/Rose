<!-- src/components/DocToolbar.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { Editor } from "@tiptap/core";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CheckSquareIcon,
  CodeIcon,
  DownloadIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HighlighterIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PaletteIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  UnderlineIcon,
  Undo2Icon,
} from "@lucide/vue";
import type { ToolbarPosition } from "../composables/useToolbarPosition";
import { type PopoverPlacement, usePopoverPosition } from "../composables/usePopoverPosition";

const { editor, maxTableRows, maxTableCols, position } = defineProps<{
  editor: Editor;
  maxTableRows: number;
  maxTableCols: number;
  position: ToolbarPosition;
}>();

const emit = defineEmits<{
  triggerImagePick: [];
  setLink: [];
  insertTable: [rows: number, cols: number];
  triggerCsvPick: [];
  exportAsHtml: [];
  exportAsMarkdown: [];
  exportAsText: [];
  exportAsPdf: [];
}>();

const TEXT_COLORS = [
  { label: "Default", value: null },
  { label: "Red", value: "#f87171" },
  { label: "Rose", value: "#fb7185" },
  { label: "Orange", value: "#fb923c" },
  { label: "Amber", value: "#fbbf24" },
  { label: "Yellow", value: "#facc15" },
  { label: "Lime", value: "#a3e635" },
  { label: "Green", value: "#4ade80" },
  { label: "Emerald", value: "#34d399" },
  { label: "Teal", value: "#2dd4bf" },
  { label: "Cyan", value: "#22d3ee" },
  { label: "Sky", value: "#38bdf8" },
  { label: "Blue", value: "#60a5fa" },
  { label: "Indigo", value: "#818cf8" },
  { label: "Violet", value: "#a78bfa" },
  { label: "Purple", value: "#c084fc" },
  { label: "Fuchsia", value: "#e879f9" },
  { label: "Pink", value: "#f472b6" },
  { label: "Slate", value: "#94a3b8" },
  { label: "Stone", value: "#a8a29e" },
];

const HIGHLIGHT_COLORS = [
  { label: "None", value: null },
  { label: "Yellow", value: "#fef08a" },
  { label: "Amber", value: "#fde68a" },
  { label: "Lime", value: "#d9f99d" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Teal", value: "#99f6e4" },
  { label: "Cyan", value: "#a5f3fc" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Indigo", value: "#c7d2fe" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Rose", value: "#fecdd3" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Gray", value: "#e2e8f0" },
];

const tableRowCount = ref(3);
const tableColCount = ref(3);
const customTextColor = ref("#ffffff");
const customHighlightColor = ref("#fef08a");

const isTableInsertOpen = ref(false);
const isColorPickerOpen = ref(false);
const isHighlightPickerOpen = ref(false);
const isExportMenuOpen = ref(false);

// Outer (non-clipping) root and the inner scrollable button row.
const rootRef = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);

// Trigger buttons
const tableTriggerRef = ref<HTMLButtonElement | null>(null);
const colorTriggerRef = ref<HTMLButtonElement | null>(null);
const highlightTriggerRef = ref<HTMLButtonElement | null>(null);
const exportTriggerRef = ref<HTMLButtonElement | null>(null);

// Popover panels — rendered as siblings of `scrollRef`, not inside it.
const tablePopoverRef = ref<HTMLElement | null>(null);
const colorPopoverRef = ref<HTMLElement | null>(null);
const highlightPopoverRef = ref<HTMLElement | null>(null);
const exportPopoverRef = ref<HTMLElement | null>(null);

// Start-aligned popovers (table insert, color, highlight)
const startPlacement = computed<PopoverPlacement>(() => {
  if (position === "left") {
    return "right-start";
  }
  if (position === "right") {
    return "left-start";
  }
  if (position === "bottom") {
    return "top-start";
  }
  return "bottom-start"; // top
});

// End-aligned popover (export menu)
const endPlacement = computed<PopoverPlacement>(() => {
  if (position === "left") {
    return "right-end";
  }
  if (position === "right") {
    return "left-end";
  }
  if (position === "bottom") {
    return "top-end";
  }
  return "bottom-end"; // top
});

const tableAnchor = usePopoverPosition(rootRef, tableTriggerRef, tablePopoverRef, startPlacement);
const colorAnchor = usePopoverPosition(rootRef, colorTriggerRef, colorPopoverRef, startPlacement);
const highlightAnchor = usePopoverPosition(
  rootRef,
  highlightTriggerRef,
  highlightPopoverRef,
  startPlacement,
);
const exportAnchor = usePopoverPosition(rootRef, exportTriggerRef, exportPopoverRef, endPlacement);

const isAnyPopoverOpen = computed(
  () =>
    isTableInsertOpen.value ||
    isColorPickerOpen.value ||
    isHighlightPickerOpen.value ||
    isExportMenuOpen.value,
);

function closeAllPopovers() {
  isTableInsertOpen.value = false;
  isColorPickerOpen.value = false;
  isHighlightPickerOpen.value = false;
  isExportMenuOpen.value = false;
  tableAnchor.close();
  colorAnchor.close();
  highlightAnchor.close();
  exportAnchor.close();
}

function toggleTableInsert() {
  const next = !isTableInsertOpen.value;
  closeAllPopovers();
  if (next) {
    isTableInsertOpen.value = true;
    tableAnchor.open();
  }
}

function toggleColorPicker() {
  const next = !isColorPickerOpen.value;
  closeAllPopovers();
  if (next) {
    isColorPickerOpen.value = true;
    colorAnchor.open();
  }
}

function toggleHighlightPicker() {
  const next = !isHighlightPickerOpen.value;
  closeAllPopovers();
  if (next) {
    isHighlightPickerOpen.value = true;
    highlightAnchor.open();
  }
}

function toggleExportMenu() {
  const next = !isExportMenuOpen.value;
  closeAllPopovers();
  if (next) {
    isExportMenuOpen.value = true;
    exportAnchor.open();
  }
}

// Close (rather than let it drift) if the toolbar itself is scrolled while a popover is open.
function handleScrollRefScroll() {
  if (isAnyPopoverOpen.value) {
    closeAllPopovers();
  }
}

onMounted(() => {
  scrollRef.value?.addEventListener("scroll", handleScrollRefScroll, { passive: true });
});

onBeforeUnmount(() => {
  scrollRef.value?.removeEventListener("scroll", handleScrollRefScroll);
});

// Whether toolbar is vertical (left/right)
const isVertical = computed(() => position === "left" || position === "right");

// Root — background, border, z-index, and structural placement only.
// Deliberately NO overflow here, so it never clips the popovers.
const rootClasses = computed(() => {
  const base = "bg-rose-surface border-rose-border z-20 relative ";
  if (position === "left") {
    return `${base} border-r w-12 shrink-0`;
  }
  if (position === "right") {
    return `${base} w-12 shrink-0`;
  }
  if (position === "bottom") {
    return `${base} border-t absolute bottom-0 left-0 right-0`;
  }
  return `${base} border sticky top-0`; // top
});

// Scroll container — holds ONLY the buttons, owns the overflow clipping.
const scrollClasses = computed(() => {
  if (position === "left" || position === "right") {
    return "flex flex-col items-center gap-1 p-1.5 overflow-y-auto overflow-x-hidden w-full h-full";
  }
  // top / bottom
  return "flex flex-row items-center gap-1 p-1.5 overflow-x-auto overflow-y-hidden w-full";
});

// Divider classes — horizontal line for vertical toolbar, vertical line for horizontal
const dividerClass = computed(() =>
  isVertical.value
    ? "h-px w-6 bg-rose-border my-0.5 shrink-0"
    : "w-px h-5 bg-rose-border mx-0.5 shrink-0",
);

function btnClass(active: boolean) {
  return active
    ? "p-1.5 rounded bg-rose-primary text-white shrink-0"
    : "p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt shrink-0";
}

function applyTextColor(color: string | null) {
  if (color) {
    editor.chain().focus().setColor(color).run();
  } else {
    editor.chain().focus().unsetColor().run();
  }
  closeAllPopovers();
}

function applyHighlight(color: string | null) {
  if (color) {
    editor.chain().focus().toggleHighlight({ color }).run();
  } else {
    editor.chain().focus().unsetHighlight().run();
  }
  closeAllPopovers();
}

function handleInsertTable() {
  const rows = Math.min(Math.max(tableRowCount.value, 1), maxTableRows);
  const cols = Math.min(Math.max(tableColCount.value, 1), maxTableCols);
  emit("insertTable", rows, cols);
  closeAllPopovers();
}

function handleTriggerCsvPick() {
  emit("triggerCsvPick");
  closeAllPopovers();
}
</script>

<template>
  <div ref="rootRef" :class="rootClasses">
    <!-- Backdrop: closes whichever popover is open on outside click -->
    <div v-if="isAnyPopoverOpen" class="fixed inset-0 z-30" aria-hidden="true" tabindex="-1" @click="closeAllPopovers"></div>

    <div ref="scrollRef" :class="scrollClasses">
      <!-- Group: History -->
      <button
        :class="btnClass(false)"
        :disabled="!editor.can().undo()"
        title="Undo"
        aria-label="Undo"
        @click="editor.chain().focus().undo().run()"
      >
        <Undo2Icon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(false)"
        :disabled="!editor.can().redo()"
        title="Redo"
        aria-label="Redo"
        @click="editor.chain().focus().redo().run()"
      >
        <Redo2Icon class="w-4 h-4" />
      </button>

      <div :class="dividerClass"></div>

      <!-- Group: Text style -->
      <button
        :class="btnClass(editor.isActive('bold'))"
        title="Bold"
        aria-label="Bold"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <BoldIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('italic'))"
        title="Italic"
        aria-label="Italic"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <ItalicIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('strike'))"
        title="Strikethrough"
        aria-label="Strikethrough"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <StrikethroughIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('underline'))"
        title="Underline"
        aria-label="Underline"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <UnderlineIcon class="w-4 h-4" />
      </button>

      <div :class="dividerClass"></div>

      <!-- Group: Headings -->
      <button
        :class="btnClass(editor.isActive('heading', { level: 1 }))"
        title="Heading 1"
        aria-label="Heading 1"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <Heading1Icon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('heading', { level: 2 }))"
        title="Heading 2"
        aria-label="Heading 2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <Heading2Icon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('heading', { level: 3 }))"
        title="Heading 3"
        aria-label="Heading 3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <Heading3Icon class="w-4 h-4" />
      </button>

      <div :class="dividerClass" />

      <button
        :class="btnClass(editor.isActive('subscript'))"
        title="Subscript"
        aria-label="Subscript"
        @click="editor.chain().focus().toggleSubscript().run()"
      >
        <SubscriptIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('superscript'))"
        title="Superscript"
        aria-label="Superscript"
        @click="editor.chain().focus().toggleSuperscript().run()"
      >
        <SuperscriptIcon class="w-4 h-4" />
      </button>

      <div :class="dividerClass"></div>

      <!-- Group: Lists -->
      <button
        :class="btnClass(editor.isActive('bulletList'))"
        title="Bullet list"
        aria-label="Bullet list"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <ListIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('orderedList'))"
        title="Ordered list"
        aria-label="Ordered list"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <ListOrderedIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('taskList'))"
        title="Task list"
        aria-label="Task list"
        @click="editor.chain().focus().toggleTaskList().run()"
      >
        <CheckSquareIcon class="w-4 h-4" />
      </button>

      <div :class="dividerClass"></div>

      <!-- Group: Blocks -->
      <button
        :class="btnClass(editor.isActive('blockquote'))"
        title="Blockquote"
        aria-label="Blockquote"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <QuoteIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive('codeBlock'))"
        title="Code block"
        aria-label="Code block"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        <CodeIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(false)"
        title="Horizontal rule"
        aria-label="Horizontal rule"
        @click="editor.chain().focus().setHorizontalRule().run()"
      >
        <MinusIcon class="w-4 h-4" />
      </button>

      <div :class="dividerClass"></div>

      <!-- Group: Insert -->
      <button :class="btnClass(editor.isActive('link'))" title="Link" aria-label="Link" @click="emit('setLink')">
        <LinkIcon class="w-4 h-4" />
      </button>
      <button :class="btnClass(false)" title="Image" aria-label="Image" @click="emit('triggerImagePick')">
        <ImageIcon class="w-4 h-4" />
      </button>

      <button
        ref="tableTriggerRef"
        :class="btnClass(isTableInsertOpen)"
        title="Table"
        aria-label="Table"
        :aria-expanded="isTableInsertOpen"
        @click="toggleTableInsert"
      >
        <TableIcon class="w-4 h-4" />
      </button>

      <div :class="dividerClass"></div>

      <!-- Group: Align -->
      <button
        :class="btnClass(editor.isActive({ textAlign: 'left' }))"
        title="Align left"
        aria-label="Align left"
        @click="editor.chain().focus().setTextAlign('left').run()"
      >
        <AlignLeftIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive({ textAlign: 'center' }))"
        title="Align center"
        aria-label="Align center"
        @click="editor.chain().focus().setTextAlign('center').run()"
      >
        <AlignCenterIcon class="w-4 h-4" />
      </button>
      <button
        :class="btnClass(editor.isActive({ textAlign: 'right' }))"
        title="Align right"
        aria-label="Align right"
        @click="editor.chain().focus().setTextAlign('right').run()"
      >
        <AlignRightIcon class="w-4 h-4" />
      </button>

      <div :class="dividerClass"></div>

      <!-- Group: Color -->
      <button
        ref="colorTriggerRef"
        :class="btnClass(isColorPickerOpen)"
        title="Text color"
        aria-label="Text color"
        :aria-expanded="isColorPickerOpen"
        @click="toggleColorPicker"
      >
        <PaletteIcon class="w-4 h-4" />
      </button>
      <button
        ref="highlightTriggerRef"
        :class="btnClass(isHighlightPickerOpen)"
        title="Highlight"
        aria-label="Highlight"
        :aria-expanded="isHighlightPickerOpen"
        @click="toggleHighlightPicker"
      >
        <HighlighterIcon class="w-4 h-4" />
      </button>

      <div :class="dividerClass"></div>

      <!-- Group: Export -->
      <button
        ref="exportTriggerRef"
        :class="btnClass(isExportMenuOpen)"
        title="Export"
        aria-label="Export"
        :aria-expanded="isExportMenuOpen"
        @click="toggleExportMenu"
      >
        <DownloadIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Popovers: siblings of the scroll container, so its overflow can't clip them -->
    <div
      v-if="isTableInsertOpen"
      ref="tablePopoverRef"
      class="absolute z-40 flex flex-col gap-2 p-3 w-56 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="tableAnchor.style"
    >
      <label class="flex items-center justify-between gap-2 text-sm text-rose-text">
        Rows
        <input
          v-model.number="tableRowCount"
          type="number"
          min="1"
          :max="maxTableRows"
          class="w-14 px-1.5 py-0.5 rounded border border-rose-border bg-rose-bg text-rose-text text-sm"
        />
      </label>
      <label class="flex items-center justify-between gap-2 text-sm text-rose-text">
        Columns
        <input
          v-model.number="tableColCount"
          type="number"
          min="1"
          :max="maxTableCols"
          class="w-14 px-1.5 py-0.5 rounded border border-rose-border bg-rose-bg text-rose-text text-sm"
        />
      </label>
      <button
        class="mt-1 px-2 py-1.5 rounded bg-rose-primary text-white text-sm font-medium"
        @click="handleInsertTable"
      >
        Insert blank table
      </button>
      <div class="h-px bg-rose-border my-1"></div>
      <button
        class="px-2 py-1.5 rounded border border-rose-border text-rose-text text-sm font-medium hover:bg-rose-surface-alt"
        @click="handleTriggerCsvPick"
      >
        Import from CSV
      </button>
    </div>

    <div
      v-if="isColorPickerOpen"
      ref="colorPopoverRef"
      class="absolute z-40 grid grid-cols-6 gap-1.5 p-2 w-52 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="colorAnchor.style"
    >
      <button
        v-for="color in TEXT_COLORS"
        :key="color.label"
        class="w-6 h-6 rounded-full border border-rose-border flex items-center justify-center text-xs shrink-0"
        :style="color.value ? { backgroundColor: color.value } : {}"
        :title="color.label"
        :aria-label="color.label"
        @click="applyTextColor(color.value)"
      >
        <span v-if="!color.value" class="text-rose-text-muted">×</span>
      </button>
      <label
        class="w-6 h-6 rounded-full border border-rose-border overflow-hidden relative cursor-pointer shrink-0"
        title="Custom color"
        aria-label="Custom color"
      >
        <input
          v-model="customTextColor"
          type="color"
          class="absolute inset-0 w-8 h-8 -m-1 cursor-pointer"
          @input="applyTextColor(customTextColor)"
        />
      </label>
    </div>

    <div
      v-if="isHighlightPickerOpen"
      ref="highlightPopoverRef"
      class="absolute z-40 grid grid-cols-6 gap-1.5 p-2 w-52 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="highlightAnchor.style"
    >
      <button
        v-for="color in HIGHLIGHT_COLORS"
        :key="color.label"
        class="w-6 h-6 rounded-full border border-rose-border flex items-center justify-center text-xs shrink-0"
        :style="color.value ? { backgroundColor: color.value } : {}"
        :title="color.label"
        :aria-label="color.label"
        @click="applyHighlight(color.value)"
      >
        <span v-if="!color.value" class="text-rose-text-muted">×</span>
      </button>
      <label
        class="w-6 h-6 rounded-full border border-rose-border overflow-hidden relative cursor-pointer shrink-0"
        title="Custom color"
        aria-label="Custom color"
      >
        <input
          v-model="customHighlightColor"
          type="color"
          class="absolute inset-0 w-8 h-8 -m-1 cursor-pointer"
          @input="applyHighlight(customHighlightColor)"
        />
      </label>
    </div>

    <div
      v-if="isExportMenuOpen"
      ref="exportPopoverRef"
      class="absolute z-40 flex flex-col w-44 rounded-lg bg-rose-surface border border-rose-border shadow-lg overflow-hidden"
      :style="exportAnchor.style"
    >
      <button
        class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="
          emit('exportAsHtml');
          closeAllPopovers();
        "
      >
        Export as HTML
      </button>
      <button
        class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="
          emit('exportAsMarkdown');
          closeAllPopovers();
        "
      >
        Export as Markdown
      </button>
      <button
        class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="
          emit('exportAsText');
          closeAllPopovers();
        "
      >
        Export as Text
      </button>
      <div class="h-px bg-rose-border"></div>
      <button
        class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="
          emit('exportAsPdf');
          closeAllPopovers();
        "
      >
        Print / Save as PDF
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar on the scroll row but keep it scrollable */
div::-webkit-scrollbar {
  display: none;
}
div {
  scrollbar-width: none;
}
</style>
