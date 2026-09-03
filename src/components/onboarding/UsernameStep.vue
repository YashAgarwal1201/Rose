<!-- src/components/onboarding/UsernameStep.vue -->
<template>
  <div>
    <img :src="UsernameIllustration" alt="Username" class="w-48 h-auto mx-auto mb-6 select-none pointer-events-none" />
    <h2 class="text-xl font-semibold text-rose-text text-center">What should we call you?</h2>
    <p class="text-sm text-rose-text-muted text-center mt-2">
      Used for a friendly greeting on Home. Totally optional.
    </p>

    <input
      :value="modelValue"
      type="text"
      placeholder="Your name"
      maxlength="40"
      class="mt-6 w-full rounded-lg border border-rose-border bg-rose-surface px-4 py-2.5 text-sm text-rose-text placeholder:text-rose-text-muted focus:outline-none focus:ring-2 focus:ring-rose-primary/40 focus:border-rose-primary"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
import UsernameIllustration from "@/assets/illustrations/username-step.svg";

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>
