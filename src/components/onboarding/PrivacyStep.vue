<!-- src/components/onboarding/PrivacyStep.vue -->
<template>
  <div>
    <img :src="PrivacyIllustration" alt="Privacy" class="w-48 h-auto mx-auto mb-6 select-none pointer-events-none" />
    <h2 class="text-xl font-semibold text-rose-text text-center">Your data stays with you</h2>
    <ul class="mt-5 space-y-3 text-sm text-rose-text-muted">
      <li class="flex gap-2.5">
        <CheckIcon :size="16" class="text-rose-primary shrink-0 mt-0.5" />
        <span
          >Everything is stored locally in your browser — there's no server, no account, and nothing
          is synced anywhere.</span
        >
      </li>
      <li class="flex gap-2.5">
        <CheckIcon :size="16" class="text-rose-primary shrink-0 mt-0.5" />
        <span
          >Clearing your browser's site data will remove everything, so use Export in Settings to
          keep a backup.</span
        >
      </li>
      <li class="flex gap-2.5">
        <CheckIcon :size="16" class="text-rose-primary shrink-0 mt-0.5" />
        <span
          >Since nothing is synced, Rose only holds what's on this specific device/browser.</span
        >
      </li>
    </ul>

    <div class="mt-8 pt-5 border-t border-rose-border flex flex-col items-center gap-2.5">
      <button
        type="button"
        class="text-xs font-semibold text-rose-primary hover:text-rose-primary-hover underline underline-offset-4 cursor-pointer transition-colors"
        @click="emit('restore')"
      >
        Restore from a backup file
      </button>
      <button
        type="button"
        class="text-xs font-medium text-rose-text-muted hover:text-rose-text underline underline-offset-4 cursor-pointer transition-colors"
        @click="emit('skip')"
      >
        Skip setup, use defaults
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from "@lucide/vue";
import PrivacyIllustration from "@/assets/illustrations/privacy-step.svg";

const emit = defineEmits<{
  restore: [];
  skip: [];
}>();
</script>
