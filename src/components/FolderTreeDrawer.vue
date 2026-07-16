<!-- src/components/FolderTreeDrawer.vue -->
<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      @click="close"
      aria-hidden="true"
    ></div>
  </Transition>

  <Transition
    enter-active-class="transition-transform duration-300 ease-in-out"
    enter-from-class="-translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300 ease-in-out"
    leave-from-class="translate-x-0"
    leave-to-class="-translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed top-0 left-0 h-full z-50 w-full max-w-xs bg-rose-surface shadow-2xl flex flex-col"
    >
      <div class="flex items-center justify-between px-4 py-4 shrink-0 border-b border-rose-border">
        <h3 class="text-lg font-semibold text-rose-text">Folders</h3>
        <button
          class="p-2 hover:bg-rose-surface-alt rounded-full transition-colors"
          @click="close"
          aria-label="Close"
        >
          <XIcon class="w-5 h-5 text-rose-text" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { XIcon } from "@lucide/vue";

defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: [] }>();
function close() {
  emit("close");
}
</script>
