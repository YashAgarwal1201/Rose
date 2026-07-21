<!-- src/views/DocView.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowLeftIcon,
  BoldIcon,
  CheckSquareIcon,
  CodeIcon,
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
  PencilIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  TableIcon,
  Undo2Icon,
} from "@lucide/vue";
import { useDocsStore } from "../stores/docs";
import { useFoldersStore } from "../stores/folders";
import { useToast } from "../composables/useToast";
import { debounce } from "../utils/debounce";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import type { Doc } from "../db/types";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import { TableMap } from "@tiptap/pm/tables";

const AUTOSAVE_DELAY_MS = 600;

const { pathMatch } = defineProps<{ pathMatch?: string[] }>();

const router = useRouter();
const docsStore = useDocsStore();
const foldersStore = useFoldersStore();
const { showToast } = useToast();

const segments = computed(() => pathMatch ?? []);

const MAX_TABLE_ROWS = 20;
const MAX_TABLE_COLS = 10;

const currentDoc = ref<Doc | undefined>(undefined);
const isRenaming = ref(false);
const renameValue = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const isTableInsertOpen = ref(false);
const tableRowCount = ref(3);
const tableColCount = ref(3);

let activeLoadToken = 0;

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

const customTextColor = ref("#ffffff");
const customHighlightColor = ref("#fef08a");

const isColorPickerOpen = ref(false);
const isHighlightPickerOpen = ref(false);

function applyTextColor(color: string | null) {
  if (color) {
    editor.value?.chain().focus().setColor(color).run();
  } else {
    editor.value?.chain().focus().unsetColor().run();
  }
  isColorPickerOpen.value = false;
}

function applyHighlight(color: string | null) {
  if (color) {
    editor.value?.chain().focus().toggleHighlight({ color }).run();
  } else {
    editor.value?.chain().focus().unsetHighlight().run();
  }
  isHighlightPickerOpen.value = false;
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

// async function fileToDataUrl(file: File): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = () => reject(reader.error);
//     reader.readAsDataURL(file);
//   });
// }

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
    StarterKit,
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: false }),
    Image,
    Placeholder.configure({ placeholder: "Start writing…" }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TableKit.configure({
      table: {
        resizable: true,
        lastColumnResizable: true,
        cellMinWidth: 60,
      },
    }),
  ],
  editorProps: {
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
  const docTitle = segs[segs.length - 1];
  const folderId = resolveFolderId(folderSegments);

  if (folderId === undefined) {
    showToast("That doc no longer exists.", "error");
    router.replace("/docs/folder");
    return;
  }

  try {
    // await docsStore.loadDocs(folderId);
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
    (doc) => doc.folderId === folderId && doc.title.toLowerCase() === docTitle?.toLowerCase(),
  );

  if (!match) {
    showToast("That doc no longer exists.", "error");
    router.replace({ name: "docs-folder", params: { pathMatch: buildFolderPath(folderId) } });
    return;
  }

  currentDoc.value = match;
  // editor.value?.commands.setContent(match.contentJSON ?? "", false);
  editor.value?.commands.setContent(match.contentJSON ?? "", { emitUpdate: false });
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

function insertTable() {
  const rows = Math.min(Math.max(tableRowCount.value, 1), MAX_TABLE_ROWS);
  const cols = Math.min(Math.max(tableColCount.value, 1), MAX_TABLE_COLS);
  editor.value?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  isTableInsertOpen.value = false;
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

onMounted(loadDoc);
watch(() => pathMatch, loadDoc);
onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-4 md:p-6">
      <button
        class="flex items-center gap-1.5 text-sm text-rose-text-muted hover:text-rose-text transition-colors mb-4"
        @click="goBack"
      >
        <ArrowLeftIcon class="w-4 h-4" /> Back to folder
      </button>

      <div class="flex items-center gap-2 mb-2 group">
        <input
          v-if="isRenaming"
          v-model="renameValue"
          type="text"
          autofocus
          class="text-2xl font-bold bg-transparent border-b-2 border-rose-primary text-rose-text focus:outline-none"
          @keyup.enter="confirmRenameTitle"
          @keyup.escape="cancelRenameTitle"
          @blur="confirmRenameTitle"
        />
        <template v-else>
          <h1 class="text-2xl font-bold text-rose-text truncate">{{ currentDoc?.title }}</h1>
          <button
            class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary transition-opacity shrink-0"
            @click="startRenameTitle"
          >
            <PencilIcon class="w-4 h-4" />
          </button>
        </template>

        <span v-if="currentDoc" class="ml-auto text-xs text-rose-text-muted shrink-0">
          Saved {{ formatRelativeTime(currentDoc.updatedAt) }}
        </span>
      </div>

      <div
        v-if="editor"
        class="flex flex-wrap items-center gap-1 mb-3 p-1.5 rounded-lg bg-rose-surface border border-rose-border sticky top-0 z-10"
      >
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

        <button
          class="p-1.5 rounded"
          :class="
            editor.isActive('link')
              ? 'bg-rose-primary text-white'
              : 'text-rose-text-muted hover:bg-rose-surface-alt'
          "
          @click="setLink"
        >
          <LinkIcon class="w-4 h-4" />
        </button>
        <button
          class="p-1.5 rounded text-rose-text-muted hover:bg-rose-surface-alt"
          @click="triggerImagePick"
        >
          <ImageIcon class="w-4 h-4" />
        </button>

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
            class="absolute top-full left-0 mt-1 z-20 flex flex-col gap-2 p-3 w-48 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
          >
            <label class="flex items-center justify-between gap-2 text-sm text-rose-text">
              Rows

              <input
                v-model.number="tableRowCount"
                type="number"
                min="1"
                :max="MAX_TABLE_ROWS"
                class="w-14 px-1.5 py-0.5 rounded border border-rose-border bg-rose-bg text-rose-text text-sm"
              />
            </label>
            <label class="flex items-center justify-between gap-2 text-sm text-rose-text">
              Columns
              <input
                v-model.number="tableColCount"
                type="number"
                min="1"
                :max="MAX_TABLE_COLS"
                class="w-14 px-1.5 py-0.5 rounded border border-rose-border bg-rose-bg text-rose-text text-sm"
              />
            </label>
            <button
              class="mt-1 px-2 py-1.5 rounded bg-rose-primary text-white text-sm font-medium"
              @click="insertTable"
            >
              Insert table
            </button>
          </div>
        </div>

        <div class="w-px h-5 bg-rose-border mx-1"></div>

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
          <!-- text color popover -->
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
          <!-- highlight popover -->
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
      </div>

      <div
        v-if="editor?.isActive('table')"
        class="flex flex-wrap items-center gap-1 mb-3 p-1.5 rounded-lg bg-rose-surface border border-rose-border"
      >
        <span class="text-xs text-rose-text-muted px-1.5">Table:</span>
        <button
          class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt disabled:opacity-40"
          :disabled="isTableAtMaxRows()"
          @click="addRowBeforeGuarded"
        >
          Row above
        </button>
        <button
          class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt disabled:opacity-40"
          :disabled="isTableAtMaxRows()"
          @click="addRowAfterGuarded"
        >
          Row below
        </button>
        <button
          class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt"
          @click="editor.chain().focus().deleteRow().run()"
        >
          Delete row
        </button>

        <div class="w-px h-5 bg-rose-border mx-1"></div>

        <button
          class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt disabled:opacity-40"
          :disabled="isTableAtMaxCols()"
          @click="addColumnBeforeGuarded"
        >
          Col before
        </button>
        <button
          class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt disabled:opacity-40"
          :disabled="isTableAtMaxCols()"
          @click="addColumnAfterGuarded"
        >
          Col after
        </button>
        <button
          class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt"
          @click="editor.chain().focus().deleteColumn().run()"
        >
          Delete col
        </button>

        <div class="w-px h-5 bg-rose-border mx-1"></div>

        <button
          class="px-2 py-1 rounded text-xs text-red-400 hover:bg-rose-surface-alt"
          @click="editor.chain().focus().deleteTable().run()"
        >
          Delete table
        </button>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleImageSelect"
      />

      <EditorContent
        :editor="editor"
        class="prose prose-invert max-w-none rose-editor-content min-h-[60vh]"
      />
    </div>
  </div>
</template>

<style>
.rose-editor-content .ProseMirror {
  outline: none;
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
  transition: opacity 0.15s ease;
}
.rose-editor-content a:hover {
  opacity: 0.8;
}

.rose-editor-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

.rose-editor-content {
  overflow-x: auto;
}
/* .rose-editor-content table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  margin: 0.75rem 0;
} */

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

.rose-editor-content.resize-cursor {
  cursor: col-resize;
}

@media (max-width: 640px) {
  .rose-editor-content {
    font-size: 0.95rem;
  }
}
</style>
