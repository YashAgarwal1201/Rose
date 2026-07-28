<!-- src/components/settings/SettingsRow.vue -->
<template>
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-4"
  >
    <div class="min-w-0">
      <p :id="labelId" class="text-sm sm:text-base text-rose-text">{{ label }}</p>
      <p
        v-if="description"
        :id="descriptionId"
        class="text-xs sm:text-sm text-rose-text-muted mt-0.5"
      >
        {{ description }}
      </p>
    </div>
    <div class="shrink-0">
      <slot :label-id="labelId" :description-id="description ? descriptionId : undefined" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const { label, description } = defineProps<{
  label: string;
  description?: string;
}>();

// Used to wire aria-labelledby/aria-describedby on whatever control the
// slot renders, since these are custom controls rather than native
// <label for="..."> inputs.
const slug = computed(() =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(?<edge>^-|-$)/g, ""),
);
const labelId = computed(() => `setting-label-${slug.value}`);
const descriptionId = computed(() => `setting-desc-${slug.value}`);
</script>
