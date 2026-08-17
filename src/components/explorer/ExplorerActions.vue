<!-- src/components/ExplorerActions.vue -->
<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { FolderPlusIcon, PlusIcon, XIcon } from "@lucide/vue";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";

defineProps<{ fileLabel: string }>();
const emit = defineEmits<{ createFolder: []; createFile: [] }>();

const fabOpen = ref(false);
const fabContainerRef = ref<HTMLElement | null>(null);

const { activate, deactivate } = useFocusTrap(fabContainerRef, { escapeDeactivates: false });
watch(fabOpen, (isOpen) => {
  if (isOpen) {
    nextTick().then(() => activate());
  } else {
    deactivate();
  }
});

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
      <FolderPlusIcon class="w-4 h-4 text-rose-green" /> New folder
    </button>
    <button
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors text-sm"
      @click="handleFileClick"
    >
      <PlusIcon class="w-4 h-4 text-rose-cream" /> New {{ fileLabel }}
    </button>
  </div>

  <!-- Mobile: speed-dial FAB, fixed above bottom nav -->
  <div ref="fabContainerRef" class="md:hidden fixed right-4 bottom-23 z-30 flex flex-col items-end gap-3" @keydown.escape="fabOpen = false">
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
            type="button"
            class="w-11 h-11 rounded-full bg-rose-primary text-white shadow-lg flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary-hover"
            :aria-label="'New ' + fileLabel"
            @click="handleFileClick"
          >
            <PlusIcon class="w-5 h-5 text-rose-cream" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded-md bg-rose-surface text-rose-text text-sm shadow"
            >New folder</span
          >
          <button
            type="button"
            class="w-11 h-11 rounded-full bg-rose-surface-alt text-rose-text shadow-lg flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
            aria-label="New folder"
            @click="handleFolderClick"
          >
            <FolderPlusIcon class="w-5 h-5 text-rose-green" />
          </button>
        </div>
      </div>
    </Transition>

    <button
      type="button"
      class="w-14 h-14 rounded-full bg-rose-primary text-white shadow-xl flex items-center justify-center transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-primary-hover"
      :class="fabOpen ? 'rotate-45' : ''"
      :aria-label="fabOpen ? 'Close action menu' : 'Open action menu'"
      :aria-expanded="fabOpen"
      @click="fabOpen = !fabOpen"
    >
      <XIcon v-if="fabOpen" class="w-6 h-6 text-rose-cream" />
      <PlusIcon v-else class="w-6 h-6 text-rose-cream" />
    </button>
  </div>

  <!-- Backdrop to close FAB on outside tap -->
  <div v-if="fabOpen" class="md:hidden fixed inset-0 z-20" aria-hidden="true" tabindex="-1" @click="fabOpen = false"></div>
</template>
