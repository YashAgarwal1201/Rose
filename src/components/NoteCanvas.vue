<!-- src/components/NoteCanvas.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useHandwritingCanvas } from "../composables/useHandwritingCanvas";
import { useNoteExport } from "../composables/useNoteExport";
import { debounce } from "../utils/debounce";
import NoteToolbar from "./NoteToolbar.vue";
import type { ToolbarPosition } from "../composables/useToolbarPosition";
import { useKeyboardShortcuts } from "../composables/useKeyboardShortcuts";
import { useToast } from "../composables/useToast";
import { TOAST_AUTO_DISMISS_MS } from "../utils/constants";

// const props = withDefaults(
//   defineProps<{
//     initialCanvasJSON?: Record<string, unknown> | null;
//     initialBackgroundColor: string;
//     toolbarPosition: ToolbarPosition;
//   }>(),
//   {
//     initialCanvasJSON: null,
//   },
// );

const {
  initialCanvasJson,
  initialBackgroundColor,
  toolbarPosition,
  noteTitle,
} = defineProps<{
  initialCanvasJson: Record<string, unknown> | null;
  initialBackgroundColor: string;
  toolbarPosition: ToolbarPosition;
  noteTitle?: string;
}>();

const emit = defineEmits<{
  change: [canvasJSON: Record<string, unknown>, backgroundColor: string, thumbnail: string];
}>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);

const {
  init,
  loadFromJSON,
  toJSON,
  generateThumbnail,
  tool,
  penTool,
  shapeTool,
  penColor,
  backgroundColor,
  canUndo,
  canRedo,
  undo,
  redo,
  addShape,
  addText,
  addImage,
  fabricCanvas,
  destroy,
} = useHandwritingCanvas(canvasEl);

const dummyMenuOpen = ref(false);
const { exportAsPng, exportAsJpeg, exportAsSvg } = useNoteExport(
  fabricCanvas,
  computed(() => noteTitle),
  dummyMenuOpen,
);

const toolbarRef = ref<InstanceType<typeof NoteToolbar> | null>(null);
const { showToast } = useToast();

useKeyboardShortcuts([
  // Ctrl + S → Save note immediately
  {
    key: "s",
    ctrl: true,
    handler: () => {
      saveNow();
      showToast("Note saved", "info", TOAST_AUTO_DISMISS_MS);
    },
  },
  // Ctrl + Z → Undo drawing stroke
  {
    key: "z",
    ctrl: true,
    handler: () => {
      if (canUndo.value) {
        undo();
      } else {
        return false; // let event propagate if we can't undo (e.g. let text inputs handle undo/redo)
      }
    },
    skipInInput: true, // Only trigger global canvas undo if not typing
  },
  // Ctrl + Shift + Z → Redo drawing stroke
  {
    key: "z",
    ctrl: true,
    shift: true,
    handler: () => {
      if (canRedo.value) {
        redo();
      } else {
        return false;
      }
    },
    skipInInput: true,
  },
  // Ctrl + Y → Redo drawing stroke (alternative shortcut)
  {
    key: "y",
    ctrl: true,
    handler: () => {
      if (canRedo.value) {
        redo();
      } else {
        return false;
      }
    },
    skipInInput: true,
  },
  // Ctrl + Shift + S → Toggle Export Menu
  {
    key: "s",
    ctrl: true,
    shift: true,
    handler: () => {
      toolbarRef.value?.toggleExportMenu();
    },
  },
]);

function saveNow() {
  const json = toJSON();
  const thumbnail = generateThumbnail();
  if (json && thumbnail) {
    emit("change", json, backgroundColor.value, thumbnail);
  }
}

// debounced, same spirit as Docs' autosave — but now uses the shared utility
// so we can .flush() a pending save before unmount/reload, instead of
// silently losing it when the timer never gets a chance to fire.
const scheduleSave = debounce(saveNow, 800);

function handleBeforeUnload() {
  scheduleSave.flush();
}

const isCanvasReady = false;

onMounted(async () => {
  // console.log("NoteCanvas mounted, initialCanvasJSON prop:", initialCanvasJson);
  if (!canvasEl.value) {
    return;
  }
  init(canvasEl.value);
  await loadFromJSON(initialCanvasJson, initialBackgroundColor);

  // await loadFromJSON(initialCanvasJson, initialBackgroundColor);
  // console.log("objects after load:", fabricCanvas.value?.getObjects().length);

  fabricCanvas.value?.on("object:added", scheduleSave);
  fabricCanvas.value?.on("object:removed", scheduleSave);
  fabricCanvas.value?.on("object:modified", scheduleSave);

  window.addEventListener("beforeunload", handleBeforeUnload);
});

onBeforeUnmount(() => {
  // Remove the listener first, then flush — avoids a double-fire if a
  // beforeunload event lands in the same tick as component teardown.
  window.removeEventListener("beforeunload", handleBeforeUnload);
  // Flush before the parent's :key change disposes the Fabric canvas,
  // so a pending edit from the last 800ms isn't dropped when switching notes.
  scheduleSave.flush();
  destroy();
});

watch(
  () => initialCanvasJson,
  async (canvasJSON) => {
    if (!isCanvasReady || !canvasJSON) {
      return;
    }

    await loadFromJSON(canvasJSON, initialBackgroundColor);
  },
);

watch(backgroundColor, (color) => {
  if (fabricCanvas.value) {
    fabricCanvas.value.backgroundColor = color;
    fabricCanvas.value.requestRenderAll();
  }
  scheduleSave();
});

watch(tool, (value) => {
  if (value === "shape") {
    addShape(shapeTool.value, penColor.value);
  }
  if (value === "text") {
    addText();
  }
});

watch(shapeTool, (value) => {
  if (tool.value === "shape") {
    addShape(value, penColor.value);
  }
});

function triggerImagePick() {
  imageInputRef.value?.click();
}

async function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    await addImage(file);
  }
  input.value = "";
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Body: toolbar + editor, direction depends on position -->
    <div class="flex flex-1 min-h-0" :class="toolbarPosition === 'left' || toolbarPosition === 'right' ? 'flex-row' : 'flex-col'">
      <!-- Toolbar: left or top -->
      <NoteToolbar
        v-if="toolbarPosition === 'top' || toolbarPosition === 'left'"
        ref="toolbarRef"
        v-model:tool="tool"
        v-model:pen-tool="penTool"
        v-model:shape-tool="shapeTool"
        v-model:pen-color="penColor"
        v-model:background-color="backgroundColor"
        :can-undo="canUndo"
        :can-redo="canRedo"
        :position="toolbarPosition"
        @undo="undo"
        @redo="redo"
        @trigger-image-pick="triggerImagePick"
        @export-as-png="exportAsPng"
        @export-as-jpeg="exportAsJpeg"
        @export-as-svg="exportAsSvg"
      />
      <div class="note-canvas__scroll">
        <canvas ref="canvasEl" />
      </div>
      <!-- Toolbar: right or bottom -->
      <NoteToolbar
        v-if="toolbarPosition === 'bottom' || toolbarPosition === 'right'"
        ref="toolbarRef"
        v-model:tool="tool"
        v-model:pen-tool="penTool"
        v-model:shape-tool="shapeTool"
        v-model:pen-color="penColor"
        v-model:background-color="backgroundColor"
        :can-undo="canUndo"
        :can-redo="canRedo"
        :position="toolbarPosition"
        @undo="undo"
        @redo="redo"
        @trigger-image-pick="triggerImagePick"
        @export-as-png="exportAsPng"
        @export-as-jpeg="exportAsJpeg"
        @export-as-svg="exportAsSvg"
      />
      <input
        ref="imageInputRef"
        type="file"
        accept="image/*"
        class="sr-only"
        @change="handleImageSelected"
      />
    </div>
  </div>
</template>

<style scoped>
/* Remove the hardcoded flex-direction so the inline class can work */

.note-canvas__scroll {
  flex: 1 1 auto;
  min-width: 0; /* critical: prevents flex from sizing to canvas's intrinsic 300px */
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.note-canvas__scroll canvas {
  display: block;
}
</style>
