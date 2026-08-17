<script setup lang="ts">
import { computed, ref } from "vue";
import { onKeyStroke } from "@vueuse/core";
import {
  MoveUpRight as ArrowIcon,
  Cloud as CloudIcon,
  Database as CylinderIcon,
  Diamond as DiamondIcon,
  ArrowLeftRight as DoubleArrowIcon,
  DownloadIcon,
  Circle as EllipseIcon,
  EraserIcon,
  Hexagon as HexagonIcon,
  Highlighter as HighlighterIcon,
  ImageIcon,
  Minus as LineIcon,
  MousePointer2Icon,
  PaletteIcon,
  RectangleHorizontal as ParallelogramIcon,
  Pencil as PencilIcon,
  PenLine as PenIcon,
  Redo2Icon,
  SquareIcon,
  Star as StarIcon,
  Triangle as TriangleIcon,
  TypeIcon,
  Undo2Icon,
} from "@lucide/vue";
import type { ToolbarPosition } from "@/composables/ui/useToolbarPosition";
import { type PopoverPlacement, usePopoverPosition } from "@/composables/ui/usePopoverPosition.ts";
import type { CanvasTool, PenTool, ShapeTool } from "@/composables/notes/useHandwritingCanvas";
import ColorPickerGrid from "@/components/ui/ColorPickerGrid.vue";

const {
  tool,
  penTool,
  penColor,
  backgroundColor,
  canUndo,
  canRedo,
  position,
} = defineProps<{
  tool: CanvasTool;
  penTool: PenTool;
  shapeTool: ShapeTool;
  penColor: string;
  backgroundColor: string;
  backgroundPattern: import('@/db/types').BackgroundPattern;
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
  "update:backgroundPattern": [import('@/db/types').BackgroundPattern];
  addShape: [ShapeTool];
  undo: [];
  redo: [];
  triggerImagePick: [];
  exportAsPng: [];
  exportAsJpeg: [];
  exportAsSvg: [];
}>();

const rootRef = ref<HTMLElement | null>(null);

const pencilTriggerRef = ref<HTMLButtonElement | null>(null);
const penTriggerRef = ref<HTMLButtonElement | null>(null);
const markerTriggerRef = ref<HTMLButtonElement | null>(null);
const shapeTriggerRef = ref<HTMLButtonElement | null>(null);
const backgroundTriggerRef = ref<HTMLButtonElement | null>(null);
const exportTriggerRef = ref<HTMLButtonElement | null>(null);

const pencilPopoverRef = ref<HTMLElement | null>(null);
const penPopoverRef = ref<HTMLElement | null>(null);
const markerPopoverRef = ref<HTMLElement | null>(null);
const shapePopoverRef = ref<HTMLElement | null>(null);
const backgroundPopoverRef = ref<HTMLElement | null>(null);
const exportPopoverRef = ref<HTMLElement | null>(null);

const isPencilPopoverOpen = ref(false);
const isPenPopoverOpen = ref(false);
const isMarkerPopoverOpen = ref(false);
const isShapePopoverOpen = ref(false);
const isBackgroundPopoverOpen = ref(false);
const isExportMenuOpen = ref(false);

const startPlacement = computed<PopoverPlacement>(() => {
  if (position === "left") { return "right-start"; }
  if (position === "right") { return "left-start"; }
  if (position === "bottom") { return "top-start"; }
  return "bottom-start";
});

const pencilAnchor = usePopoverPosition(rootRef, pencilTriggerRef, pencilPopoverRef, startPlacement);
const penAnchor = usePopoverPosition(rootRef, penTriggerRef, penPopoverRef, startPlacement);
const markerAnchor = usePopoverPosition(rootRef, markerTriggerRef, markerPopoverRef, startPlacement);
const shapeAnchor = usePopoverPosition(rootRef, shapeTriggerRef, shapePopoverRef, startPlacement);
const backgroundAnchor = usePopoverPosition(
  rootRef,
  backgroundTriggerRef,
  backgroundPopoverRef,
  startPlacement,
);
const exportAnchor = usePopoverPosition(
  rootRef,
  exportTriggerRef,
  exportPopoverRef,
  startPlacement,
);

function closeAllPopovers() {
  isPencilPopoverOpen.value = false;
  isPenPopoverOpen.value = false;
  isMarkerPopoverOpen.value = false;
  isShapePopoverOpen.value = false;
  isBackgroundPopoverOpen.value = false;
  isExportMenuOpen.value = false;

  pencilAnchor.close();
  penAnchor.close();
  markerAnchor.close();
  shapeAnchor.close();
  backgroundAnchor.close();
  exportAnchor.close();
}

onKeyStroke("Escape", (e) => {
  if (isAnyPopoverOpen.value) {
    e.preventDefault();
    closeAllPopovers();
  }
});

function selectTool(next: CanvasTool) {
  emit("update:tool", next);
  if (next !== "pen") { closeAllPopovers(); }
}

function handlePenToolClick(type: PenTool) {
  // If already active, toggle its popover
  if (tool === 'pen' && penTool === type) {
    const wasOpen = (() => {
      if (type === 'pencil') { return isPencilPopoverOpen.value; }
      if (type === 'pen') { return isPenPopoverOpen.value; }
      if (type === 'marker') { return isMarkerPopoverOpen.value; }
    })();

    closeAllPopovers();
    if (!wasOpen) {
      if (type === 'pencil') {
        isPencilPopoverOpen.value = true;
        pencilAnchor.open();
      } else if (type === 'pen') {
        isPenPopoverOpen.value = true;
        penAnchor.open();
      } else if (type === 'marker') {
        isMarkerPopoverOpen.value = true;
        markerAnchor.open();
      }
    }
  } else {
    // Just select it
    closeAllPopovers();
    selectTool('pen');
    emit('update:penTool', type);
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

function toggleBackgroundPopover() {
  const next = !isBackgroundPopoverOpen.value;
  closeAllPopovers();
  if (next) {
    isBackgroundPopoverOpen.value = true;
    backgroundAnchor.open();
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

const activeBtn = "bg-rose-surface-alt text-rose-green";
const idleBtn = "text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text";

const isAnyPopoverOpen = computed(
  () =>
    isPencilPopoverOpen.value ||
    isPenPopoverOpen.value ||
    isMarkerPopoverOpen.value ||
    isShapePopoverOpen.value ||
    isBackgroundPopoverOpen.value ||
    isExportMenuOpen.value,
);

const isVertical = computed(() => position === "left" || position === "right");

const rootClasses = computed(() => {
  const base = "bg-rose-surface border-rose-border z-20 relative flex";
  if (position === "left") {
    return `${base} border-r w-12 flex-col shrink-0`;
  }
  if (position === "right") {
    return `${base} border-l w-12 flex-col shrink-0`;
  }
  if (position === "bottom") {
    return `${base} border-t absolute bottom-0 left-0 right-0 w-full`;
  }
  return `${base} border-b w-full shrink-0`; // top
});

const scrollClasses = computed(() => {
  if (position === "left" || position === "right") {
    return "flex-1 flex flex-col items-center gap-1 p-1.5 overflow-y-auto overflow-x-hidden w-full";
  }
  return "flex-1 flex flex-row items-center gap-1 p-1.5 overflow-x-auto overflow-y-hidden w-full";
});

const dividerClass = computed(() =>
  isVertical.value
    ? "h-px w-6 bg-rose-cream/10 my-0.5 shrink-0"
    : "w-px h-5 bg-rose-cream/10 mx-0.5 shrink-0",
);

defineExpose({ toggleExportMenu });
</script>

<template>
  <div ref="rootRef" :class="rootClasses">
    <!-- Backdrop -->
    <div v-if="isAnyPopoverOpen" class="fixed inset-0 z-10" aria-hidden="true" tabindex="-1" @click="closeAllPopovers">
    </div>

    <div :class="scrollClasses" style="scrollbar-width: none">
      <button type="button" class="p-2 rounded-md transition-colors" :class="tool === 'select' ? activeBtn : idleBtn"
        title="Select" aria-label="Select" @click="selectTool('select')">
        <MousePointer2Icon class="w-4.5 h-4.5" />
      </button>

      <button ref="pencilTriggerRef" type="button" class="p-2 rounded-md transition-colors"
        :class="tool === 'pen' && penTool === 'pencil' ? activeBtn : idleBtn" title="Pencil" aria-label="Pencil"
        @click="handlePenToolClick('pencil')">
        <PencilIcon class="w-4.5 h-4.5" />
      </button>

      <button ref="penTriggerRef" type="button" class="p-2 rounded-md transition-colors"
        :class="tool === 'pen' && penTool === 'pen' ? activeBtn : idleBtn" title="Pen" aria-label="Pen"
        @click="handlePenToolClick('pen')">
        <PenIcon class="w-4.5 h-4.5" />
      </button>

      <button ref="markerTriggerRef" type="button" class="p-2 rounded-md transition-colors"
        :class="tool === 'pen' && penTool === 'marker' ? activeBtn : idleBtn" title="Marker" aria-label="Marker"
        @click="handlePenToolClick('marker')">
        <HighlighterIcon class="w-4.5 h-4.5" />
      </button>

      <button type="button" class="p-2 rounded-md transition-colors" :class="tool === 'eraser' ? activeBtn : idleBtn"
        title="Eraser" aria-label="Eraser" @click="selectTool('eraser')">
        <EraserIcon class="w-4.5 h-4.5" />
      </button>

      <button ref="shapeTriggerRef" type="button" class="p-2 rounded-md transition-colors"
        :class="tool === 'shape' ? activeBtn : idleBtn" title="Shapes" aria-label="Shapes" @click="toggleShapePopover">
        <SquareIcon class="w-4.5 h-4.5" />
      </button>

      <button type="button" class="p-2 rounded-md transition-colors" :class="tool === 'text' ? activeBtn : idleBtn"
        title="Text box" aria-label="Text box" @click="selectTool('text')">
        <TypeIcon class="w-4.5 h-4.5" />
      </button>

      <button type="button" class="p-2 rounded-md transition-colors" :class="idleBtn" title="Insert image" aria-label="Insert image"
        @click="emit('triggerImagePick')">
        <ImageIcon class="w-4.5 h-4.5" />
      </button>

      <button ref="backgroundTriggerRef" type="button" class="p-2 rounded-md transition-colors"
        :class="isBackgroundPopoverOpen ? activeBtn : idleBtn" title="Page background" aria-label="Page background" @click="toggleBackgroundPopover">
        <PaletteIcon class="w-4.5 h-4.5" />
      </button>

      <div :class="dividerClass"></div>

      <button type="button" class="p-2 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
        :class="idleBtn" :disabled="!canUndo" title="Undo" aria-label="Undo" @click="emit('undo')">
        <Undo2Icon class="w-4.5 h-4.5" />
      </button>
      <button type="button" class="p-2 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
        :class="idleBtn" :disabled="!canRedo" title="Redo" aria-label="Redo" @click="emit('redo')">
        <Redo2Icon class="w-4.5 h-4.5" />
      </button>

      <div :class="dividerClass"></div>

      <button ref="exportTriggerRef" type="button" class="p-2 rounded-md transition-colors"
        :class="isExportMenuOpen ? activeBtn : idleBtn" title="Export" aria-label="Export" @click="toggleExportMenu">
        <DownloadIcon class="w-4.5 h-4.5" />
      </button>
    </div>

    <!-- Pencil Popover -->
    <div v-if="isPencilPopoverOpen" ref="pencilPopoverRef" class="absolute z-20" :style="pencilAnchor.style">
      <ColorPickerGrid :model-value="penColor" default-color="#1a1a1a"
        @update:model-value="emit('update:penColor', $event)" @close="closeAllPopovers" />
    </div>

    <!-- Pen Popover -->
    <div v-if="isPenPopoverOpen" ref="penPopoverRef" class="absolute z-20" :style="penAnchor.style">
      <ColorPickerGrid :model-value="penColor" default-color="#1a1a1a"
        @update:model-value="emit('update:penColor', $event)" @close="closeAllPopovers" />
    </div>

    <!-- Marker Popover -->
    <div v-if="isMarkerPopoverOpen" ref="markerPopoverRef" class="absolute z-20" :style="markerAnchor.style">
      <ColorPickerGrid :model-value="penColor" default-color="#1a1a1a"
        @update:model-value="emit('update:penColor', $event)" @close="closeAllPopovers" />
    </div>

    <!-- Shapes Popover -->
    <div v-if="isShapePopoverOpen" ref="shapePopoverRef"
      class="absolute z-20 flex flex-col gap-0.5 p-1.5 min-w-32 rounded-lg bg-rose-surface border border-rose-border shadow-lg"
      :style="shapeAnchor.style">
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'rectangle'); emit('addShape', 'rectangle'); closeAllPopovers();">
        <SquareIcon class="w-4 h-4" /> Rectangle
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'ellipse'); emit('addShape', 'ellipse'); closeAllPopovers();">
        <EllipseIcon class="w-4 h-4" /> Ellipse
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'line'); emit('addShape', 'line'); closeAllPopovers();">
        <LineIcon class="w-4 h-4" /> Line
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'arrow'); emit('addShape', 'arrow'); closeAllPopovers();">
        <ArrowIcon class="w-4 h-4" /> Arrow
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'triangle'); emit('addShape', 'triangle'); closeAllPopovers();">
        <TriangleIcon class="w-4 h-4" /> Triangle
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'diamond'); emit('addShape', 'diamond'); closeAllPopovers();">
        <DiamondIcon class="w-4 h-4" /> Diamond
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'star'); emit('addShape', 'star'); closeAllPopovers();">
        <StarIcon class="w-4 h-4" /> Star
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'hexagon'); emit('addShape', 'hexagon'); closeAllPopovers();">
        <HexagonIcon class="w-4 h-4" /> Hexagon
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'cloud'); emit('addShape', 'cloud'); closeAllPopovers();">
        <CloudIcon class="w-4 h-4" /> Cloud
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'cylinder'); emit('addShape', 'cylinder'); closeAllPopovers();">
        <CylinderIcon class="w-4 h-4" /> Cylinder
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'parallelogram'); emit('addShape', 'parallelogram'); closeAllPopovers();">
        <ParallelogramIcon class="w-4 h-4" /> Parallelogram
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'rhombus'); emit('addShape', 'rhombus'); closeAllPopovers();">
        <DiamondIcon class="w-4 h-4" /> Rhombus
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'square'); emit('addShape', 'square'); closeAllPopovers();">
        <SquareIcon class="w-4 h-4" /> Square
      </button>
      <button type="button"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('update:shapeTool', 'double-arrow'); emit('addShape', 'double-arrow'); closeAllPopovers();">
        <DoubleArrowIcon class="w-4 h-4" /> Double Arrow
      </button>
    </div>

    <!-- Background Popover -->
    <div v-if="isBackgroundPopoverOpen" ref="backgroundPopoverRef" class="absolute z-20 flex flex-col gap-3 p-3 bg-rose-surface rounded-lg border border-rose-border shadow-lg"
      :style="backgroundAnchor.style">
      
      <div>
        <div class="text-xs font-semibold text-rose-text-muted mb-2 px-1">Pattern</div>
        <div class="flex items-center gap-1">
          <button v-for="pat in ['solid', 'dots', 'grid', 'ruled'] as const" :key="pat" type="button"
            class="px-3 py-1.5 rounded-md text-sm capitalize transition-colors"
            :class="backgroundPattern === pat ? 'bg-rose-surface-alt text-rose-text font-medium' : 'text-rose-text-muted hover:bg-rose-surface-alt hover:text-rose-text'"
            @click="emit('update:backgroundPattern', pat)">
            {{ pat }}
          </button>
        </div>
      </div>

      <div class="h-px bg-rose-border w-full"></div>

      <div>
        <div class="text-xs font-semibold text-rose-text-muted mb-2 px-1">Color</div>
        <ColorPickerGrid :model-value="backgroundColor" default-color="#ffffff"
          @update:model-value="emit('update:backgroundColor', $event)" @close="closeAllPopovers" />
      </div>
    </div>

    <!-- Export Popover -->
    <div v-if="isExportMenuOpen" ref="exportPopoverRef"
      class="absolute z-20 flex flex-col w-44 rounded-lg bg-rose-surface border border-rose-border shadow-lg overflow-hidden"
      :style="exportAnchor.style">
      <button class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('exportAsPng'); closeAllPopovers();">
        Export as PNG
      </button>
      <button class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('exportAsJpeg'); closeAllPopovers();">
        Export as JPEG
      </button>
      <div class="h-px bg-rose-border"></div>
      <button class="px-3 py-2 text-left text-sm text-rose-text hover:bg-rose-surface-alt"
        @click="emit('exportAsSvg'); closeAllPopovers();">
        Export as SVG
      </button>
    </div>
  </div>
</template>
