<!-- src/components/explorer/ExplorerDnDNode.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useDraggable, useDroppable } from '@dnd-kit/vue';

const props = defineProps<{
  id: string;
  data: Record<string, any>;
  isDraggable?: boolean;
  isDroppable?: boolean;
  dropTargetClass?: string;
  draggingClass?: string;
  as?: string;
}>();

const el = ref<HTMLElement | null>(null);

const { isDragging } = useDraggable({
  id: () => props.id,
  data: () => props.data,
  element: el,
  disabled: () => !props.isDraggable,
});

const { isDropTarget } = useDroppable({
  id: () => props.id,
  data: () => props.data,
  element: el,
  disabled: () => !props.isDroppable,
});
</script>

<template>
  <component :is="as || 'div'" ref="el" :class="[
    isDropTarget && dropTargetClass ? dropTargetClass : '',
    isDragging && draggingClass ? draggingClass : ''
  ]">
    <slot :is-dragging="isDragging" :is-drop-target="isDropTarget" />
  </component>
</template>
