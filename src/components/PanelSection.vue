<!-- src/components/PanelSection.vue -->
<template>
  <div>
    <button
      type="button"
      class="w-full flex items-center justify-between gap-2 px-2 py-4 cursor-pointer hover:bg-rose-surface/40 transition-colors rounded-xl"
      :aria-expanded="isOpen"
      @click="emit('toggle')"
    >
      <span class="flex items-center gap-3 font-medium text-rose-text">
        <component
          :is="icon"
          class="w-4 h-4 text-rose-primary shrink-0"
          :class="isOpen ? 'animate-icon-expand-nudge' : ''"
        />
        {{ label }}
      </span>

      <span class="flex items-center gap-2">
        <span v-if="!isOpen" class="flex items-center gap-2">
          <slot name="collapsed-preview" />
        </span>
        <ChevronDownIcon
          class="w-4 h-4 text-rose-text-muted transition-transform"
          :class="isOpen ? 'rotate-180' : ''"
        />
      </span>
    </button>

    <div v-if="isOpen" class="px-4 pb-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from "@lucide/vue";
import type { Component } from "vue";

defineProps<{
  icon: Component;
  label: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{ toggle: [] }>();
</script>
