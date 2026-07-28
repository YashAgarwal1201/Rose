<!-- src/components/home/HomeFolderTile.vue -->
<template>
  <router-link
    :to="{ name: routeName, params: { pathMatch: folder.path } }"
    class="flex items-center gap-2.5 rounded-lg bg-rose-surface hover:bg-rose-surface-alt transition-colors px-3.5 py-3 min-w-0"
  >
    <FolderIcon :size="20" class="text-rose-primary shrink-0" />
    <div class="min-w-0">
      <p class="text-sm text-rose-text truncate">{{ folder.name }}</p>
      <p class="text-xs text-rose-text-muted">{{ itemLabel }}</p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FolderIcon } from "@lucide/vue";
import type { FolderSummary } from "../../composables/useHomeSummary";

const { folder, routeName } = defineProps<{
  folder: FolderSummary;
  routeName: string;
}>();

const itemLabel = computed(() => (folder.itemCount === 1 ? "1 item" : `${folder.itemCount} items`));
</script>
