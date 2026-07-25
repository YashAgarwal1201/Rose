<!-- src/components/onboarding/ThemeStep.vue -->
<template>
  <div>
    <h2 class="text-xl font-semibold text-rose-text text-center">Pick a look</h2>
    <p class="text-sm text-rose-text-muted text-center mt-2">
      You can change this anytime in Settings.
    </p>

    <div class="grid grid-cols-3 gap-3 mt-6">
      <button
        v-for="option in options"
        :key="option.mode"
        type="button"
        class="flex flex-col items-center gap-2 rounded-xl border-2 py-4 px-2 transition-colors duration-150"
        :class="
          themeStore.mode === option.mode
            ? 'border-rose-primary bg-rose-primary/5'
            : 'border-rose-border hover:border-rose-text-muted'
        "
        @click="themeStore.setMode(option.mode)"
      >
        <component
          :is="option.icon"
          :size="20"
          :class="themeStore.mode === option.mode ? 'text-rose-primary' : 'text-rose-text-muted'"
        />
        <span
          class="text-xs font-medium"
          :class="themeStore.mode === option.mode ? 'text-rose-primary' : 'text-rose-text-muted'"
        >
          {{ option.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MonitorIcon, MoonIcon, SunIcon } from "@lucide/vue";
import { useThemeStore } from "../../stores/theme";

const themeStore = useThemeStore();

const options = [
  { icon: SunIcon, label: "Light", mode: "light" as const },
  { icon: MoonIcon, label: "Dark", mode: "dark" as const },
  { icon: MonitorIcon, label: "System", mode: "system" as const },
];
</script>
