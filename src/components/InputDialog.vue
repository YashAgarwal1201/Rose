<!-- src/components/InputDialog.vue -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        ref="dialogRef"
        class="fixed inset-0 z-110 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
        @click.self="handleCancel"
        @keydown.escape="handleCancel"
      >
        <div
          class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-green/40"
        >
          <h3 v-if="options.title" class="text-xl font-semibold text-rose-text mb-2">
            {{ options.title }}
          </h3>
          <p v-if="options.message" class="text-base text-rose-text-muted mb-4">
            {{ options.message }}
          </p>
          
          <input
            ref="inputRef"
            v-model="inputValue"
            type="text"
            :placeholder="options.placeholder || ''"
            class="w-full px-3 py-2 bg-rose-bg border border-rose-border rounded-md text-rose-text focus:outline-none focus:border-rose-primary mb-6"
            @keyup.enter="handleConfirm"
            @keyup.escape="handleCancel"
          />

          <div class="flex justify-end gap-2">
            <button
              class="px-4 py-2 text-base rounded-md text-rose-text hover:bg-rose-surface-alt transition-colors"
              @click="handleCancel"
            >
              {{ options.cancelLabel || "Cancel" }}
            </button>

            <button
              class="px-4 py-2 text-base rounded-md bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors"
              @click="handleConfirm"
            >
              {{ options.confirmLabel || "Confirm" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useInput } from "../composables/useInput";
import { useBackButtonClose } from "../composables/useBackButtonClose";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";

const { isOpen, options, inputValue, handleConfirm, handleCancel } = useInput();
const inputRef = ref<HTMLInputElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);

const { activate, deactivate } = useFocusTrap(dialogRef, { escapeDeactivates: false });
watch(dialogRef, (el) => el ? nextTick().then(() => activate()) : deactivate());

useBackButtonClose(isOpen, "input", handleCancel);

// Auto-focus the input field when dialog opens
watch(isOpen, async (open) => {
  if (open) {
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  }
});
</script>
