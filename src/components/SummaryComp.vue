<!-- src/components/SummaryComp.vue -->
<template>
  <details class="relative inline-block">
    <summary
      :aria-label="label"
      class="list-none [&::-webkit-details-marker]:hidden inline-flex items-center justify-center w-4 h-4 rounded-full text-rose-text-muted hover:text-rose-text cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
    >
      <InfoIcon :size="14" />
    </summary>

    <div
      role="tooltip"
      :class="[
        'absolute z-40 mt-2 w-64 p-3 rounded-lg bg-rose-surface border border-rose-border shadow-lg text-xs leading-relaxed text-rose-text-muted',
        alignClass,
      ]"
    >
      <slot>{{ text }}</slot>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { InfoIcon } from "@lucide/vue";

const {
  text,
  align = "end",
  label = "More info",
} = defineProps<{
  text?: string;
  align?: "start" | "end";
  label?: string;
}>();

const alignClass = computed(() => (align === "end" ? "right-0" : "left-0"));
</script>
