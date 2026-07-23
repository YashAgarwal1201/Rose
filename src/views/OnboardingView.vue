<!-- src/views/OnboardingView.vue -->
<template>
  <div class="h-full flex items-center justify-center p-6">
    <div class="max-w-sm text-center">
      <h1 class="text-2xl font-semibold text-rose-text">Welcome to Rose</h1>
      <p class="text-sm text-rose-text-muted mt-2">
        The real welcome / privacy / theme / username / feature-selection wizard replaces this next.
        For now, continuing marks onboarding as complete with default settings.
      </p>
      <button
        type="button"
        class="mt-6 px-4 py-2 rounded-lg bg-rose-primary text-white text-sm font-medium hover:bg-rose-primary-hover transition-colors"
        @click="finish"
      >
        Continue to Rose
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useSettingsStore } from "../stores/settings";

const router = useRouter();
const settingsStore = useSettingsStore();

async function finish() {
  await settingsStore.completeOnboarding();
  await router.replace({ name: "home" });
}
</script>
