<!-- src/components/onboarding/FeaturesStep.vue -->
<template>
  <div>
    <h2 class="text-xl font-semibold text-rose-text text-center">What do you want to use?</h2>
    <p class="text-sm text-rose-text-muted text-center mt-2">
      Pick at least one — you can change this later in Settings.
    </p>

    <div class="mt-6 space-y-2">
      <button
        v-for="option in options"
        :key="option.feature"
        type="button"
        class="w-full flex items-center gap-3 rounded-xl border-2 py-3 px-4 transition-colors duration-150 text-left"
        :class="
          settingsStore.isFeatureEnabled(option.feature)
            ? 'border-rose-primary bg-rose-primary/5'
            : 'border-rose-border hover:border-rose-text-muted'
        "
        @click="settingsStore.toggleFeature(option.feature)"
      >
        <component
          :is="option.icon"
          :size="18"
          :class="
            settingsStore.isFeatureEnabled(option.feature)
              ? 'text-rose-primary'
              : 'text-rose-text-muted'
          "
        />
        <div class="flex-1">
          <p
            class="text-sm font-medium"
            :class="
              settingsStore.isFeatureEnabled(option.feature)
                ? 'text-rose-primary'
                : 'text-rose-text'
            "
          >
            {{ option.label }}
          </p>
          <p class="text-xs text-rose-text-muted">{{ option.description }}</p>
        </div>
        <CheckIcon
          v-if="settingsStore.isFeatureEnabled(option.feature)"
          :size="18"
          class="text-rose-primary shrink-0"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, FileTextIcon, ListTodoIcon, PenLineIcon } from "@lucide/vue";
import { useSettingsStore } from "../../stores/settings";
import type { FeatureType } from "../../db/types";

const settingsStore = useSettingsStore();

const options: { feature: FeatureType; icon: unknown; label: string; description: string }[] = [
  { description: "Checklists and folders", feature: "todo", icon: ListTodoIcon, label: "Todos" },
  { description: "Handwritten sketching", feature: "note", icon: PenLineIcon, label: "Notes" },
  { description: "Rich-text documents", feature: "doc", icon: FileTextIcon, label: "Docs" },
];
</script>
