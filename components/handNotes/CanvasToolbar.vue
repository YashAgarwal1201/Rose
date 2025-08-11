<!-- components/CanvasToolbar.vue -->
<template>
  <div
    class="w-full p-2 rounded-xl bg-rose-400 dark:bg-rose-950 flex flex-nowrap gap-1 overflow-x-auto flex-shrink-0"
    :class="{
      'flex-row items-center': ['top', 'bottom'].includes(toolbarPosition),
      'flex-col items-start': ['left', 'right'].includes(toolbarPosition),
    }"
  >
    <!-- To Do List Button -->
    <Button
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
      title="To do list info"
      @click="$emit('navigateToNewList')"
    >
      <FileEdit :size="16" />
    </Button>

    <div
      class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
      :class="separatorClass"
    ></div>

    <!-- Pen Color Button -->
    <Button
      type="button"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
      title="Pen color"
      @click="$emit('togglePenPopover')"
    >
      <Pen :size="16" />
    </Button>

    <!-- Brush Width Button -->
    <Button
      type="button"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
      title="Brush width"
      @click="$emit('toggleBrushWidthPopover')"
    >
      <Paintbrush :size="16" />
    </Button>

    <!-- Toggle Drawing Edit Mode -->
    <Button
      type="button"
      @click="$emit('toggleEditable')"
      :title="isEditable ? 'Disable drawing' : 'Enable drawing'"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl px-2 py-2 flex items-center gap-x-2 !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
    >
      <PencilLine :size="16" />
    </Button>

    <div
      class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
      :class="separatorClass"
    ></div>

    <!-- Undo Button -->
    <Button
      :disabled="!canUndo"
      :class="{ '!opacity-50 !cursor-not-allowed': !canUndo }"
      @click="$emit('undoCanvas')"
      title="Undo"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
    >
      <Undo :size="16" />
    </Button>

    <!-- Redo Button -->
    <Button
      :disabled="!canRedo"
      :class="{ '!opacity-50 !cursor-not-allowed': !canRedo }"
      @click="$emit('redoCanvas')"
      title="Redo"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
    >
      <Redo :size="16" />
    </Button>

    <div
      class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
      :class="separatorClass"
    ></div>

    <!-- Clear Canvas Button -->
    <Button
      @click="$emit('clearCanvas')"
      title="Clear Canvas"
      type="button"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl px-3 py-2 flex items-center gap-x-2 !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
    >
      <Trash :size="16" />
    </Button>

    <div
      class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
      :class="separatorClass"
    ></div>

    <!-- Save Note Button -->
    <Button
      @click="$emit('saveNote')"
      title="Save Note"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl px-4 py-2 flex items-center gap-x-2 !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
    >
      <Check :size="16" />
    </Button>

    <div
      class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
      :class="separatorClass"
    ></div>

    <!-- Export Canvas Button -->
    <Button
      @click="$emit('exportCanvas')"
      title="Export Canvas"
      type="button"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
    >
      <Download :size="20" />
    </Button>

    <div
      class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
      :class="separatorClass"
    ></div>

    <!-- Toolbar Position Button -->
    <Button
      @click="$emit('toolbarPositionChangePopover')"
      title="Change Toolbar Position"
      type="button"
      class="!flex-shrink-0 h-8 md:h-9 2xl:h-10 !rounded-xl px-4 py-2 flex items-center gap-x-2 !bg-transparent !border-transparent !text-slate-900 dark:!text-slate-100 hover:!bg-rose-100 dark:hover:!bg-slate-700"
    >
      <Wrench :size="16" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import Button from "primevue/button";
import {
  FileEdit,
  Pen,
  Paintbrush,
  PencilLine,
  Undo,
  Redo,
  Trash,
  Check,
  Download,
  Wrench,
} from "lucide-vue-next";

// Props definition
const props = defineProps({
  toolbarPosition: {
    type: String,
    required: true,
  },
  isEditable: {
    type: Boolean,
    required: true,
  },
  canUndo: {
    type: Boolean,
    required: true,
  },
  canRedo: {
    type: Boolean,
    required: true,
  },
});

// Compute separator class based on toolbar position
const separatorClass = computed(() =>
  ["top", "bottom"].includes(props.toolbarPosition)
    ? "w-[1px] h-[calc(100%-0.5rem)]"
    : "mx-2 my-1 h-[1px] w-full"
);
</script>

<style scoped>
/* You can add styling for scrollbar or button spacing if needed */
</style>
