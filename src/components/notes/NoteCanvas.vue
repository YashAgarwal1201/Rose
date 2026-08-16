<!-- src/components/NoteCanvas.vue -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useHandwritingCanvas } from "@/composables/notes/useHandwritingCanvas.ts";
import { useNoteExport } from "@/composables/notes/useNoteExport.ts";
import { debounce } from "@/utils/debounce";
import NoteToolbar from "@/components/notes/NoteToolbar.vue";
import type { ToolbarPosition } from "@/composables/ui/useToolbarPosition";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts.ts";
import { useToast } from "@/composables/ui/useToast.ts";
import { TOAST_AUTO_DISMISS_MS } from "@/utils/constants";
import type { BackgroundPattern } from "@/db/types";

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
  initialBackgroundPattern,
  toolbarPosition,
  noteTitle,
} = defineProps<{
  initialCanvasJson: Record<string, unknown> | null;
  initialBackgroundColor: string;
  initialBackgroundPattern: BackgroundPattern;
  toolbarPosition: ToolbarPosition;
  noteTitle?: string;
}>();

const emit = defineEmits<{
  change: [canvasJSON: Record<string, unknown>, backgroundColor: string, backgroundPattern: BackgroundPattern, thumbnail: string];
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
  backgroundPattern,
  canUndo,
  canRedo,
  undo,
  redo,
  addShape,
  addText,
  addImage,
  setBackgroundColor,
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
    emit("change", json, backgroundColor.value, backgroundPattern.value, thumbnail);
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
  await loadFromJSON(initialCanvasJson, initialBackgroundColor, initialBackgroundPattern);

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

    await loadFromJSON(canvasJSON, initialBackgroundColor, initialBackgroundPattern);
  },
);

watch([backgroundColor, backgroundPattern], () => {
  scheduleSave();
});

watch(tool, (value) => {
  if (value === "text") {
    addText();
  }
});

function triggerImagePick() {
  imageInputRef.value?.click();
}

async function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    try {
      await addImage(file);
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  }
  input.value = "";
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Body: toolbar + editor, direction depends on position -->
    <div class="flex flex-1 min-h-0"
      :class="toolbarPosition === 'left' || toolbarPosition === 'right' ? 'flex-row' : 'flex-col'">
      <!-- Toolbar: left or top -->
      <NoteToolbar v-if="toolbarPosition === 'top' || toolbarPosition === 'left'" ref="toolbarRef" v-model:tool="tool"
        v-model:pen-tool="penTool" v-model:shape-tool="shapeTool" v-model:pen-color="penColor"
        :background-color="backgroundColor" @update:background-color="setBackgroundColor($event, backgroundPattern)"
        :background-pattern="backgroundPattern" @update:background-pattern="setBackgroundColor(backgroundColor, $event)"
        :can-undo="canUndo" :can-redo="canRedo" :position="toolbarPosition"
        @undo="undo" @redo="redo" @add-text="addText" @add-image="addImage" @export-as-png="exportAsPng"
        @export-as-jpeg="exportAsJpeg" @export-as-svg="exportAsSvg" @add-shape="(shape) => addShape(shape, penColor)" />
      
      <div class="note-canvas__scroll flex-1 relative min-h-0 min-w-0" style="overflow: auto;">
        <canvas ref="canvasEl" />
      </div>

      <!-- Toolbar: right or bottom -->
      <NoteToolbar v-if="toolbarPosition === 'bottom' || toolbarPosition === 'right'" ref="toolbarRef"
        v-model:tool="tool" v-model:pen-tool="penTool" v-model:shape-tool="shapeTool" v-model:pen-color="penColor"
        :background-color="backgroundColor" @update:background-color="setBackgroundColor($event, backgroundPattern)"
        :background-pattern="backgroundPattern" @update:background-pattern="setBackgroundColor(backgroundColor, $event)"
        :can-undo="canUndo" :can-redo="canRedo" :position="toolbarPosition" @undo="undo" @redo="redo" @add-text="addText"
        @add-image="addImage" @export-as-png="exportAsPng" @export-as-jpeg="exportAsJpeg" @export-as-svg="exportAsSvg"
        @add-shape="(shape) => addShape(shape, penColor)" />
      
      <input ref="imageInputRef" type="file" accept="image/*" class="sr-only" @change="handleImageSelected" />
    </div>
  </div>
</template>

<style scoped>
/* Remove the hardcoded flex-direction so the inline class can work */

.note-canvas__scroll {
  flex: 1 1 auto;
  min-width: 0;
  /* critical: prevents flex from sizing to canvas's intrinsic 300px */
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.note-canvas__scroll canvas {
  display: block;
}
</style>
