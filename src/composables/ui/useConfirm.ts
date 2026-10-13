// Src/composables/useConfirm.ts
import { type Component, ref } from "vue";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: Component;
  cancelIcon?: Component;
}

const isOpen = ref(false);
const options = ref<ConfirmOptions>({ message: "" });
let resolvePromise: ((value: boolean) => void) | null = null;

function confirm(opts: ConfirmOptions | string): Promise<boolean> {
  options.value = typeof opts === "string" ? { message: opts } : opts;
  isOpen.value = true;
  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
}

function handleConfirm() {
  isOpen.value = false;
  resolvePromise?.(true);
  resolvePromise = null;
}

function handleCancel() {
  isOpen.value = false;
  resolvePromise?.(false);
  resolvePromise = null;
}

export function useConfirm() {
  return { confirm, handleCancel, handleConfirm, isOpen, options };
}
