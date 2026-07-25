<!-- src/components/home/HomeFileCard.vue -->
<template>
  <button
    type="button"
    class="text-left rounded-lg bg-rose-surface hover:bg-rose-surface-alt transition-colors p-3.5 w-full"
    @click="emit('open')"
  >
    <component :is="icon" :size="18" class="text-rose-primary mb-2" />
    <p class="text-sm text-rose-text truncate">{{ item.title }}</p>
    <p class="text-xs text-rose-text-muted truncate">{{ subtitle }}</p>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FileTextIcon, ListTodoIcon } from "@lucide/vue";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import type { HomeItem } from "../../composables/useHomeSummary";

const props = defineProps<{ item: HomeItem }>();
const emit = defineEmits<{ open: [] }>();

const icon = computed(() => (props.item.type === "todo" ? ListTodoIcon : FileTextIcon));

const subtitle = computed(() => {
  const parts = [
    props.item.folderName,
    props.item.lastOpenedAt ? `opened ${formatRelativeTime(props.item.lastOpenedAt)}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
});
</script>
