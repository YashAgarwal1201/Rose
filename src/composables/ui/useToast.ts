// src/composables/useToast.ts
import { ref } from "vue";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const toasts = ref<Toast[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();
let nextId = 0;

function showToast(message: string, type: ToastType = "info", duration = 3000) {
  const id = nextId++;
  toasts.value.push({ id, message, type });
  const timer = setTimeout(() => dismissToast(id), duration);
  timers.set(id, timer);
}

function dismissToast(id: number) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

export function useToast() {
  return { dismissToast, showToast, toasts };
}
