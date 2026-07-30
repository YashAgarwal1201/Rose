<script setup lang="ts">
import { computed, ref } from "vue";
import {
  MoveUpRight as ArrowIcon,
  Circle as EllipseIcon,
  EraserIcon,
  ImageIcon,
  Minus as LineIcon,
  MousePointer2Icon,
  PaletteIcon,
  PenLine as PenIcon,
  Redo2Icon,
  SquareIcon,
  TypeIcon,
  Undo2Icon,
} from "@lucide/vue";
import type { ToolbarPosition } from "../composables/useToolbarPosition";
import { type PopoverPlacement, usePopoverPosition } from "../composables/usePopoverPosition";
import type { CanvasTool, PenTool, ShapeTool } from "../composables/useHandwritingCanvas";

const {
  tool,
  penTool,

  penColor,

  canUndo,
  canRedo,
  position,
} = defineProps<{
  tool: CanvasTool;
  penTool: PenTool;
  shapeTool: ShapeTool;
  penColor: string;
  backgroundColor: string;
  canUndo: boolean;
  canRedo: boolean;
  position: ToolbarPosition;
}>();

const emit = defineEmits<{
  "update:tool": [CanvasTool];
  "update:penTool": [PenTool];
  "update:shapeTool": [ShapeTool];
  "update:penColor": [string];
  "update:backgroundColor": [string];
  undo: [];
  redo: [];
  triggerImagePick: [];
}>();

const PEN_COLORS = [
  "#1a1a1a",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#ffffff",
];
const BACKGROUND_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Cream", value: "#fdf6e3" },
  { label: "Soft gray", value: "#f1f5f9" },
  { label: "Charcoal", value: "#1e293b" },
];

const rootRef = ref<HTMLElement | null>(null);
const penTriggerRef = ref<HTMLButtonElement | null>(null);
const shapeTriggerRef = ref<HTMLButtonElement | null>(null);
const colorTriggerRef = ref<HTMLButtonElement | null>(null);
const backgroundTriggerRef = ref<HTMLButtonElement | null>(null);
const penPopoverRef = ref<HTMLElement | null>(null);
const shapePopoverRef = ref<HTMLElement | null>(null);
const colorPopoverRef = ref<HTMLElement | null>(null);
const backgroundPopoverRef = ref<HTMLElement | null>(null);

const isPenPopoverOpen = ref(false);
const isShapePopoverOpen = ref(false);
const isColorPopoverOpen = ref(false);
const isBackgroundPopoverOpen = ref(false);

const startPlacement = computed<PopoverPlacement>(() => {
  if (position === "left") { return "right-start"; }
  if (position === "right") { return "left-start"; }
  if (position === "bottom") { return "top-start"; }
  return "bottom-start";
});

const penAnchor = usePopoverPosition(rootRef, penTriggerRef, penPopoverRef, startPlacement);
const shapeAnchor = usePopoverPosition(rootRef, shapeTriggerRef, shapePopoverRef, startPlacement);
const colorAnchor = usePopoverPosition(rootRef, colorTriggerRef, colorPopoverRef, startPlacement);
const backgroundAnchor = usePopoverPosition(
  rootRef,
  backgroundTriggerRef,
  backgroundPopoverRef,
  startPlacement,
);

function closeAllPopovers() {
  isPenPopoverOpen.value = false;
  isShapePopoverOpen.value = false;
  isColorPopoverOpen.value = false;
  isBackgroundPopoverOpen.value = false;
  penAnchor.close();
  shapeAnchor.close();
  colorAnchor.close();
  backgroundAnchor.close();
}

function selectTool(next: CanvasTool) {
  emit("update:tool", next);
  if (next !== "pen") { closeAllPopovers(); }
}

function togglePenPopover() {
  const next = !isPenPopoverOpen.value;
  closeAllPopovers();
  selectTool("pen");
  if (next) {
    isPenPopoverOpen.value = true;
    penAnchor.open();
  }
}
function toggleShapePopover() {
  const next = !isShapePopoverOpen.value;
  closeAllPopovers();
  selectTool("shape");
  if (next) {
    isShapePopoverOpen.value = true;
    shapeAnchor.open();
  }
}
function toggleColorPopover() {
  const next = !isColorPopoverOpen.value;
  closeAllPopovers();
  if (next) {
    isColorPopoverOpen.value = true;
    colorAnchor.open();
  }
}
function toggleBackgroundPopover() {
  const next = !isBackgroundPopoverOpen.value;
  closeAllPopovers();
  if (next) {
    isBackgroundPopoverOpen.value = true;
    backgroundAnchor.open();
  }
}

const activeBtn = "bg-rose-surface-alt text-rose-primary";
const idleBtn = "text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text";
</script>

<template>
  <div ref="rootRef"
    class="relative flex items-center gap-1 px-2 py-1.5 border-b border-rose-border bg-rose-surface overflow-x-auto shrink-0"
    style="scrollbar-width: none">
    <button type="button" class="p-2 rounded-md transition-colors" :class="tool === 'select' ? activeBtn : idleBtn"
      title="Select" @click="selectTool('select')">
      <MousePointer2Icon class="w-4.5 h-4.5" />
    </button>
    <button ref="penTriggerRef" type="button" class="p-2 rounded-md transition-colors"
      :class="tool === 'pen' ? activeBtn : idleBtn" title="Pen" @click="togglePenPopover">
      <PenIcon class="w-4.5 h-4.5" />
    </button>
    <button type="button" class="p-2 rounded-md transition-colors" :class="tool === 'eraser' ? activeBtn : idleBtn"
      title="Eraser" @click="selectTool('eraser')">
      <EraserIcon class="w-4.5 h-4.5" />
    </button>
    <button ref="colorTriggerRef" type="button" class="p-2 rounded-md transition-colors" :class="idleBtn"
      title="Pen color" @click="toggleColorPopover">
      <span class="block w-4.5 h-4.5 rounded-full border border-rose-border" :style="{ backgroundColor: penColor }" />
    </button>
    <button ref="shapeTriggerRef" type="button" class="p-2 rounded-md transition-colors"
      :class="tool === 'shape' ? activeBtn : idleBtn" title="Shapes" @click="toggleShapePopover">
      <SquareIcon class="w-4.5 h-4.5" />
    </button>
    <button type="button" class="p-2 rounded-md transition-colors" :class="tool === 'text' ? activeBtn : idleBtn"
      title="Text box" @click="selectTool('text')">
      <TypeIcon class="w-4.5 h-4.5" />
    </button>
    <button type="button" class="p-2 rounded-md transition-colors" :class="idleBtn" title="Insert image"
      @click="emit('triggerImagePick')">
      <ImageIcon class="w-4.5 h-4.5" />
    </button>
    <button ref="backgroundTriggerRef" type="button" class="p-2 rounded-md transition-colors" :class="idleBtn"
      title="Page background" @click="toggleBackgroundPopover">
      <PaletteIcon class="w-4.5 h-4.5" />
    </button>

    <div class="w-px h-5 bg-rose-border mx-1 shrink-0"></div>

    <button type="button" class="p-2 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
      :class="idleBtn" :disabled="!canUndo" title="Undo" @click="emit('undo')">
      <Undo2Icon class="w-4.5 h-4.5" />
    </button>
    <button type="button" class="p-2 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
      :class="idleBtn" :disabled="!canRedo" title="Redo" @click="emit('redo')">
      <Redo2Icon class="w-4.5 h-4.5" />
    </button>

    <div v-if="isPenPopoverOpen" ref="penPopoverRef"
      class="absolute z-20 flex flex-col gap-0.5 p-1.5 min-w-28 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="penAnchor.style">
      <button v-for="preset in ['pencil', 'pen', 'marker'] as PenTool[]" :key="preset" type="button"
        class="px-2.5 py-1.5 rounded-md text-sm text-left capitalize transition-colors" :class="penTool === preset
            ? 'bg-rose-surface-alt text-rose-primary'
            : 'text-rose-text hover:bg-rose-surface-alt'
          " @click="emit('update:penTool', preset)">
        {{ preset }}
      </button>
    </div>

    <div v-if="isShapePopoverOpen" ref="shapePopoverRef"
      class="absolute z-20 flex flex-col gap-0.5 p-1.5 min-w-32 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="shapeAnchor.style">
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'rectangle')">
        <SquareIcon class="w-4 h-4" /> Rectangle
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'ellipse')">
        <EllipseIcon class="w-4 h-4" /> Ellipse
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'line')">
        <LineIcon class="w-4 h-4" /> Line
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'arrow')">
        <ArrowIcon class="w-4 h-4" /> Arrow
      </button>
    </div>

    <div v-if="isColorPopoverOpen" ref="colorPopoverRef"
      class="absolute z-20 grid grid-cols-5 gap-1.5 p-2 w-40 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="colorAnchor.style">
      <button v-for="color in PEN_COLORS" :key="color" type="button"
        class="w-6 h-6 rounded-full border transition-transform"
        :class="penColor === color ? 'border-rose-primary scale-110' : 'border-rose-border'"
        :style="{ backgroundColor: color }" @click="emit('update:penColor', color)" />
    </div>

    <div v-if="isBackgroundPopoverOpen" ref="backgroundPopoverRef"
      class="absolute z-20 flex flex-col gap-0.5 p-1.5 min-w-36 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="backgroundAnchor.style">
      <button v-for="bg in BACKGROUND_COLORS" :key="bg.value" type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="
          emit('update:backgroundColor', bg.value);
        closeAllPopovers();
        ">
        <span class="w-4 h-4 rounded-full border border-rose-border" :style="{ backgroundColor: bg.value }" />
        {{ bg.label }}
      </button>
    </div>
  </div>
</template>
