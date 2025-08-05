<template>
  <div
    class="w-full p-2 rounded-xl bg-rose-400 dark:bg-rose-950 flex flex-nowrap gap-1 overflow-x-auto flex-shrink-0"
    :class="{
      'flex-row items-center': ['top', 'bottom'].includes(toolbarPosition),
      'flex-col items-start': ['left', 'right'].includes(toolbarPosition),
    }"
  >
    <!-- Todo List Button -->
    <Button @click="$emit('navigateToNewList')" title="To do list info">
      <FileEdit :size="16" />
    </Button>

    <div
      class="bg-rose-100 dark:bg-rose-900 flex-shrink-0"
      :class="separatorClass"
    ></div>

    <!-- Pen color -->
    <Button @click="$emit('togglePenPopover')" title="Pen color">
      <Pen :size="16" />
    </Button>

    <!-- Brush Width -->
    <Button @click="$emit('toggleBrushWidthPopover')" title="Brush width">
      <Paintbrush :size="16" />
    </Button>

    <!-- Enable/Disable Drawing -->
    <Button
      @click="$emit('toggleEditable')"
      :title="isEditable ? 'Disable drawing' : 'Enable drawing'"
    >
      <PencilLine :size="16" />
    </Button>

    <!-- Undo / Redo -->
    <Button @click="$emit('undoCanvas')" title="Undo">
      <Undo :size="16" />
    </Button>
    <Button @click="$emit('redoCanvas')" title="Redo">
      <Redo :size="16" />
    </Button>

    <!-- Clear -->
    <Button @click="$emit('clearCanvas')" title="Clear canvas">
      <Trash2 :size="16" />
    </Button>

    <!-- Toggle Title -->
    <Button @click="$emit('toggleTitleInput')" title="Show/hide title">
      <Heading1 :size="16" />
    </Button>

    <!-- Toolbar Position -->
    <Button
      @click="$emit('toggleToolbarPositionPopover')"
      title="Toolbar position"
    >
      <Wrench :size="16" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import {
  FileEdit,
  Pen,
  Paintbrush,
  PencilLine,
  Undo,
  Redo,
  Trash2,
  Heading1,
  Wrench,
} from "lucide-vue-next";
import Button from "primevue/button";
import { computed, defineProps } from "vue";

const props = defineProps<{
  toolbarPosition: string;
  isEditable: boolean;
}>();

const separatorClass = computed(() =>
  ["top", "bottom"].includes(props.toolbarPosition)
    ? "w-[1px] h-[calc(100%-0.5rem)]"
    : "mx-2 my-1 h-[1px] w-full"
);
</script>
