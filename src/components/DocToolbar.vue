<!-- src/components/DocToolbar.vue -->
<script setup lang="ts">
import { ref } from "vue";
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
  TableIcon,
  Undo2Icon,
} from "@lucide/vue";

const props = defineProps<{
  editor: Editor;
  maxTableRows: number;
  maxTableCols: number;
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
const isTableInsertOpen = ref(false);
const isColorPickerOpen = ref(false);
const isHighlightPickerOpen = ref(false);
const isExportMenuOpen = ref(false);
const customTextColor = ref("#ffffff");
const customHighlightColor = ref("#fef08a");

function applyTextColor(color: string | null) {
  if (color) {
    props.editor.chain().focus().setColor(color).run();
  } else {
    props.editor.chain().focus().unsetColor().run();
  }
  isColorPickerOpen.value = false;
}

function applyHighlight(color: string | null) {
  if (color) {
    props.editor.chain().focus().toggleHighlight({ color }).run();
  } else {
    props.editor.chain().focus().unsetHighlight().run();
  }
  isHighlightPickerOpen.value = false;
}

function handleInsertTable() {
  const rows = Math.min(Math.max(tableRowCount.value, 1), props.maxTableRows);
  const cols = Math.min(Math.max(tableColCount.value, 1), props.maxTableCols);
  emit("insertTable", rows, cols);
  isTableInsertOpen.value = false;
}

function handleTriggerCsvPick() {
  emit("triggerCsvPick");
  isTableInsertOpen.value = false;
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-1 mb-3 p-1.5 rounded-lg bg-rose-surface border border-rose-border sticky top-0 z-10"
  >
    <!-- Bold / Italic / Strike -->
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('bold')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleBold().run()"
    >
      <BoldIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('italic')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleItalic().run()"
    >
      <ItalicIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('strike')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleStrike().run()"
    >
      <StrikethroughIcon class="w-4 h-4" />
    </button>

    <div class="w-px h-5 bg-rose-border mx-1"></div>

    <!-- Headings -->
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('heading', { level: 1 })
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
    >
      <Heading1Icon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('heading', { level: 2 })
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
    >
      <Heading2Icon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('heading', { level: 3 })
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
    >
      <Heading3Icon class="w-4 h-4" />
    </button>

    <div class="w-px h-5 bg-rose-border mx-1"></div>

    <!-- Lists -->
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('bulletList')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleBulletList().run()"
    >
      <ListIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('orderedList')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleOrderedList().run()"
    >
      <ListOrderedIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('taskList')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleTaskList().run()"
    >
      <CheckSquareIcon class="w-4 h-4" />
    </button>

    <div class="w-px h-5 bg-rose-border mx-1"></div>

    <!-- Block types -->
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('blockquote')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleBlockquote().run()"
    >
      <QuoteIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('codeBlock')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().toggleCodeBlock().run()"
    >
      <CodeIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt"
      @click="editor.chain().focus().setHorizontalRule().run()"
    >
      <MinusIcon class="w-4 h-4" />
    </button>

    <div class="w-px h-5 bg-rose-border mx-1"></div>

    <!-- Link / Image -->
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive('link')
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="emit('setLink')"
    >
      <LinkIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt"
      @click="emit('triggerImagePick')"
    >
      <ImageIcon class="w-4 h-4" />
    </button>

    <!-- Table insert popover -->
    <div class="relative">
      <button
        class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt"
        @click="isTableInsertOpen = !isTableInsertOpen"
      >
        <TableIcon class="w-4 h-4" />
      </button>
      <div
        v-if="isTableInsertOpen"
        class="fixed inset-0 z-10"
        @click="isTableInsertOpen = false"
      ></div>
      <div
        v-if="isTableInsertOpen"
        class="absolute top-full left-0 mt-1 z-20 flex flex-col gap-2 p-3 w-56 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
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
    </div>

    <div class="w-px h-5 bg-rose-border mx-1"></div>

    <!-- Undo / Redo -->
    <button
      class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt disabled:opacity-40"
      :disabled="!editor.can().undo()"
      @click="editor.chain().focus().undo().run()"
    >
      <Undo2Icon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt disabled:opacity-40"
      :disabled="!editor.can().redo()"
      @click="editor.chain().focus().redo().run()"
    >
      <Redo2Icon class="w-4 h-4" />
    </button>

    <div class="w-px h-5 bg-rose-border mx-1"></div>

    <!-- Text align -->
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive({ textAlign: 'left' })
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().setTextAlign('left').run()"
    >
      <AlignLeftIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive({ textAlign: 'center' })
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().setTextAlign('center').run()"
    >
      <AlignCenterIcon class="w-4 h-4" />
    </button>
    <button
      class="p-1.5 rounded"
      :class="
        editor.isActive({ textAlign: 'right' })
          ? 'bg-rose-primary text-white'
          : 'text-rose-text-muted hover:bg-rose-surface-alt'
      "
      @click="editor.chain().focus().setTextAlign('right').run()"
    >
      <AlignRightIcon class="w-4 h-4" />
    </button>

    <div class="w-px h-5 bg-rose-border mx-1"></div>

    <!-- Text color popover -->
    <div class="relative">
      <button
        class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt"
        @click="
          isColorPickerOpen = !isColorPickerOpen;
          isHighlightPickerOpen = false;
        "
      >
        <PaletteIcon class="w-4 h-4" />
      </button>
      <div
        v-if="isColorPickerOpen"
        class="fixed inset-0 z-10"
        @click="isColorPickerOpen = false"
      ></div>
      <div
        v-if="isColorPickerOpen"
        class="absolute top-full left-0 mt-1 z-20 grid grid-cols-6 gap-1.5 p-2 w-52 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      >
        <button
          v-for="color in TEXT_COLORS"
          :key="color.label"
          class="w-6 h-6 rounded-full border border-rose-border flex items-center justify-center text-[10px] shrink-0"
          :style="color.value ? { backgroundColor: color.value } : {}"
          :title="color.label"
          @click="applyTextColor(color.value)"
        >
          <span v-if="!color.value" class="text-rose-text-muted">×</span>
        </button>
        <label
          class="w-6 h-6 rounded-full border border-rose-border overflow-hidden relative cursor-pointer shrink-0"
          title="Custom color"
        >
          <input
            v-model="customTextColor"
            type="color"
            class="absolute inset-0 w-8 h-8 -m-1 cursor-pointer"
            @input="applyTextColor(customTextColor)"
          />
        </label>
      </div>
    </div>

    <!-- Highlight popover -->
    <div class="relative">
      <button
        class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt"
        @click="
          isHighlightPickerOpen = !isHighlightPickerOpen;
          isColorPickerOpen = false;
        "
      >
        <HighlighterIcon class="w-4 h-4" />
      </button>
      <div
        v-if="isHighlightPickerOpen"
        class="fixed inset-0 z-10"
        @click="isHighlightPickerOpen = false"
      ></div>
      <div
        v-if="isHighlightPickerOpen"
        class="absolute top-full left-0 mt-1 z-20 grid grid-cols-6 gap-1.5 p-2 w-52 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      >
        <button
          v-for="color in HIGHLIGHT_COLORS"
          :key="color.label"
          class="w-6 h-6 rounded-full border border-rose-border flex items-center justify-center text-[10px] shrink-0"
          :style="color.value ? { backgroundColor: color.value } : {}"
          :title="color.label"
          @click="applyHighlight(color.value)"
        >
          <span v-if="!color.value" class="text-rose-text-muted">×</span>
        </button>
        <label
          class="w-6 h-6 rounded-full border border-rose-border overflow-hidden relative cursor-pointer shrink-0"
          title="Custom color"
        >
          <input
            v-model="customHighlightColor"
            type="color"
            class="absolute inset-0 w-8 h-8 -m-1 cursor-pointer"
            @input="applyHighlight(customHighlightColor)"
          />
        </label>
      </div>
    </div>

    <div class="w-px h-5 bg-rose-border mx-1"></div>

    <!-- Export popover -->
    <div class="relative">
      <button
        class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt"
        @click="isExportMenuOpen = !isExportMenuOpen"
      >
        <DownloadIcon class="w-4 h-4" />
      </button>
      <div
        v-if="isExportMenuOpen"
        class="fixed inset-0 z-10"
        @click="isExportMenuOpen = false"
      ></div>
      <div
        v-if="isExportMenuOpen"
        class="absolute top-full right-0 mt-1 z-20 flex flex-col w-44 rounded-lg bg-rose-surface border border-rose-border shadow-lg overflow-hidden"
      >
        <button
          class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
          @click="emit('exportAsHtml')"
        >
          Export as HTML
        </button>
        <button
          class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
          @click="emit('exportAsMarkdown')"
        >
          Export as Markdown
        </button>
        <button
          class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
          @click="emit('exportAsText')"
        >
          Export as Text
        </button>
        <div class="h-px bg-rose-border"></div>
        <button
          class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
          @click="emit('exportAsPdf')"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  </div>
</template>
