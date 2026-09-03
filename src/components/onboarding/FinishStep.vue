<!-- src/components/onboarding/FinishStep.vue -->
<template>
  <div class="text-center">
    <img :src="FinishIllustration" alt="Finish" class="w-48 h-auto mx-auto mb-6 select-none pointer-events-none" />
    <h2 class="text-xl font-semibold text-rose-text">You're all set{{ greetingSuffix }}</h2>
    <p class="text-sm text-rose-text-muted mt-3">
      Rose is ready! You can now start creating your docs, notes, and todos.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FinishIllustration from "@/assets/illustrations/finish-step.svg";
import { useSettingsStore } from "../../stores/settings";

const settingsStore = useSettingsStore();

const greetingSuffix = computed(() =>
  settingsStore.username ? `, ${settingsStore.username}!` : "!",
);
</script>
