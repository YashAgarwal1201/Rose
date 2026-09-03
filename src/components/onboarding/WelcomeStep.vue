<!-- src/components/onboarding/WelcomeStep.vue -->
<template>
  <div class="text-center">
    <img :src="WelcomeIllustration" alt="Welcome" class="w-48 h-auto mx-auto mb-6 select-none pointer-events-none" />
    <h1 class="text-2xl font-semibold text-rose-text">Welcome to Rose</h1>
    <p class="text-sm text-rose-text-muted mt-3 leading-relaxed">
      A local-first home for your todos, notes, and docs — no account, no cloud, nothing leaves your
      device. Let's set a few things up.
    </p>
    <div class="mt-6 flex flex-col items-center gap-2">
      <button
        type="button"
        class="text-xs font-medium text-rose-text-muted hover:text-rose-text underline underline-offset-2"
        @click="emit('skip')"
      >
        Skip setup, use defaults
      </button>
      <button
        type="button"
        class="text-xs font-medium text-rose-primary hover:text-rose-primary/80 underline underline-offset-2"
        @click="emit('restore')"
      >
        Restore from a backup file
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import WelcomeIllustration from "@/assets/illustrations/welcome-step.svg";

const emit = defineEmits<{ skip: []; restore: [] }>();
</script>
