<!-- src/components/MenuOverlay.vue -->
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
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300 ease-in-out"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed top-0 right-0 h-full z-50 w-full max-w-3xl bg-rose-surface shadow-2xl flex flex-col"
    >
      <div class="flex items-center justify-between px-6 py-5 shrink-0">
        <h3 class="text-xl font-semibold text-rose-text">Menu</h3>
        <button
          class="p-2 hover:bg-rose-surface-alt rounded-full transition-colors"
          @click="close"
          aria-label="Close menu"
        >
          <XIcon class="w-5 h-5 text-rose-text" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <nav class="flex flex-col rounded-xl bg-rose-surface-alt p-4 border border-rose-border">
          <div class="px-2 py-4 flex items-center gap-x-3 text-lg text-rose-text">
            <PaletteIcon class="w-4 h-4 text-rose-text-muted shrink-0" />
            <span>Theme</span>
            <select
              v-model="selectedMode"
              class="ml-auto text-base bg-rose-surface border border-rose-border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rose-primary cursor-pointer"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </nav>
      </div>

      <div class="px-6 py-4 shrink-0">
        <p class="text-xs text-rose-text-muted font-mono">Rose — dev build</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { PaletteIcon, XIcon } from "@lucide/vue";
import { useThemeStore } from "../stores/theme";

defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: [] }>();

const themeStore = useThemeStore();

const selectedMode = computed({
  get: () => themeStore.mode,
  set: (value: "light" | "dark" | "system") => themeStore.setMode(value),
});

function close() {
  emit("close");
}
</script>
