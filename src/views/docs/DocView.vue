<!-- src/views/docs/DocView.vue -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useEditor, type Editor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Markdown } from "@tiptap/markdown";
import { PaginationPlus } from "tiptap-pagination-plus";

import DocHeader from "@/components/docs/DocHeader.vue";
import DocToolbar from "@/components/docs/DocToolbar.vue";
import DocTableContextBar from "@/components/docs/DocTableContextBar.vue";
import DocPageViewSheet from "@/components/docs/DocPageViewSheet.vue";
import DocContinuousViewSheet from "@/components/docs/DocContinuousViewSheet.vue";
import ErrorBoundary from "@/components/ui/ErrorBoundary.vue";
import VaultAuthView from "@/components/ui/VaultAuthView.vue";

import { useToast } from "@/composables/ui/useToast";
import { useInput } from "@/composables/ui/useInput";
import { useDocumentTitle } from "@/composables/app/useDocumentTitle";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts";
import { useToolbarPosition } from "@/composables/ui/useToolbarPosition";
import {
  A4_SHEET_GAP_PX,
  A4_SHEET_HEIGHT_PX,
  A4_SHEET_WIDTH_PX,
  usePageView,
} from "@/composables/docs/usePageView";
import { useDocExport } from "@/composables/docs/useDocExport";
import { useDocPersistence } from "@/composables/docs/useDocPersistence";
import { useDocFileImport, fileToDataUrl } from "@/composables/docs/useDocFileImport";
import { MAX_TABLE_COLS, MAX_TABLE_ROWS } from "@/composables/docs/useDocTableActions";
import { TOAST_AUTO_DISMISS_MS } from "@/utils/constants";

const { pathMatch } = defineProps<{ pathMatch?: string | string[] }>();

const router = useRouter();
const { showToast } = useToast();
const { requestInput } = useInput();

const segments = computed(() =>
  Array.isArray(pathMatch) ? pathMatch : pathMatch ? [pathMatch] : [],
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
  pageCount,
  setPageCount,
  totalSheetHeight,
} = usePageView();

const isReadMode = ref(isMobile.value);
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
    isFullWidth.value ? "Full width layout enabled." : "Standard readable width (72ch) enabled.",
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

// Editor ref for persistence, export, and toolbar
const editor = shallowRef<Editor | undefined>(undefined);

// Persistence composable
const {
  currentDoc,
  isVaultLocked,
  isRenaming,
  renameValue,
  saveContent,
  flushPendingSave,
  loadDoc,
  goBack,
  startRenameTitle,
  confirmRenameTitle,
  cancelRenameTitle,
} = useDocPersistence({
  editor,
  router,
  isPageView,
  isReadMode,
  isMobile,
  segments,
});

useDocumentTitle(() => currentDoc.value?.title || "Doc");

// Export composable
const isExportMenuOpen = ref(false);
const docTitle = computed(() => currentDoc.value?.title);
const { exportAsHtml, exportAsMarkdown, exportAsText, exportAsPdf } = useDocExport(
  editor,
  docTitle,
  isExportMenuOpen,
);

// File import composable
const {
  fileInputRef,
  csvFileInputRef,
  triggerImagePick,
  handleImageSelect,
  triggerCsvPick,
  handleCsvSelect,
} = useDocFileImport({ editor });

// Table extensions
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

function insertTable(rows: number, cols: number) {
  editor.value?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
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
  editor.value?.chain().focus().setLink({ href: url }).run();
}

// Tiptap Editor initialization
const tiptapEditor = useEditor({
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
    PaginationPlus.configure({
      enabled: isPageView.value,
      pageHeight: A4_SHEET_HEIGHT_PX,
      pageWidth: A4_SHEET_WIDTH_PX,
      pageGap: A4_SHEET_GAP_PX,
      marginTop: 76,
      marginBottom: 76,
      marginLeft: 68,
      marginRight: 68,
      pageBreakBackground: "var(--desk-bg, #ded6d8)",
      footerRight: "Page {page}",
    }),
  ],
  onCreate({ editor: currentEditor }) {
    if (isPageView.value) {
      currentEditor.commands?.enablePagination?.();
    } else {
      currentEditor.commands?.disablePagination?.();
    }
  },
  onTransaction() {
    if (editor.value?.view?.dom) {
      const paginationElement = editor.value.view.dom.querySelector("[data-rm-pagination]");
      const count = paginationElement?.children?.length || 1;
      setPageCount(count);
    }
  },
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

watch(
  tiptapEditor,
  (instance) => {
    editor.value = instance;
  },
  { immediate: true },
);

watch(isPageView, (active) => {
  if (active) {
    editor.value?.commands?.enablePagination?.();
    nextTick().then(() => {
      updateContainerWidth();
      if (
        !isDesktop.value ||
        (editorScrollContainerRef.value && editorScrollContainerRef.value.clientWidth < 850)
      ) {
        setZoom("fit");
      }
    });
  } else {
    editor.value?.commands?.disablePagination?.();
  }
});

watch(isReadMode, (readOnly) => {
  editor.value?.setEditable(!readOnly);
  if (!readOnly && !isMobile.value) {
    nextTick().then(() => {
      editor.value?.commands.focus("end");
    });
  }
});

const toolbarRef = ref<InstanceType<typeof DocToolbar> | null>(null);

useKeyboardShortcuts([
  {
    key: "s",
    ctrl: true,
    handler: () => {
      flushPendingSave();
      showToast("Document saved", "info", TOAST_AUTO_DISMISS_MS);
    },
  },
  {
    key: "b",
    ctrl: true,
    handler: () => {
      if (isReadMode.value) return false;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return false;
      editor.value?.chain().focus().toggleBold().run();
    },
  },
  {
    key: "i",
    ctrl: true,
    handler: () => {
      if (isReadMode.value) return false;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return false;
      editor.value?.chain().focus().toggleItalic().run();
    },
  },
  {
    key: "u",
    ctrl: true,
    handler: () => {
      if (isReadMode.value) return false;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return false;
      editor.value?.chain().focus().toggleUnderline().run();
    },
  },
  {
    key: "x",
    ctrl: true,
    alt: true,
    handler: () => {
      if (isReadMode.value) return false;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return false;
      editor.value?.chain().focus().toggleStrike().run();
    },
  },
  {
    key: "k",
    ctrl: true,
    handler: () => {
      if (isReadMode.value) return false;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return false;
      setLink();
    },
  },
  {
    key: "s",
    ctrl: true,
    shift: true,
    handler: () => {
      if (isReadMode.value) return false;
      toolbarRef.value?.toggleExportMenu();
    },
  },
  {
    key: "p",
    ctrl: true,
    alt: true,
    handler: () => {
      if (isReadMode.value) return false;
      handleTogglePageView();
    },
  },
  {
    key: "f",
    ctrl: true,
    alt: true,
    handler: () => {
      if (isReadMode.value || isPageView.value) return false;
      handleToggleFullWidth();
    },
  },
  {
    key: "0",
    ctrl: true,
    alt: true,
    handler: () => {
      if (isReadMode.value || !isPageView.value) return false;
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
    flushPendingSave();
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
    <VaultAuthView v-if="isVaultLocked" @unlocked="() => loadDoc()" />
    <template v-else-if="currentDoc">
      <div class="flex flex-col h-full overflow-hidden">
        <!-- Live screen reader announcements for view and zoom adjustments -->
        <div class="sr-only" aria-live="polite" aria-atomic="true">
          {{ a11yAnnouncement }}
        </div>

        <!-- Header -->
        <DocHeader
          :title="currentDoc?.title"
          :updated-at="currentDoc?.updatedAt"
          :is-renaming="isRenaming"
          :rename-value="renameValue"
          :is-read-mode="isReadMode"
          :is-desktop="isDesktop"
          :is-page-view="isPageView"
          :is-full-width="isFullWidth"
          :page-count="pageCount"
          :zoom-level="zoomLevel"
          :effective-scale="effectiveScale"
          :saved-position="savedPosition"
          @back="goBack"
          @start-rename="startRenameTitle"
          @confirm-rename="confirmRenameTitle"
          @cancel-rename="cancelRenameTitle"
          @update:rename-value="renameValue = $event"
          @set-read-mode="isReadMode = $event"
          @toggle-page-view="handleTogglePageView"
          @toggle-full-width="handleToggleFullWidth"
          @zoom-in="handleZoomIn"
          @zoom-out="handleZoomOut"
          @cycle-zoom="handleCycleZoom"
          @set-position="setPosition"
        />

        <!-- Body: toolbar + editor, direction depends on position -->
        <ErrorBoundary>
          <div class="flex flex-col flex-1 min-h-0">
            <div class="flex flex-1 min-h-0" :class="isVertical ? 'flex-row' : 'flex-col'">
              <!-- Toolbar: left or top -->
              <DocToolbar
                ref="toolbarRef"
                v-if="
                  !isReadMode &&
                  editor &&
                  (effectivePosition === 'top' || effectivePosition === 'left')
                "
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
                @toggle-read-mode="isReadMode = true"
              />

              <!-- Editor + table context bar -->
              <div
                ref="editorScrollContainerRef"
                class="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto px-2 sm:px-4 md:px-6 pt-4"
                :class="[
                  !isReadMode && effectivePosition === 'bottom' ? 'pb-12 md:pb-8' : 'pb-8',
                  isPageView ? 'page-view-desk' : 'continuous-view-canvas',
                ]"
              >
                <!-- Table context toolbar -->
                <DocTableContextBar
                  :editor="editor"
                  :is-read-mode="isReadMode"
                  :is-page-view="isPageView"
                  :is-full-width="isFullWidth"
                  :effective-scale="effectiveScale"
                />

                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  aria-label="Upload image"
                  @change="handleImageSelect"
                />
                <input
                  ref="csvFileInputRef"
                  type="file"
                  accept=".csv,text/csv"
                  class="hidden"
                  aria-label="Import CSV"
                  @change="handleCsvSelect"
                />

                <!-- PAGE VIEW (A4 SHEET) -->
                <DocPageViewSheet
                  v-if="isPageView"
                  :editor="editor"
                  :is-read-mode="isReadMode"
                  :effective-scale="effectiveScale"
                  :total-sheet-height="totalSheetHeight"
                />

                <!-- CONTINUOUS VIEW (ELEVATED CARD) -->
                <DocContinuousViewSheet
                  v-else
                  :editor="editor"
                  :is-read-mode="isReadMode"
                  :is-full-width="isFullWidth"
                />
              </div>

              <!-- Toolbar: right position -->
              <DocToolbar
                ref="toolbarRef"
                v-if="!isReadMode && editor && effectivePosition === 'right'"
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
                @toggle-read-mode="isReadMode = true"
              />

              <!-- Toolbar: bottom position -->
              <DocToolbar
                ref="toolbarRef"
                v-if="!isReadMode && editor && effectivePosition === 'bottom'"
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
                @toggle-read-mode="isReadMode = true"
              />
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </template>
  </div>
</template>

<style>
@import "@/assets/styles/doc-editor.css";
@import "@/assets/styles/doc-page-view.css";
</style>
