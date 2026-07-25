<!-- src/views/DocView.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
import { useRouter } from "vue-router";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeftIcon,
  PanelBottomIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PanelTopIcon,
  PencilIcon,
} from "@lucide/vue";
import { useDocsStore } from "../stores/docs";
import { useFoldersStore } from "../stores/folders";
import { useToast } from "../composables/useToast";
import { useDocExport } from "../composables/useDocExport";
import { debounce } from "../utils/debounce";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import type { Doc } from "../db/types";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { TableMap } from "@tiptap/pm/tables";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Papa from "papaparse";
import { Markdown } from "@tiptap/markdown";
import DocToolbar from "../components/DocToolbar.vue";
import { type ToolbarPosition, useToolbarPosition } from "../composables/useToolbarPosition";
import { type PopoverPlacement, usePopoverPosition } from "../composables/usePopoverPosition";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";

const AUTOSAVE_DELAY_MS = 600;
const MAX_TABLE_ROWS = 20;
const MAX_TABLE_COLS = 10;

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const docsStore = useDocsStore();
const foldersStore = useFoldersStore();
const { showToast } = useToast();

const segments = computed(() => pathMatch ?? []);

const currentDoc = ref<Doc | undefined>(undefined);
const isRenaming = ref(false);
const renameValue = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const csvFileInputRef = ref<HTMLInputElement | null>(null);
const csvFirstRowIsHeader = ref(true);
const isExportMenuOpen = ref(false);
const isCellBgPickerOpen = ref(false);
const cellBgRootRef = ref<HTMLElement | null>(null);
const cellBgTriggerRef = ref<HTMLButtonElement | null>(null);
const cellBgPopoverRef = ref<HTMLElement | null>(null);

const cellBgAnchor = usePopoverPosition(
  cellBgRootRef,
  cellBgTriggerRef,
  cellBgPopoverRef,
  "bottom-start" as PopoverPlacement,
);

const { effectivePosition, savedPosition, isVertical, isMobile, setPosition } =
  useToolbarPosition();

let activeLoadToken = 0;

const BorderedTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      bordered: {
        default: true,
        parseHTML: (element) => element.getAttribute("data-bordered") !== "false",
        renderHTML: (attributes) => ({
          "data-bordered": attributes.bordered ? "true" : "false",
        }),
      },
    };
  },
});

const ColorableTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) =>
          attributes.backgroundColor
            ? { style: `background-color: ${attributes.backgroundColor}` }
            : {},
      },
    };
  },
});

const ColorableTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) =>
          attributes.backgroundColor
            ? { style: `background-color: ${attributes.backgroundColor}` }
            : {},
      },
    };
  },
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

const saveContent = debounce(async (id: string, contentJSON: Record<string, unknown>) => {
  await docsStore.updateDoc(id, { contentJSON });
}, AUTOSAVE_DELAY_MS);

const editor = useEditor({
  content: "",
  extensions: [
    // StarterKit.configure({ link: false }),
    StarterKit.configure({ link: false, underline: false }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: false }),
    Image,
    Placeholder.configure({ placeholder: "Start writing…" }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Underline,
    Subscript,
    Superscript,
    BorderedTable.configure({ resizable: true, lastColumnResizable: true, cellMinWidth: 60 }),
    TableRow,
    ColorableTableCell,
    ColorableTableHeader,
    Markdown.configure({ markedOptions: { gfm: true } }),
  ],
  editorProps: {
    handleClick(view, pos, event) {
      const target = event.target as HTMLElement;
      const link = target.closest("a");
      if (link && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        window.open(link.getAttribute("href") ?? "", "_blank", "noopener,noreferrer");
        return true;
      }
      return false;
    },
    handleDrop(view, event) {
      const files = [...(event.dataTransfer?.files ?? [])].filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length === 0) {
        return false;
      }
      event.preventDefault();
      files.forEach(async (file) => {
        const src = await fileToDataUrl(file);
        editor.value?.chain().focus().setImage({ src }).run();
      });
      return true;
    },
    handlePaste(view, event) {
      const files = [...(event.clipboardData?.files ?? [])].filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length === 0) {
        return false;
      }
      event.preventDefault();
      files.forEach(async (file) => {
        const src = await fileToDataUrl(file);
        editor.value?.chain().focus().setImage({ src }).run();
      });
      return true;
    },
  },
  onUpdate({ editor: instance }) {
    if (!currentDoc.value) {
      return;
    }
    saveContent(currentDoc.value.id, instance.getJSON());
  },
});

const docTitle = computed(() => currentDoc.value?.title);
const { exportAsHtml, exportAsMarkdown, exportAsText, exportAsPdf } = useDocExport(
  editor,
  docTitle,
  isExportMenuOpen,
);

const CELL_BG_COLORS = [
  { label: "None", value: null },
  { label: "Yellow", value: "#fef9c3" },
  { label: "Green", value: "#dcfce7" },
  { label: "Blue", value: "#dbeafe" },
  { label: "Pink", value: "#fce7f3" },
  { label: "Orange", value: "#ffedd5" },
  { label: "Gray", value: "#e2e8f0" },
];

// const isCellBgPickerOpen = ref(false);

function isCurrentTableBordered(): boolean {
  if (!editor.value) {
    return true;
  }
  const { $from } = editor.value.state.selection;
  for (let { depth } = $from; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "table") {
      return node.attrs.bordered !== false;
    }
  }
  return true;
}

function toggleTableBorders() {
  if (!editor.value) {
    return;
  }
  const { state, view } = editor.value;
  const { $from } = state.selection;
  for (let { depth } = $from; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "table") {
      const pos = $from.before(depth);
      view.dispatch(
        state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, bordered: !node.attrs.bordered }),
      );
      editor.value.commands.focus();
      return;
    }
  }
}

// function applyCellBackground(color: string | null) {
//   if (!editor.value) {
//     return;
//   }
//   const { state, view } = editor.value;
//   const { $from } = state.selection;
//   for (let { depth } = $from; depth > 0; depth--) {
//     const node = $from.node(depth);
//     if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
//       const pos = $from.before(depth);
//       view.dispatch(
//         state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, backgroundColor: color }),
//       );
//       editor.value.commands.focus();
//       break;
//     }
//   }
//   isCellBgPickerOpen.value = false;
// }

function applyCellBackground(color: string | null) {
  if (!editor.value) {
    return;
  }
  const { state, view } = editor.value;
  const { $from } = state.selection;
  for (let { depth } = $from; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      const pos = $from.before(depth);
      view.dispatch(
        state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, backgroundColor: color }),
      );
      editor.value.commands.focus();
      break;
    }
  }
  isCellBgPickerOpen.value = false;
  cellBgAnchor.close();
}

function resolveFolderId(segs: string[]): string | null | undefined {
  let cursor: string | null = null;
  for (const segment of segs) {
    const match = foldersStore.folders.find(
      (folder) =>
        folder.parentId === cursor &&
        folder.type === "doc" &&
        folder.name.toLowerCase() === segment.toLowerCase(),
    );
    if (!match) {
      return undefined;
    }
    cursor = match.id;
  }
  return cursor;
}

function buildFolderPath(folderId: string | null): string[] {
  const path: string[] = [];
  let cursor = folderId;
  while (cursor !== null) {
    const folder = foldersStore.folders.find((candidate) => candidate.id === cursor);
    if (!folder) {
      break;
    }
    path.unshift(folder.name);
    cursor = folder.parentId;
  }
  return path;
}

async function loadDoc() {
  const token = ++activeLoadToken;
  try {
    await foldersStore.loadFolders("doc");
  } catch (error) {
    if (token === activeLoadToken) {
      showToast((error as Error).message, "error");
    }
    return;
  }

  const segs = segments.value;
  if (segs.length === 0) {
    showToast("Doc not found.", "error");
    router.replace("/docs/folder");
    return;
  }

  const folderSegments = segs.slice(0, -1);
  const docName = segs[segs.length - 1];
  const folderId = resolveFolderId(folderSegments);

  if (folderId === undefined) {
    showToast("That doc no longer exists.", "error");
    router.replace("/docs/folder");
    return;
  }

  try {
    await docsStore.loadDocs();
  } catch (error) {
    if (token === activeLoadToken) {
      showToast((error as Error).message, "error");
    }
    return;
  }

  if (token !== activeLoadToken) {
    return;
  }

  const match = docsStore.docs.find(
    (doc) => doc.folderId === folderId && doc.title.toLowerCase() === docName?.toLowerCase(),
  );

  if (!match) {
    showToast("That doc no longer exists.", "error");
    router.replace({ name: "docs-folder", params: { pathMatch: buildFolderPath(folderId) } });
    return;
  }

  currentDoc.value = match;
  docsStore.touchDoc(match.id);
  const rawContent = match.contentJSON ? structuredClone(toRaw(match).contentJSON) : "";
  editor.value?.commands.setContent(rawContent, { emitUpdate: false });
}

function goBack() {
  if (!currentDoc.value) {
    router.push("/docs/folder");
    return;
  }
  router.push({
    name: "docs-folder",
    params: { pathMatch: buildFolderPath(currentDoc.value.folderId) },
  });
}

function startRenameTitle() {
  isRenaming.value = true;
  renameValue.value = currentDoc.value?.title ?? "";
}

async function confirmRenameTitle() {
  const title = renameValue.value.trim();
  if (title && currentDoc.value?.id) {
    try {
      await docsStore.updateDoc(currentDoc.value.id, { title });
      const updated = await docsStore.getDoc(currentDoc.value.id);
      currentDoc.value = updated;
      if (updated) {
        router.replace({
          name: "docs-doc",
          params: { pathMatch: [...buildFolderPath(updated.folderId), updated.title] },
        });
      }
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  }
  isRenaming.value = false;
}

function cancelRenameTitle() {
  isRenaming.value = false;
}

function triggerImagePick() {
  fileInputRef.value?.click();
}

async function handleImageSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  const src = await fileToDataUrl(file);
  editor.value?.chain().focus().setImage({ src }).run();
  (event.target as HTMLInputElement).value = "";
}

function setLink() {
  const previousUrl = editor.value?.getAttributes("link").url as string | undefined;
  if (previousUrl) {
    editor.value?.chain().focus().unsetLink().run();
    return;
  }
  const url = globalThis.prompt("Link URL");
  if (!url) {
    return;
  }
  editor.value?.chain().focus().setLink({ href: url }).run();
}

function insertTable(rows: number, cols: number) {
  editor.value?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
}

function getCurrentTableDimensions(): { rows: number; cols: number } | null {
  if (!editor.value) {
    return null;
  }
  const { $from } = editor.value.state.selection;
  for (let { depth } = $from; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "table") {
      const map = TableMap.get(node);
      return { rows: map.height, cols: map.width };
    }
  }
  return null;
}

function isTableAtMaxRows(): boolean {
  return (getCurrentTableDimensions()?.rows ?? 0) >= MAX_TABLE_ROWS;
}

function isTableAtMaxCols(): boolean {
  return (getCurrentTableDimensions()?.cols ?? 0) >= MAX_TABLE_COLS;
}

function addRowBeforeGuarded() {
  if (isTableAtMaxRows()) {
    showToast(`Tables are capped at ${MAX_TABLE_ROWS} rows.`, "error");
    return;
  }
  editor.value?.chain().focus().addRowBefore().run();
}

function addRowAfterGuarded() {
  if (isTableAtMaxRows()) {
    showToast(`Tables are capped at ${MAX_TABLE_ROWS} rows.`, "error");
    return;
  }
  editor.value?.chain().focus().addRowAfter().run();
}

function addColumnBeforeGuarded() {
  if (isTableAtMaxCols()) {
    showToast(`Tables are capped at ${MAX_TABLE_COLS} columns.`, "error");
    return;
  }
  editor.value?.chain().focus().addColumnBefore().run();
}

function addColumnAfterGuarded() {
  if (isTableAtMaxCols()) {
    showToast(`Tables are capped at ${MAX_TABLE_COLS} columns.`, "error");
    return;
  }
  editor.value?.chain().focus().addColumnAfter().run();
}

function triggerCsvPick() {
  csvFileInputRef.value?.click();
}

function buildTableContentFromRows(rows: string[][], firstRowIsHeader: boolean) {
  const tableRows = rows.map((row, rowIndex) => ({
    type: "tableRow",
    content: row.map((cellText) => ({
      type: firstRowIsHeader && rowIndex === 0 ? "tableHeader" : "tableCell",
      content: cellText.trim()
        ? [{ type: "paragraph", content: [{ type: "text", text: cellText }] }]
        : [{ type: "paragraph" }],
    })),
  }));
  return { type: "table", content: tableRows };
}

async function handleCsvSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  (event.target as HTMLInputElement).value = "";
  if (!file) {
    return;
  }

  const text = await file.text();
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    showToast("Couldn't read that CSV file.", "error");
    return;
  }

  let rows = parsed.data;
  if (rows.length === 0) {
    showToast("That CSV file is empty.", "error");
    return;
  }

  const totalRows = rows.length;
  const totalCols = Math.max(...rows.map((row) => row.length));
  const truncatedRows = totalRows > MAX_TABLE_ROWS;
  const truncatedCols = totalCols > MAX_TABLE_COLS;

  rows = rows.slice(0, MAX_TABLE_ROWS).map((row) => row.slice(0, MAX_TABLE_COLS));

  const tableContent = buildTableContentFromRows(rows, csvFirstRowIsHeader.value);
  editor.value?.chain().focus().insertContent(tableContent).run();

  if (truncatedRows || truncatedCols) {
    const parts = [
      truncatedRows ? `first ${MAX_TABLE_ROWS} of ${totalRows} rows` : null,
      truncatedCols ? `first ${MAX_TABLE_COLS} of ${totalCols} columns` : null,
    ].filter(Boolean);
    showToast(`CSV was larger than the table limit — imported ${parts.join(" and ")}.`, "error");
  }
}

function toggleCellBgPicker() {
  const next = !isCellBgPickerOpen.value;
  isCellBgPickerOpen.value = false;
  cellBgAnchor.close();
  if (next) {
    isCellBgPickerOpen.value = true;
    cellBgAnchor.open();
  }
}

// onMounted(loadDoc);
// watch(() => pathMatch, loadDoc);
// onBeforeUnmount(() => {
//   editor.value?.destroy();
// });

function flushPendingSave() {
  saveContent.flush();
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    flushPendingSave();
  }
}

onMounted(() => {
  loadDoc();
  window.addEventListener("pagehide", flushPendingSave);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

watch(
  () => pathMatch,
  () => {
    flushPendingSave(); // commit any pending write for the doc we're leaving
    loadDoc();
  },
);

onBeforeUnmount(() => {
  flushPendingSave();
  window.removeEventListener("pagehide", flushPendingSave);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  editor.value?.destroy();
});
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header — always full width on top -->
    <div class="flex items-center gap-2 px-4 pt-4 pb-2 md:px-6 shrink-0">
      <button
        class="flex items-center gap-1.5 text-sm text-rose-text-muted hover:text-rose-text transition-colors"
        @click="goBack"
      >
        <ArrowLeftIcon class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-2 flex-1 min-w-0 ml-2 group">
        <input
          v-if="isRenaming"
          v-model="renameValue"
          type="text"
          autofocus
          class="text-xl font-bold bg-transparent border-b-2 border-rose-primary text-rose-text focus:outline-none min-w-0 flex-1"
          @keyup.enter="confirmRenameTitle"
          @keyup.escape="cancelRenameTitle"
          @blur="confirmRenameTitle"
        />
        <template v-else>
          <h1 class="text-xl font-bold text-rose-text truncate">{{ currentDoc?.title }}</h1>
          <button
            class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary transition-opacity shrink-0"
            @click="startRenameTitle"
          >
            <PencilIcon class="w-4 h-4" />
          </button>
        </template>
      </div>

      <span v-if="currentDoc" class="text-xs text-rose-text-muted shrink-0">
        Saved {{ formatRelativeTime(currentDoc.updatedAt) }}
      </span>

      <!-- Toolbar position toggle (desktop only) -->
      <div v-if="!isMobile" class="flex items-center gap-0.5 ml-2 shrink-0">
        <button
          v-for="pos in ['top', 'left', 'right', 'bottom'] as ToolbarPosition[]"
          :key="pos"
          :title="`Toolbar ${pos}`"
          class="p-1 rounded transition-colors"
          :class="
            savedPosition === pos
              ? 'text-rose-primary'
              : 'text-rose-text-muted hover:text-rose-text'
          "
          @click="setPosition(pos)"
        >
          <PanelTopIcon v-if="pos === 'top'" class="w-4 h-4" />
          <PanelBottomIcon v-else-if="pos === 'bottom'" class="w-4 h-4" />
          <PanelLeftIcon v-else-if="pos === 'left'" class="w-4 h-4" />
          <PanelRightIcon v-else-if="pos === 'right'" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Body: toolbar + editor, direction depends on position -->
    <div class="flex flex-1 min-h-0" :class="isVertical ? 'flex-row' : 'flex-col'">
      <!-- Toolbar: left or top -->
      <DocToolbar
        v-if="editor && (effectivePosition === 'top' || effectivePosition === 'left')"
        :editor="editor"
        :max-table-rows="MAX_TABLE_ROWS"
        :max-table-cols="MAX_TABLE_COLS"
        :position="effectivePosition"
        @trigger-image-pick="triggerImagePick"
        @set-link="setLink"
        @insert-table="insertTable"
        @trigger-csv-pick="triggerCsvPick"
        @export-as-html="exportAsHtml"
        @export-as-markdown="exportAsMarkdown"
        @export-as-text="exportAsText"
        @export-as-pdf="exportAsPdf"
      />

      <!-- Editor + table context bar -->
      <div
        class="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto px-4 md:px-6"
        :class="effectivePosition === 'bottom' ? 'pb-16' : 'pb-6'"
      >
        <!-- Table context toolbar — always horizontal, always above editor -->
        <div
          v-if="editor?.isActive('table')"
          ref="cellBgRootRef"
          class="relative mb-3 mt-2 rounded-lg bg-rose-surface border border-rose-border shrink-0"
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
              @click="addRowBeforeGuarded"
            >
              ↑ Row
            </button>
            <button
              class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
              :disabled="isTableAtMaxRows()"
              @click="addRowAfterGuarded"
            >
              ↓ Row
            </button>
            <button
              class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
              @click="editor.chain().focus().deleteRow().run()"
            >
              Del row
            </button>

            <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0"></div>

            <button
              class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
              :disabled="isTableAtMaxCols()"
              @click="addColumnBeforeGuarded"
            >
              ← Col
            </button>
            <button
              class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
              :disabled="isTableAtMaxCols()"
              @click="addColumnAfterGuarded"
            >
              → Col
            </button>
            <button
              class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
              @click="editor.chain().focus().deleteColumn().run()"
            >
              Del col
            </button>

            <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0"></div>

            <button
              ref="cellBgTriggerRef"
              class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt"
              :aria-expanded="isCellBgPickerOpen"
              @click="toggleCellBgPicker"
            >
              Cell color
            </button>

            <button
              class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
              @click="toggleTableBorders"
            >
              {{ isCurrentTableBordered() ? "Hide borders" : "Show borders" }}
            </button>

            <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0"></div>

            <button
              class="px-2 py-1 rounded text-xs text-red-400 hover:bg-rose-surface-alt shrink-0"
              @click="editor.chain().focus().deleteTable().run()"
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
              @click="applyCellBackground(color.value)"
            >
              <span v-if="!color.value" class="text-rose-text-muted">×</span>
            </button>
          </div>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleImageSelect"
        />
        <input
          ref="csvFileInputRef"
          type="file"
          accept=".csv,text/csv"
          class="hidden"
          @change="handleCsvSelect"
        />

        <EditorContent
          :editor="editor"
          class="prose prose-invert max-w-none rose-editor-content flex-1"
        />
      </div>

      <!-- Toolbar: right position -->
      <DocToolbar
        v-if="editor && effectivePosition === 'right'"
        :editor="editor"
        :max-table-rows="MAX_TABLE_ROWS"
        :max-table-cols="MAX_TABLE_COLS"
        :position="effectivePosition"
        @trigger-image-pick="triggerImagePick"
        @set-link="setLink"
        @insert-table="insertTable"
        @trigger-csv-pick="triggerCsvPick"
        @export-as-html="exportAsHtml"
        @export-as-markdown="exportAsMarkdown"
        @export-as-text="exportAsText"
        @export-as-pdf="exportAsPdf"
      />

      <!-- Toolbar: bottom position (fixed, rendered outside flow but still here for v-if) -->
      <DocToolbar
        v-if="editor && effectivePosition === 'bottom'"
        :editor="editor"
        :max-table-rows="MAX_TABLE_ROWS"
        :max-table-cols="MAX_TABLE_COLS"
        :position="effectivePosition"
        @trigger-image-pick="triggerImagePick"
        @set-link="setLink"
        @insert-table="insertTable"
        @trigger-csv-pick="triggerCsvPick"
        @export-as-html="exportAsHtml"
        @export-as-markdown="exportAsMarkdown"
        @export-as-text="exportAsText"
        @export-as-pdf="exportAsPdf"
      />
    </div>
  </div>
</template>

<style>
.rose-editor-content .ProseMirror {
  outline: none;
}

.rose-editor-content h1 {
  font-size: 2em;
  font-weight: 700;
  line-height: 1.2;
  margin: 0.75rem 0 0.5rem;
}
.rose-editor-content h2 {
  font-size: 1.5em;
  font-weight: 700;
  line-height: 1.3;
  margin: 0.75rem 0 0.5rem;
}
.rose-editor-content h3 {
  font-size: 1.25em;
  font-weight: 600;
  line-height: 1.4;
  margin: 0.75rem 0 0.5rem;
}

.rose-editor-content u {
  text-decoration: underline;
}

.rose-editor-content sub {
  vertical-align: sub;
  font-size: 0.75em;
}

.rose-editor-content sup {
  vertical-align: super;
  font-size: 0.75em;
}

.rose-editor-content ul:not([data-type="taskList"]) {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.rose-editor-content ol {
  list-style: decimal;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.rose-editor-content ul:not([data-type="taskList"]) ul {
  list-style: circle;
  margin: 0;
}

.rose-editor-content ol ol {
  list-style: lower-alpha;
  margin: 0;
}

.rose-editor-content li {
  margin: 0.2rem 0;
}

.rose-editor-content li > p {
  margin: 0;
}

.rose-editor-content ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}
.rose-editor-content ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.rose-editor-content ul[data-type="taskList"] li > label {
  margin-top: 0.2rem;
}

.rose-editor-content p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-rose-text-muted, #8a8a8a);
  pointer-events: none;
  height: 0;
}

.rose-editor-content a {
  color: var(--color-rose-primary, #ec4899);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.rose-editor-content a:hover {
  opacity: 0.8;
}

.rose-editor-content blockquote {
  border-left: 4px solid var(--color-rose-primary, #ec4899);
  margin: 1rem 0;
  padding: 0.25rem 0 0.25rem 1rem;
  color: var(--color-rose-text-muted, #8a8a8a);
}

.rose-editor-content pre {
  background: var(--color-rose-surface-alt, #2a2a2a);
  border: 1px solid var(--color-rose-border, #3a3a3a);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.rose-editor-content pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.875em;
}

.rose-editor-content code {
  background: var(--color-rose-surface-alt, #2a2a2a);
  border-radius: 0.25rem;
  padding: 0.125rem 0.35rem;
  font-size: 0.875em;
}

.rose-editor-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

.rose-editor-content {
  overflow-x: auto;
}

.rose-editor-content table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0.75rem 0;
  overflow: hidden;
}
.rose-editor-content td,
.rose-editor-content th {
  border: 1px solid var(--color-rose-border, #3a3a3a);
  padding: 0.4rem 0.6rem;
  vertical-align: top;
  position: relative;
}
.rose-editor-content th {
  background-color: var(--color-rose-surface-alt, #2a2a2a);
  font-weight: 600;
  text-align: left;
}
.rose-editor-content .selectedCell {
  background-color: rgba(236, 72, 153, 0.15);
}
.rose-editor-content .tableWrapper {
  overflow-x: auto;
}
.rose-editor-content .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: var(--color-rose-primary, #ec4899);
  pointer-events: none;
}
.rose-editor-content table[data-bordered="false"] td,
.rose-editor-content table[data-bordered="false"] th {
  border-color: transparent;
}
.rose-editor-content.resize-cursor {
  cursor: col-resize;
}

@media (max-width: 640px) {
  .rose-editor-content {
    font-size: 0.95rem;
  }
}

[popover] {
  inset: auto;
  margin: 0;
  border: 0;
  padding: 0;
  overflow: visible;
  background: transparent;
  color: inherit;
}
</style>
