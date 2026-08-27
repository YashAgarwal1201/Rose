<!-- src/components/ui/NameCollisionDialog.vue -->
<script setup lang="ts">
import { ref, watch } from "vue";
import { AlertTriangleIcon, XIcon } from "@lucide/vue";

const props = defineProps<{
  isOpen: boolean;
  itemName: string;
  targetFolderName: string;
  suggestedName: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", newName: string): void;
}>();

const newNameInput = ref("");

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      newNameInput.value = props.suggestedName || props.itemName;
    }
  },
  { immediate: true },
);

function handleConfirm() {
  const trimmed = newNameInput.value.trim();
  if (trimmed) {
    emit("confirm", trimmed);
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      @click.self="emit('close')"
      @keydown.escape="emit('close')"
    >
      <div
        class="bg-rose-surface border border-rose-border rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Name collision warning"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-rose-border shrink-0">
          <div class="flex items-center gap-2.5 text-amber-500">
            <AlertTriangleIcon class="w-5 h-5 shrink-0" />
            <h2 class="text-lg font-bold text-rose-text truncate">Item Already Exists</h2>
          </div>
          <button
            type="button"
            class="p-1 rounded-md text-rose-text-muted hover:text-rose-text hover:bg-rose-surface-alt transition-colors"
            aria-label="Close dialog"
            @click="emit('close')"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-3">
          <p class="text-sm text-rose-text">
            An item named <span class="font-semibold text-rose-text">"{{ itemName }}"</span> already exists in
            <span class="font-semibold text-rose-text">{{ targetFolderName }}</span>.
          </p>
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-rose-text-muted" for="new-item-name-input">
              Enter a new name for the moved item:
            </label>
            <input
              id="new-item-name-input"
              v-model="newNameInput"
              type="text"
              class="w-full px-3 py-2 rounded-lg bg-rose-surface-alt border border-rose-border text-sm text-rose-text focus:outline-none focus:ring-2 focus:ring-rose-primary"
              @keyup.enter="handleConfirm"
            />
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 px-5 py-4 border-t border-rose-border shrink-0">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-rose-text-muted hover:text-rose-text rounded-lg hover:bg-rose-surface-alt transition-colors"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white bg-rose-primary hover:bg-rose-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-50"
            :disabled="!newNameInput.trim()"
            @click="handleConfirm"
          >
            Move & Rename
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
