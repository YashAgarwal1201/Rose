<!-- src/views/DocView.vue -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
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
import { useDocsStore } from "@/stores/docs";
import { useFoldersStore } from "@/stores/folders";
import { useToast } from "@/composables/ui/useToast.ts";
import { useDocExport } from "@/composables/docs/useDocExport.ts";
import {
  A4_SHEET_HEIGHT_PX,
  A4_SHEET_WIDTH_PX,
  usePageView,
} from "@/composables/docs/usePageView.ts";
import { useInput } from "@/composables/ui/useInput.ts";
import { debounce } from "@/utils/debounce";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import type { Doc } from "@/db/types";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { TableMap } from "@tiptap/pm/tables";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Papa from "papaparse";
import { Markdown } from "@tiptap/markdown";
import DocToolbar from "@/components/docs/DocToolbar.vue";
import ErrorBoundary from "@/components/ui/ErrorBoundary.vue";
import VaultAuthView from "@/components/ui/VaultAuthView.vue";
import { type ToolbarPosition, useToolbarPosition } from "@/composables/ui/useToolbarPosition.ts";
import { type PopoverPlacement, usePopoverPosition } from "@/composables/ui/usePopoverPosition.ts";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts.ts";
import { TOAST_AUTO_DISMISS_MS } from "@/utils/constants";
import { getErrorMessage } from "@/utils/error";
import { useDocumentTitle } from "@/composables/app/useDocumentTitle.ts";

const AUTOSAVE_DELAY_MS = 600;
const MAX_TABLE_ROWS = 20;
const MAX_TABLE_COLS = 10;

const { pathMatch } = defineProps<{ pathMatch?: string | string[] }>();

const router = useRouter();
const docsStore = useDocsStore();
const foldersStore = useFoldersStore();
const { showToast } = useToast();
const { requestInput } = useInput();

const segments = computed(() => (Array.isArray(pathMatch) ? pathMatch : (pathMatch ? [pathMatch] : [])));

const currentDoc = ref<Doc | undefined>(undefined);
useDocumentTitle(() => currentDoc.value?.title || "Doc");
const isVaultLocked = ref(false);
const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};

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
const isDesktop = computed(() => !isMobile.value);
const {
  isPageView,
  togglePageView,
  isFullWidth,
  toggleFullWidth,
  zoomLevel,
  effectiveScale,
  setContainerWidth,
  setZoom,
  zoomIn,
  zoomOut,
} = usePageView();

const editorScrollContainerRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const a11yAnnouncement = ref("");

function announceA11y(msg: string) {
  a11yAnnouncement.value = "";
  nextTick(() => {
    a11yAnnouncement.value = msg;
  });
}

function handleTogglePageView() {
  togglePageView();
  announceA11y(
    isPageView.value
      ? "Switched to Page View. A4 print layout active."
      : "Switched to Continuous View.",
  );
}

function handleToggleFullWidth() {
  toggleFullWidth();
  announceA11y(
    isFullWidth.value
      ? "Full width layout enabled."
      : "Standard readable width (72ch) enabled.",
  );
}

function handleZoomIn() {
  zoomIn();
  announceA11y(`Zoom increased to ${Math.round(effectiveScale.value * 100)}%`);
}

function handleZoomOut() {
  zoomOut();
  announceA11y(`Zoom decreased to ${Math.round(effectiveScale.value * 100)}%`);
}

function handleCycleZoom() {
  cycleZoom();
  announceA11y(
    zoomLevel.value === "fit"
      ? "Zoom set to Fit to width"
      : `Zoom set to ${Math.round(effectiveScale.value * 100)}%`,
  );
}

function updateContainerWidth() {
  if (editorScrollContainerRef.value) {
    setContainerWidth(editorScrollContainerRef.value.clientWidth);
  }
}

function cycleZoom() {
  if (zoomLevel.value === "fit") {
    setZoom(1);
  } else if (zoomLevel.value === 1) {
    setZoom(1.25);
  } else if (zoomLevel.value === 1.25) {
    setZoom(0.75);
  } else if (zoomLevel.value === 0.75) {
    setZoom("fit");
  } else {
    setZoom("fit");
  }
}

watch(isPageView, (active) => {
  if (active) {
    nextTick().then(() => {
      updateContainerWidth();
      if (!isDesktop.value || (editorScrollContainerRef.value && editorScrollContainerRef.value.clientWidth < 850)) {
        setZoom("fit");
      }
    });
  }
});

const isReadMode = ref(isMobile.value);

watch(isReadMode, (readOnly) => {
  editor.value?.setEditable(!readOnly);
  if (!readOnly && !isMobile.value) {
    nextTick().then(() => {
      editor.value?.commands.focus("end");
    });
  }
});

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
  editable: !isReadMode.value,
  autofocus: !isReadMode.value && !isMobile.value ? "end" : false,
  content: "",
  extensions: [
    StarterKit.configure({ link: false, underline: false }),
    TaskList,
    TaskItem.configure({
      nested: true,
      onReadOnlyChecked(node, checked) {
        if (!editor.value || !currentDoc.value) {
          return false;
        }
        let foundPos: number | null = null;
        editor.value.state.doc.descendants((docNode, pos) => {
          if (docNode === node) {
            foundPos = pos;
            return false;
          }
          return true;
        });
        if (foundPos !== null) {
          const { tr } = editor.value.state;
          tr.setNodeMarkup(foundPos, undefined, { ...node.attrs, checked });
          editor.value.view.dispatch(tr);
          saveContent(currentDoc.value.id, editor.value.getJSON());
          return true;
        }
        return false;
      },
    }),
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
      if (link && (isReadMode.value || event.metaKey || event.ctrlKey)) {
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
        (folder.type === "doc" || folder.type === "mixed") &&
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
  } catch (error: unknown) {
    console.error("Error:", error);
    if (token === activeLoadToken) {
      showToast(getErrorMessage(error), "error");
    }
    return;
  }

  const segs = segments.value;
  if (segs.length === 0) {
    showToast("Doc not found.", "error");
    router.replace("/docs");
    return;
  }

  const folderSegments = segs.slice(0, -1);
  const docName = segs[segs.length - 1];
  const folderId = resolveFolderId(folderSegments);

  if (folderId === undefined) {
    showToast("That doc no longer exists.", "error");
    router.replace("/docs");
    return;
  }

  try {
    await docsStore.loadDocs();
  } catch (error: unknown) {
    console.error("Error:", error);
    if (token === activeLoadToken) {
      showToast(getErrorMessage(error), "error");
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
    console.log("No match found for folderId", folderId, "and docName", docName);
    showToast("That doc no longer exists.", "error");
    router.replace({ name: "files-folder", params: { pathMatch: buildFolderPath(folderId) } });
    return;
  }

  isVaultLocked.value = false;
  try {
    const fullDoc = await docsStore.getDoc(match.id);
    if (!fullDoc) { throw new Error("Doc not found in db."); }
    currentDoc.value = fullDoc;
    console.log("currentDoc set to:", currentDoc.value.title);
    docsStore.touchDoc(fullDoc.id);
    const rawContent = fullDoc.contentJSON ? structuredClone(toRaw(fullDoc).contentJSON) : "";
    editor.value?.commands.setContent(rawContent, { emitUpdate: false });
    if (!isReadMode.value && !isMobile.value) {
      nextTick().then(() => {
        editor.value?.commands.focus("end");
      });
    }
  } catch (error: unknown) {
    console.error("loadDoc Error:", error);
    if (getErrorMessage(error) === "Vault is locked") {
      isVaultLocked.value = true;
      return;
    }
    if (token === activeLoadToken) {
      showToast(getErrorMessage(error), "error");
    }
  }
}

function goBack() {
  if (globalThis.history.state && globalThis.history.state.back) {
    router.back();
    return;
  }
  if (!currentDoc.value) {
    router.push("/files/folder");
    return;
  }
  router.push({
    name: "files-folder",
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
    } catch (error: unknown) {
      console.error("Error:", error);
      showToast(getErrorMessage(error), "error");
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

async function setLink() {
  const previousUrl = editor.value?.getAttributes("link").url as string | undefined;
  if (previousUrl) {
    editor.value?.chain().focus().unsetLink().run();
    return;
  }
  const url = await requestInput({
    title: "Insert Link",
    message: "Enter the URL you want to link to:",
    placeholder: "https://example.com",
    confirmLabel: "Add Link",
  });

  if (!url) {
    return;
  }

  // Re-focus the editor before setting the link so it applies to the current selection
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

const toolbarRef = ref<InstanceType<typeof DocToolbar> | null>(null);

useKeyboardShortcuts([
  // Ctrl + S → flush pending save and show toast
  {
    key: "s",
    ctrl: true,
    handler: () => {
      flushPendingSave();
      showToast("Document saved", "info", TOAST_AUTO_DISMISS_MS);
    },
  },
  // Ctrl + B → Bold
  {
    key: "b",
    ctrl: true,
    handler: () => {
      if (isReadMode.value) { return false; }
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") { return false; }
      editor.value?.chain().focus().toggleBold().run();
    },
  },
  // Ctrl + I → Italic
  {
    key: "i",
    ctrl: true,
    handler: () => {
      if (isReadMode.value) { return false; }
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") { return false; }
      editor.value?.chain().focus().toggleItalic().run();
    },
  },
  // Ctrl + U → Underline
  {
    key: "u",
    ctrl: true,
    handler: () => {
      if (isReadMode.value) { return false; }
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") { return false; }
      editor.value?.chain().focus().toggleUnderline().run();
    },
  },
  // Ctrl + Alt + X → Strikethrough
  {
    key: "x",
    ctrl: true,
    alt: true,
    handler: () => {
      if (isReadMode.value) { return false; }
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") { return false; }
      editor.value?.chain().focus().toggleStrike().run();
    },
  },
  // Ctrl + K → Link
  {
    key: "k",
    ctrl: true,
    handler: () => {
      if (isReadMode.value) { return false; }
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") { return false; }
      setLink();
    },
  },
  // Ctrl + Shift + S → Toggle Export Menu
  {
    key: "s",
    ctrl: true,
    shift: true,
    handler: () => {
      if (isReadMode.value) { return false; }
      toolbarRef.value?.toggleExportMenu();
    },
  },
  // Ctrl + Alt + P → Toggle Page View (A4)
  {
    key: "p",
    ctrl: true,
    alt: true,
    handler: () => {
      if (isReadMode.value) { return false; }
      handleTogglePageView();
    },
  },
  // Ctrl + Alt + F → Toggle Full Width (when in Continuous view)
  {
    key: "f",
    ctrl: true,
    alt: true,
    handler: () => {
      if (isReadMode.value || isPageView.value) { return false; }
      handleToggleFullWidth();
    },
  },
  // Ctrl + Alt + 0 → Reset / Fit Zoom (when in Page View)
  {
    key: "0",
    ctrl: true,
    alt: true,
    handler: () => {
      if (isReadMode.value || !isPageView.value) { return false; }
      setZoom("fit");
      announceA11y("Zoom set to Fit to width");
    },
  },
]);

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    flushPendingSave();
  }
}

onMounted(() => {
  if (isMobile.value) {
    isReadMode.value = true;
  }
  loadDoc();
  updateContainerWidth();
  if (typeof ResizeObserver !== "undefined" && editorScrollContainerRef.value) {
    resizeObserver = new ResizeObserver(() => updateContainerWidth());
    resizeObserver.observe(editorScrollContainerRef.value);
  }
  window.addEventListener("resize", updateContainerWidth);
  window.addEventListener("pagehide", flushPendingSave);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

watch(
  () => pathMatch,
  () => {
    flushPendingSave(); // commit any pending write for the doc we're leaving
    isReadMode.value = isMobile.value;
    loadDoc();
  },
);

onBeforeUnmount(() => {
  flushPendingSave();
  resizeObserver?.disconnect();
  window.removeEventListener("resize", updateContainerWidth);
  window.removeEventListener("pagehide", flushPendingSave);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  editor.value?.destroy();
});
</script>

<template>
  <div class="flex h-full flex-col bg-rose-bg">
    <VaultAuthView v-if="isVaultLocked" @unlocked="loadDoc" />
    <template v-else-if="currentDoc">
      <div class="flex flex-col h-full overflow-hidden">
        <!-- Live screen reader announcements for view and zoom adjustments -->
        <div class="sr-only" aria-live="polite" aria-atomic="true">
          {{ a11yAnnouncement }}
        </div>

        <!-- Header — always full width on top -->
        <div class="flex items-center gap-2 px-4 pt-4 pb-2 md:px-6 shrink-0">
          <button class="flex items-center gap-1.5 text-sm text-rose-text-muted hover:text-rose-text transition-colors"
            @click="goBack" aria-label="Back to files">
            <ArrowLeftIcon class="w-4 h-4" />
          </button>

          <div class="flex items-center gap-2 flex-1 min-w-0 ml-2 group">
            <input v-if="isRenaming" v-model="renameValue" type="text" v-focus aria-label="Document title"
              class="text-xl font-bold bg-transparent border-b-2 border-rose-primary text-rose-text focus:outline-none min-w-0 flex-1"
              @keyup.enter="confirmRenameTitle" @keyup.escape="cancelRenameTitle" @blur="confirmRenameTitle" />
            <template v-else>
              <h1 class="text-xl font-bold text-rose-text truncate">{{ currentDoc?.title }}</h1>
              <button
                v-if="!isReadMode"
                class="opacity-0 group-hover:opacity-100 text-rose-text-muted hover:text-rose-primary transition-opacity shrink-0"
                aria-label="Rename document"
                @click="startRenameTitle">
                <PencilIcon class="w-4 h-4" />
              </button>
            </template>
          </div>

          <span v-if="currentDoc" class="text-xs text-rose-text-muted shrink-0">
            Saved {{ formatRelativeTime(currentDoc.updatedAt) }}
          </span>

          <!-- Mode toggle button (Edit mode only shown in Read mode) -->
          <button
            v-if="isReadMode"
            type="button"
            data-testid="mode-toggle-btn"
            title="Switch to edit mode"
            aria-label="Switch to edit mode"
            class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-surface-alt border border-rose-border text-rose-text hover:bg-rose-surface transition-colors shrink-0 ml-2"
            @click="isReadMode = false"
          >
            <PencilIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Edit mode</span>
          </button>

          <!-- Mobile A4 Preview Toggle (Scenario 1) -->
          <div v-if="!isDesktop" class="flex items-center gap-1 ml-2 shrink-0">
            <button
              type="button"
              data-testid="mobile-page-view-btn"
              :title="isPageView ? 'Exit Page View' : 'Preview A4 Page'"
              :aria-label="isPageView ? 'Exit Page View' : 'Preview A4 Page'"
              :aria-pressed="isPageView"
              class="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg border transition-colors shrink-0"
              :class="isPageView
                ? 'bg-rose-primary text-white border-rose-primary'
                : 'bg-rose-surface-alt border-rose-border text-rose-text hover:bg-rose-surface'
              "
              @click="handleTogglePageView"
            >
              <FileTextIcon class="w-3.5 h-3.5" />
              <span>{{ isPageView ? 'Exit A4' : 'A4 View' }}</span>
            </button>

            <!-- Mobile Zoom Controls (shown in Page View) -->
            <div v-if="isPageView" role="group" aria-label="Zoom controls" class="flex items-center gap-0.5 bg-rose-surface-alt border border-rose-border rounded-lg p-0.5">
              <button
                type="button"
                class="p-1 rounded text-rose-text-muted hover:text-rose-text disabled:opacity-40"
                :disabled="effectiveScale <= 0.5"
                :aria-disabled="effectiveScale <= 0.5"
                title="Zoom out"
                aria-label="Zoom out"
                @click="handleZoomOut"
              >
                <MinusIcon class="w-3 h-3" />
              </button>

              <button
                type="button"
                class="px-1 py-0.5 text-[10px] font-semibold text-rose-text min-w-[2.5rem] text-center hover:bg-rose-surface rounded"
                title="Cycle zoom preset"
                :aria-label="`Zoom level: ${zoomLevel === 'fit' ? 'Fit to width' : Math.round(effectiveScale * 100) + '%'}. Click to change preset`"
                @click="handleCycleZoom"
              >
                {{ zoomLevel === 'fit' ? 'Fit' : `${Math.round(effectiveScale * 100)}%` }}
              </button>

              <button
                type="button"
                class="p-1 rounded text-rose-text-muted hover:text-rose-text disabled:opacity-40"
                :disabled="effectiveScale >= 1.5"
                :aria-disabled="effectiveScale >= 1.5"
                title="Zoom in"
                aria-label="Zoom in"
                @click="handleZoomIn"
              >
                <PlusIcon class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- Toolbar position & view toggles (desktop only) -->
          <div v-if="isDesktop && !isReadMode" role="toolbar" aria-label="Document layout and view controls" class="flex items-center gap-0.5 ml-2 shrink-0">
            <!-- Page View toggle (Continuous vs A4 Sheet) -->
            <button
              type="button"
              data-testid="page-view-toggle-btn"
              :title="isPageView ? 'Switch to Continuous view' : 'Switch to Page view (A4)'"
              :aria-label="isPageView ? 'Switch to Continuous view' : 'Switch to Page view (A4)'"
              :aria-pressed="isPageView"
              class="p-1 rounded transition-colors"
              :class="isPageView
                ? 'text-rose-primary bg-rose-surface-alt'
                : 'text-rose-text-muted hover:text-rose-text'
              "
              @click="handleTogglePageView"
            >
              <FileTextIcon class="w-4 h-4" />
            </button>

            <!-- Full Width toggle (Continuous view only) -->
            <button
              v-if="!isPageView"
              type="button"
              data-testid="full-width-toggle-btn"
              :title="isFullWidth ? 'Standard width (72ch)' : 'Full width'"
              :aria-label="isFullWidth ? 'Standard width (72ch)' : 'Full width'"
              :aria-pressed="isFullWidth"
              class="p-1 rounded transition-colors"
              :class="isFullWidth
                ? 'text-rose-primary bg-rose-surface-alt'
                : 'text-rose-text-muted hover:text-rose-text'
              "
              @click="handleToggleFullWidth"
            >
              <MinimizeIcon v-if="isFullWidth" class="w-4 h-4" />
              <MaximizeIcon v-else class="w-4 h-4" />
            </button>

            <!-- Zoom controls (Page View only) -->
            <div v-if="isPageView" role="group" aria-label="Zoom controls" class="flex items-center gap-0.5 bg-rose-surface-alt/70 border border-rose-border rounded-lg p-0.5 ml-0.5">
              <button
                type="button"
                class="p-1 rounded text-rose-text-muted hover:text-rose-text disabled:opacity-40"
                :disabled="effectiveScale <= 0.5"
                :aria-disabled="effectiveScale <= 0.5"
                title="Zoom out"
                aria-label="Zoom out"
                @click="handleZoomOut"
              >
                <MinusIcon class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                data-testid="zoom-level-btn"
                class="px-1.5 py-0.5 text-[11px] font-semibold text-rose-text min-w-[2.8rem] text-center hover:bg-rose-surface rounded"
                title="Cycle zoom preset (Fit / 100% / 125% / 75%)"
                :aria-label="`Zoom level: ${zoomLevel === 'fit' ? 'Fit to width' : Math.round(effectiveScale * 100) + '%'}. Click to change preset`"
                @click="handleCycleZoom"
              >
                {{ zoomLevel === 'fit' ? 'Fit' : `${Math.round(effectiveScale * 100)}%` }}
              </button>

              <button
                type="button"
                class="p-1 rounded text-rose-text-muted hover:text-rose-text disabled:opacity-40"
                :disabled="effectiveScale >= 1.5"
                :aria-disabled="effectiveScale >= 1.5"
                title="Zoom in"
                aria-label="Zoom in"
                @click="handleZoomIn"
              >
                <PlusIcon class="w-3.5 h-3.5" />
              </button>
            </div>

            <div class="w-px h-4 bg-rose-border mx-1 shrink-0"></div>

            <button v-for="pos in ['top', 'left', 'right', 'bottom'] as ToolbarPosition[]" :key="pos"
              :title="`Toolbar ${pos}`"
              :aria-label="`Place toolbar at ${pos}`"
              :aria-pressed="savedPosition === pos"
              class="p-1 rounded transition-colors" :class="savedPosition === pos
                ? 'text-rose-primary'
                : 'text-rose-text-muted hover:text-rose-text'
                " @click="setPosition(pos)">
              <PanelTopIcon v-if="pos === 'top'" class="w-4 h-4" />
              <PanelBottomIcon v-else-if="pos === 'bottom'" class="w-4 h-4" />
              <PanelLeftIcon v-else-if="pos === 'left'" class="w-4 h-4" />
              <PanelRightIcon v-else-if="pos === 'right'" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Body: toolbar + editor, direction depends on position -->
        <ErrorBoundary>
          <div class="flex flex-col flex-1 min-h-0">
          <div class="flex flex-1 min-h-0" :class="isVertical ? 'flex-row' : 'flex-col'">
            <!-- Toolbar: left or top -->
            <DocToolbar ref="toolbarRef" v-if="!isReadMode && editor && (effectivePosition === 'top' || effectivePosition === 'left')"
              :editor="editor" :max-table-rows="MAX_TABLE_ROWS" :max-table-cols="MAX_TABLE_COLS"
              :position="effectivePosition" @trigger-image-pick="triggerImagePick" @set-link="setLink"
              @insert-table="insertTable" @trigger-csv-pick="triggerCsvPick" @export-as-html="exportAsHtml"
              @export-as-markdown="exportAsMarkdown" @export-as-text="exportAsText" @export-as-pdf="exportAsPdf"
              @toggle-read-mode="isReadMode = true" />

            <!-- Editor + table context bar -->
            <div
              ref="editorScrollContainerRef"
              class="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto px-2 sm:px-4 md:px-6 pt-4"
              :class="[
                !isReadMode && effectivePosition === 'bottom' ? 'pb-12 md:pb-8' : 'pb-8',
                isPageView ? 'page-view-desk' : 'continuous-view-canvas'
              ]">
              <!-- Table context toolbar — always horizontal, always above editor -->
              <div v-if="!isReadMode && editor?.isActive('table')" ref="cellBgRootRef"
                class="relative mb-3 mt-2 rounded-lg bg-rose-surface border border-rose-border shrink-0"
                :style="{
                  maxWidth: isPageView ? `${A4_SHEET_WIDTH_PX * effectiveScale}px` : (isFullWidth ? 'min(100%, 1400px)' : 'clamp(320px, 72ch, 860px)'),
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  width: '100%'
                }">
                <div v-if="isCellBgPickerOpen" class="fixed inset-0 z-10" @click="
                  isCellBgPickerOpen = false;
                cellBgAnchor.close();
                "></div>

                <div class="flex items-center gap-1 p-1.5 overflow-x-auto" style="scrollbar-width: none">
                  <span class="text-xs text-rose-text-muted px-1 shrink-0">Table:</span>
                  <button
                    class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
                    :disabled="isTableAtMaxRows()"
                    aria-label="Insert row above"
                    @click="addRowBeforeGuarded">
                    ↑ Row
                  </button>
                  <button
                    class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
                    :disabled="isTableAtMaxRows()"
                    aria-label="Insert row below"
                    @click="addRowAfterGuarded">
                    ↓ Row
                  </button>
                  <button class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
                    aria-label="Delete current row"
                    @click="editor.chain().focus().deleteRow().run()">
                    Del row
                  </button>

                  <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0" role="separator"></div>

                  <button
                    class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
                    :disabled="isTableAtMaxCols()"
                    aria-label="Insert column before"
                    @click="addColumnBeforeGuarded">
                    ← Col
                  </button>
                  <button
                    class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0 disabled:opacity-40"
                    :disabled="isTableAtMaxCols()"
                    aria-label="Insert column after"
                    @click="addColumnAfterGuarded">
                    → Col
                  </button>
                  <button class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
                    aria-label="Delete current column"
                    @click="editor.chain().focus().deleteColumn().run()">
                    Del col
                  </button>

                  <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0" role="separator"></div>

                  <button ref="cellBgTriggerRef"
                    class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt"
                    :aria-expanded="isCellBgPickerOpen"
                    aria-haspopup="dialog"
                    aria-label="Cell background color"
                    @click="toggleCellBgPicker">
                    Cell color
                  </button>

                  <button class="px-2 py-1 rounded text-xs text-rose-text-muted hover:bg-rose-surface-alt shrink-0"
                    :aria-label="isCurrentTableBordered() ? 'Hide table borders' : 'Show table borders'"
                    @click="toggleTableBorders">
                    {{ isCurrentTableBordered() ? "Hide borders" : "Show borders" }}
                  </button>

                  <div class="w-px h-4 bg-rose-border mx-0.5 shrink-0" role="separator"></div>

                  <button class="px-2 py-1 rounded text-xs text-red-400 hover:bg-rose-surface-alt shrink-0"
                    aria-label="Delete table"
                    @click="editor.chain().focus().deleteTable().run()">
                    Delete table
                  </button>
                </div>

                <div v-if="isCellBgPickerOpen" ref="cellBgPopoverRef"
                  class="absolute z-20 grid grid-cols-4 gap-1.5 p-2 w-40 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
                  :style="cellBgAnchor.style">
                  <button v-for="color in CELL_BG_COLORS" :key="color.label"
                    class="w-6 h-6 rounded-full border border-rose-border flex items-center justify-center text-xs"
                    :style="color.value ? { backgroundColor: color.value } : {}"
                    :title="color.label"
                    :aria-label="color.value ? `Set cell background to ${color.label}` : 'Clear cell background color'"
                    @click="applyCellBackground(color.value)">
                    <span v-if="!color.value" class="text-rose-text-muted">×</span>
                  </button>
                </div>
              </div>

              <input ref="fileInputRef" type="file" accept="image/*" class="hidden" aria-label="Upload image" @change="handleImageSelect" />
              <input ref="csvFileInputRef" type="file" accept=".csv,text/csv" class="hidden" aria-label="Import CSV"
                @change="handleCsvSelect" />

              <!-- PAGE VIEW (A4 SHEET) -->
              <div
                v-if="isPageView"
                class="page-view-sheet-wrapper"
                :style="{
                  width: `${A4_SHEET_WIDTH_PX * effectiveScale}px`,
                  minHeight: `${A4_SHEET_HEIGHT_PX * effectiveScale}px`
                }"
              >
                <div
                  class="page-view-sheet-scaler"
                  :style="{
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: 'top center',
                    width: `${A4_SHEET_WIDTH_PX}px`
                  }"
                >
                  <div class="page-view-sheet">
                    <EditorContent :editor="editor" class="prose prose-invert max-w-none rose-editor-content flex-1 page-view-content" :class="{ 'read-mode': isReadMode }" />
                  </div>
                </div>
              </div>

              <!-- CONTINUOUS VIEW (ELEVATED CARD) -->
              <div
                v-else
                class="continuous-doc-card w-full flex-1 flex flex-col"
                :class="[
                  isFullWidth ? 'continuous-full-width' : 'continuous-standard-width'
                ]"
              >
                <EditorContent :editor="editor" class="prose prose-invert max-w-none rose-editor-content flex-1" :class="{ 'read-mode': isReadMode, 'full-width-content': isFullWidth }" />
              </div>
            </div>

            <!-- Toolbar: right position -->
            <DocToolbar ref="toolbarRef" v-if="!isReadMode && editor && effectivePosition === 'right'" :editor="editor"
              :max-table-rows="MAX_TABLE_ROWS" :max-table-cols="MAX_TABLE_COLS" :position="effectivePosition"
              @trigger-image-pick="triggerImagePick" @set-link="setLink" @insert-table="insertTable"
              @trigger-csv-pick="triggerCsvPick" @export-as-html="exportAsHtml" @export-as-markdown="exportAsMarkdown"
              @export-as-text="exportAsText" @export-as-pdf="exportAsPdf"
              @toggle-read-mode="isReadMode = true" />

            <!-- Toolbar: bottom position (fixed, rendered outside flow but still here for v-if) -->
            <DocToolbar ref="toolbarRef" v-if="!isReadMode && editor && effectivePosition === 'bottom'" :editor="editor"
              :max-table-rows="MAX_TABLE_ROWS" :max-table-cols="MAX_TABLE_COLS" :position="effectivePosition"
              @trigger-image-pick="triggerImagePick" @set-link="setLink" @insert-table="insertTable"
              @trigger-csv-pick="triggerCsvPick" @export-as-html="exportAsHtml" @export-as-markdown="exportAsMarkdown"
              @export-as-text="exportAsText" @export-as-pdf="exportAsPdf"
              @toggle-read-mode="isReadMode = true" />
          </div>
          </div>
        </ErrorBoundary>
      </div>
    </template>
  </div>
</template>

<style>
.rose-editor-content.read-mode .ProseMirror {
  cursor: default;
  user-select: text;
}

.rose-editor-content.read-mode .ProseMirror:focus {
  outline: none;
}

.rose-editor-content.read-mode p.is-editor-empty:first-child::before {
  display: none;
}

.rose-editor-content .ProseMirror {
  outline: none;
  max-width: clamp(320px, 72ch, 860px);
  margin-left: auto;
  margin-right: auto;
  width: 100%;
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

.rose-editor-content li>p {
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

.rose-editor-content ul[data-type="taskList"] li>label {
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

/* ── Page View (A4 Paper on Desk) ── */
.page-view-desk {
  background-color: var(--desk-bg, #ded6d8);
  transition: background-color 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1.5rem;
  padding-bottom: 3.5rem;
}

.dark .page-view-desk {
  --desk-bg: #120b0d;
}

.page-view-sheet-wrapper {
  display: flex;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
  transition: width 0.15s ease-out, min-height 0.15s ease-out;
}

.page-view-sheet-scaler {
  transform-origin: top center;
  transition: transform 0.15s ease-out;
  flex-shrink: 0;
}

.page-view-sheet {
  width: 794px;
  min-height: 1122px;
  background-color: #ffffff;
  color: #2b1a1e;
  box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.12), 0 2px 8px -1px rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  border: 1px solid rgba(43, 26, 30, 0.16);
  padding: 76px 68px;
  position: relative;
  box-sizing: border-box;
}

.dark .page-view-sheet {
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* Page break guide line every 1122px (297mm @ 96 dpi) */
.page-view-sheet::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 1121px,
    rgba(179, 64, 90, 0.28) 1121px,
    rgba(179, 64, 90, 0.28) 1122px
  );
  pointer-events: none;
  z-index: 10;
}

/* Inside paper sheet, typography mirrors print exactly */
.page-view-sheet .rose-editor-content .ProseMirror {
  max-width: 100% !important;
  width: 100%;
  font-size: 11pt;
  line-height: 1.6;
  margin: 0;
  color: #2b1a1e;
}

/* Consistent document ink contrast inside paper sheet */
.page-view-sheet .rose-editor-content h1,
.page-view-sheet .rose-editor-content h2,
.page-view-sheet .rose-editor-content h3 {
  color: #2b1a1e;
}

.page-view-sheet .rose-editor-content p,
.page-view-sheet .rose-editor-content li {
  color: #2b1a1e;
}

.page-view-sheet .rose-editor-content td,
.page-view-sheet .rose-editor-content th {
  color: #2b1a1e;
  border-color: #e6d3d7;
}

.page-view-sheet .rose-editor-content th {
  background-color: #f6ecee;
}

.page-view-sheet .rose-editor-content pre {
  background: #f6ecee;
  border-color: #e6d3d7;
  color: #2b1a1e;
}

.page-view-sheet .rose-editor-content code {
  background: #f6ecee;
  color: #2b1a1e;
}

.page-view-sheet .rose-editor-content blockquote {
  color: #7a6367;
  border-left-color: #b3405a;
}

/* ── Continuous View (Elevated Document Card) ── */
.continuous-view-canvas {
  background-color: var(--color-rose-bg);
}

.continuous-doc-card {
  background-color: var(--color-rose-surface);
  border: 1px solid var(--color-rose-border);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02);
  margin-left: auto;
  margin-right: auto;
  padding: 2.5rem 3rem 4rem;
  transition: max-width 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease;
  min-height: 100%;
}

.continuous-standard-width {
  max-width: clamp(320px, 72ch, 860px);
}

.continuous-full-width {
  max-width: min(100%, 1400px);
}

.rose-editor-content.full-width-content .ProseMirror {
  max-width: 100% !important;
}

@media (max-width: 640px) {
  .continuous-doc-card {
    border: none;
    background-color: transparent;
    box-shadow: none;
    padding: 0.5rem 0.25rem 2rem;
    border-radius: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-view-desk,
  .page-view-sheet-wrapper,
  .page-view-sheet-scaler,
  .continuous-doc-card {
    transition: none !important;
  }
}

@media (forced-colors: active) {
  .page-view-sheet,
  .continuous-doc-card {
    border: 2px solid CanvasText !important;
  }
}
</style>
