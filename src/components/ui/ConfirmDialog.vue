<!-- src/components/ConfirmDialog.vue -->
<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="isOpen" ref="dialogRef"
        class="fixed inset-0 z-110 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
        @click.self="handleCancel" @keydown.escape="handleCancel">
        <div class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-green/40">
          <h3 v-if="options.title" class="text-xl font-semibold text-rose-text mb-2">
            {{ options.title }}
          </h3>
          <p class="text-base text-rose-text-muted mb-6">{{ options.message }}</p>
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 text-base rounded-md text-rose-text hover:bg-rose-surface-alt transition-colors"
              @click="handleCancel">
              {{ options.cancelLabel || "Cancel" }}
            </button>

            <button
              class="px-4 py-2 text-base rounded-md bg-rose-primary text-white hover:bg-rose-primary-hover transition-colors"
              @click="handleConfirm">
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
import { useConfirm } from "@/composables/ui/useConfirm.ts";
import { useBackButtonClose } from "@/composables/ui/useBackButtonClose.ts";
import { useFocusTrap } from "@vueuse/integrations/useFocusTrap";

const dialogRef = ref<HTMLElement | null>(null);
const { activate, deactivate } = useFocusTrap(dialogRef, { escapeDeactivates: false });
watch(dialogRef, (el) => el ? nextTick().then(() => activate()) : deactivate());

const { isOpen, options, handleConfirm, handleCancel } = useConfirm();

useBackButtonClose(isOpen, "confirm", handleCancel);
</script>
