<!-- src/components/NoteCanvas.vue -->
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useHandwritingCanvas } from "../composables/useHandwritingCanvas";
import NoteToolbar from "./NoteToolbar.vue";
import type { ToolbarPosition } from "../composables/useToolbarPosition";

// const props = defineProps<{
//   initialCanvasJSON: Record<string, unknown> | null;
//   initialBackgroundColor: string;
//   toolbarPosition: ToolbarPosition;
// }>();

const props = withDefaults(
  defineProps<{
    initialCanvasJSON?: Record<string, unknown> | null;
    initialBackgroundColor: string;
    toolbarPosition: ToolbarPosition;
  }>(),
  {
    initialCanvasJSON: null,
  },
);

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
} = useHandwritingCanvas(canvasEl);

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    const json = toJSON();
    const thumbnail = generateThumbnail();
    if (json && thumbnail) {
      emit("change", json, backgroundColor.value, thumbnail);
    }
  }, 800); // debounced, same spirit as Docs' autosave
}

onMounted(async () => {
  if (!canvasEl.value) {
    return;
  }
  init(canvasEl.value);
  await loadFromJSON(props.initialCanvasJSON, props.initialBackgroundColor);

  fabricCanvas.value?.on("object:added", scheduleSave);
  fabricCanvas.value?.on("object:removed", scheduleSave);
  fabricCanvas.value?.on("object:modified", scheduleSave);
});

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
  <div class="note-canvas">
    <NoteToolbar
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
    />
    <div class="note-canvas__scroll">
      <canvas ref="canvasEl" />
    </div>
    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      class="sr-only"
      @change="handleImageSelected"
    />
  </div>
</template>

<style scoped>
.note-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

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
