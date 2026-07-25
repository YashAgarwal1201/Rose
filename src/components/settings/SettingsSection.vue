<!-- src/components/settings/SettingsSection.vue -->
<template>
  <section class="rounded-xl border border-rose-border bg-rose-surface overflow-hidden h-fit">
    <div class="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-rose-border">
      <span
        class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rose-primary/10 flex items-center justify-center shrink-0"
      >
        <component :is="icon" :size="18" class="text-rose-primary" />
      </span>
      <div>
        <h2 class="text-base sm:text-lg font-semibold text-rose-text">{{ title }}</h2>
        <p v-if="description" class="text-xs sm:text-sm text-rose-text-muted mt-0.5">
          {{ description }}
        </p>
      </div>
    </div>
    <div class="divide-y divide-rose-border">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  icon: unknown;
  title: string;
  description?: string;
}>();
</script>
