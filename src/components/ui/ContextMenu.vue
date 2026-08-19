<!-- src/components/ui/ContextMenu.vue -->
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';

const { isOpen, x, y } = defineProps<{
  isOpen: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  close: [];
}>();

const menuRef = ref<HTMLElement | null>(null);
const style = ref({ top: '-9999px', left: '-9999px', opacity: '0' });

onClickOutside(menuRef, () => {
  if (isOpen) {
    emit('close');
  }
});

watch(() => isOpen, async (isMenuOpen) => {
  if (isMenuOpen) {
    // Initial invisible render to measure width/height
    style.value = { top: '-9999px', left: '-9999px', opacity: '0' };
    await nextTick();
    if (!menuRef.value) { return; }

    const rect = menuRef.value.getBoundingClientRect();
    let left = x;
    let top = y;

    // Flip if overflowing right edge
    if (left + rect.width > window.innerWidth) {
      left -= rect.width;
    }
    // Flip if overflowing bottom edge
    if (top + rect.height > window.innerHeight) {
      top -= rect.height;
    }

    // Keep within bounds
    left = Math.max(8, Math.min(left, window.innerWidth - rect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - rect.height - 8));

    style.value = {
      top: `${top}px`,
      left: `${left}px`,
      opacity: '1'
    };
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
      <div v-if="isOpen" ref="menuRef"
        class="fixed z-300 min-w-40 bg-rose-surface border border-rose-border rounded-lg shadow-xl py-1 flex flex-col"
        :style="style">
        <slot></slot>
      </div>
    </Transition>
  </Teleport>
</template>
