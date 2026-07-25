<!-- src/components/onboarding/WelcomeStep.vue -->
<template>
  <div class="text-center">
    <div
      class="mx-auto mb-6 w-16 h-16 rounded-2xl bg-rose-primary/10 flex items-center justify-center"
    >
      <SparklesIcon :size="28" class="text-rose-primary" />
    </div>
    <h1 class="text-2xl font-semibold text-rose-text">Welcome to Rose</h1>
    <p class="text-sm text-rose-text-muted mt-3 leading-relaxed">
      A local-first home for your todos, notes, and docs — no account, no cloud, nothing leaves your
      device. Let's set a few things up.
    </p>
    <button
      type="button"
      class="mt-6 text-xs font-medium text-rose-text-muted hover:text-rose-text underline underline-offset-2"
      @click="emit('skip')"
    >
      Skip setup, use defaults
    </button>
  </div>
</template>

<script setup lang="ts">
import { SparklesIcon } from "@lucide/vue";

const emit = defineEmits<{ skip: [] }>();
</script>
