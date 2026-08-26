<!-- src/components/onboarding/FinishStep.vue -->
<template>
  <div class="text-center">
    <div
      class="mx-auto mb-6 w-16 h-16 rounded-2xl bg-rose-primary/10 flex items-center justify-center"
    >
      <CheckCircleIcon :size="28" class="text-rose-primary" />
    </div>
    <h2 class="text-xl font-semibold text-rose-text">You're all set{{ greetingSuffix }}</h2>
    <p class="text-sm text-rose-text-muted mt-3">
      Rose is ready with
      <span class="font-medium text-rose-text">{{ enabledFeatureLabel }}</span>
      enabled. Change any of this later from Settings.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CheckCircleIcon } from "@lucide/vue";
import { useSettingsStore } from "../../stores/settings";

const settingsStore = useSettingsStore();

const featureLabels: Record<string, string> = {
  doc: "Docs",
  note: "Notes",
  todo: "Todos",
};

const greetingSuffix = computed(() =>
  settingsStore.username ? `, ${settingsStore.username}` : "",
);

const enabledFeatureLabel = computed(() => {
  const enabledFeatures: Array<'doc'|'note'|'todo'> = ['doc', 'note', 'todo'];
  const labels = enabledFeatures.map((feature) => featureLabels[feature]);
  if (labels.length === 1) {
    return labels[0];
  }
  if (labels.length === 2) {
    return labels.join(" and ");
  }
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
});
</script>
