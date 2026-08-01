// src/composables/useInput.ts
import { ref } from "vue";

interface InputOptions {
  title?: string;
  message: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const isOpen = ref(false);
const options = ref<InputOptions>({ message: "" });
const inputValue = ref("");
let resolvePromise: ((value: string | null) => void) | null = null;

function requestInput(opts: InputOptions | string): Promise<string | null> {
  options.value = typeof opts === "string" ? { message: opts } : opts;
  inputValue.value = options.value.initialValue || "";
  isOpen.value = true;
  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
}

function handleConfirm() {
  isOpen.value = false;
  resolvePromise?.(inputValue.value);
  resolvePromise = null;
}

function handleCancel() {
  isOpen.value = false;
  resolvePromise?.(null);
  resolvePromise = null;
}

export function useInput() {
  return { requestInput, handleCancel, handleConfirm, isOpen, options, inputValue };
}
