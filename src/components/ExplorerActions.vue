<!-- src/components/ExplorerActions.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { FolderPlusIcon, PlusIcon, XIcon } from "@lucide/vue";

defineProps<{ fileLabel: string }>();
const emit = defineEmits<{ createFolder: []; createFile: [] }>();

const fabOpen = ref(false);

function handleFolderClick() {
  fabOpen.value = false;
  emit("createFolder");
}
function handleFileClick() {
  fabOpen.value = false;
  emit("createFile");
}
</script>

<template>
  <!-- Desktop: inline pill buttons -->
  <div class="hidden md:flex items-center gap-2">
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-surface-alt text-rose-text hover:bg-rose-border transition-colors text-sm"
      @click="handleFolderClick"
    >
      <FolderPlusIcon class="w-4 h-4" /> New folder
    </button>
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors text-sm"
      @click="handleFileClick"
    >
      <PlusIcon class="w-4 h-4" /> New {{ fileLabel }}
    </button>
  </div>

  <!-- Mobile: speed-dial FAB, fixed above bottom nav -->
  <div class="md:hidden fixed right-4 bottom-23 z-30 flex flex-col items-end gap-3">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div v-if="fabOpen" class="flex flex-col items-end gap-2">
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded-md bg-rose-surface text-rose-text text-sm shadow"
            >New {{ fileLabel }}</span
          >
          <button
            class="w-11 h-11 rounded-full bg-rose-primary text-white shadow-lg flex items-center justify-center"
            @click="handleFileClick"
          >
            <PlusIcon class="w-5 h-5" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded-md bg-rose-surface text-rose-text text-sm shadow"
            >New folder</span
          >
          <button
            class="w-11 h-11 rounded-full bg-rose-surface-alt text-rose-text shadow-lg flex items-center justify-center"
            @click="handleFolderClick"
          >
            <FolderPlusIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </Transition>

    <button
      class="w-14 h-14 rounded-full bg-rose-primary text-white shadow-xl flex items-center justify-center transition-transform"
      :class="fabOpen ? 'rotate-45' : ''"
      @click="fabOpen = !fabOpen"
    >
      <XIcon v-if="fabOpen" class="w-6 h-6" />
      <PlusIcon v-else class="w-6 h-6" />
    </button>
  </div>

  <!-- Backdrop to close FAB on outside tap -->
  <div v-if="fabOpen" class="md:hidden fixed inset-0 z-20" @click="fabOpen = false"></div>
</template>
