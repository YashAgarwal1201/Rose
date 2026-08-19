<script setup lang="ts">
import { ref } from "vue";
import { CheckIcon, PlusIcon } from "@lucide/vue";

const props = defineProps<{
  modelValue: string;
  defaultColor: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [string];
  "close": [];
}>();

const COLORS = [
  "#ffffff", // White
  "#f1f5f9", // Slate 100
  "#cbd5e1", // Slate 300
  "#64748b", // Slate 500
  "#1a1a1a", // Almost Black
  
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
];

const customColorInput = ref<HTMLInputElement | null>(null);

function selectColor(color: string) {
  emit("update:modelValue", color);
  emit("close");
}

function handleCustomColorChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.value) {
    selectColor(target.value);
  }
}
</script>

<template>
  <div class="flex flex-col gap-2 p-2 w-48 bg-rose-surface rounded-lg border border-rose-border shadow-lg">
    <div class="grid grid-cols-5 gap-1.5">
      <button
        v-for="color in COLORS"
        :key="color"
        type="button"
        class="relative w-7 h-7 rounded-full border shadow-sm transition-transform hover:scale-110 flex items-center justify-center"
        :class="[
          (modelValue || '').toLowerCase() === color.toLowerCase() ? 'border-rose-primary ring-2 ring-rose-primary/30' : 'border-rose-border',
        ]"
        :style="{ backgroundColor: color }"
        @click="selectColor(color)"
      >
        <CheckIcon v-if="(modelValue || '').toLowerCase() === color.toLowerCase()" class="w-4 h-4 text-white drop-shadow-md" :class="color === '#ffffff' ? 'text-black' : ''" />
      </button>

      <!-- Custom Color Picker -->
      <button
        type="button"
        class="relative w-7 h-7 rounded-full border border-rose-border bg-rose-surface-alt hover:bg-rose-cream transition-colors flex items-center justify-center"
        title="Custom color"
        @click="customColorInput?.click()"
      >
        <PlusIcon class="w-4 h-4 text-rose-text" />
        <input
          ref="customColorInput"
          type="color"
          class="absolute opacity-0 w-0 h-0"
          :value="modelValue"
          @input="handleCustomColorChange"
        />
      </button>
    </div>

    <div class="h-px bg-rose-border my-1"></div>

    <button
      type="button"
      class="px-2 py-1.5 text-sm text-center text-rose-text hover:bg-rose-surface-alt rounded transition-colors"
      @click="selectColor(defaultColor)"
    >
      Reset to default
    </button>
  </div>
</template>
