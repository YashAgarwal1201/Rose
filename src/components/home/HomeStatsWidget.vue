<!-- src/components/home/HomeStatsWidget.vue -->
<template>
  <div class="mt-8 rounded-xl border border-rose-border p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-around items-center">
    <div class="flex flex-col items-center">
      <span class="text-2xl font-bold text-rose-primary">{{ listCount }}</span>
      <span class="text-sm text-rose-text-muted flex items-center gap-1">
        <ListTodoIcon :size="14" /> Todo Lists
      </span>
    </div>
    
    <div class="w-full sm:w-px h-px sm:h-10 bg-rose-border"></div>
    
    <div class="flex flex-col items-center">
      <span class="text-2xl font-bold text-rose-primary">{{ noteCount }}</span>
      <span class="text-sm text-rose-text-muted flex items-center gap-1">
        <PenLineIcon :size="14" /> Notes
      </span>
    </div>
    
    <div class="w-full sm:w-px h-px sm:h-10 bg-rose-border"></div>
    
    <div class="flex flex-col items-center">
      <span class="text-2xl font-bold text-rose-primary">{{ docCount }}</span>
      <span class="text-sm text-rose-text-muted flex items-center gap-1">
        <FileTextIcon :size="14" /> Docs
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileTextIcon, ListTodoIcon, PenLineIcon } from "@lucide/vue";

defineProps<{
  listCount: number;
  noteCount: number;
  docCount: number;
}>();
</script>
