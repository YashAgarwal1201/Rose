<!-- src/components/ConfirmDialog.vue -->
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
        class="fixed inset-0 z-110 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
        @click.self="handleCancel"
      >
        <div
          class="bg-rose-surface rounded-xl shadow-2xl w-full max-w-sm p-6 border border-rose-border"
        >
          <h3 v-if="options.title" class="text-xl font-semibold text-rose-text mb-2">
            {{ options.title }}
          </h3>
          <p class="text-base text-rose-text-muted mb-6">{{ options.message }}</p>
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
import { useConfirm } from "../composables/useConfirm";

const { isOpen, options, handleConfirm, handleCancel } = useConfirm();
</script>
