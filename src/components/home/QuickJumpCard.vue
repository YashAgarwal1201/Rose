<!-- src/components/home/QuickJumpCard.vue -->
<template>
  <router-link
    :to="{ name: routeName }"
    class="flex flex-col items-center gap-2 rounded-xl border border-rose-border bg-rose-surface hover:bg-rose-surface-alt hover:border-rose-primary/40 transition-colors py-4 px-3 flex-1 min-w-22.5"
  >
    <span class="w-9 h-9 rounded-full bg-rose-primary/10 flex items-center justify-center">
      <component :is="icon" :size="18" class="text-rose-primary" />
    </span>
    <span class="text-xs font-medium text-rose-text">{{ label }}</span>
  </router-link>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  icon: unknown;
  routeName: string;
}>();
</script>
