<!-- src/components/home/HomeFileCard.vue -->
<template>
  <button type="button"
    class="text-left rounded-xl sm:rounded-2xl bg-rose-surface hover:bg-rose-surface-alt transition-colors p-3 sm:p-4 w-full"
    @click="emit('open')">
    <component :is="icon" :size="20" class="mb-2" :class="iconColor" />
    <p class="text-base text-rose-text truncate font-medium">{{ item.title }}</p>
    <p class="text-sm text-rose-text-muted truncate mt-1">{{ subtitle }}</p>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FileTextIcon, ListTodoIcon } from "@lucide/vue";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import type { HomeItem } from "@/composables/home/useHomeSummary";

const { item, timestampLabel = "opened" } = defineProps<{
  item: HomeItem;
  timestampLabel?: "opened" | "updated";
}>();
const emit = defineEmits<{ open: [] }>();

const icon = computed(() => (item.type === "todo" ? ListTodoIcon : FileTextIcon));

const iconColor = computed(() => {
  if (item.type === "todo") { return "text-rose-green"; }
  if (item.type === "doc") { return "text-rose-cream"; }
  return "text-rose-primary";
});

const subtitle = computed(() => {
  const timestamp = timestampLabel === "updated" ? item.updatedAt : item.lastOpenedAt;
  const parts = [
    item.folderName,
    timestamp ? `${timestampLabel} ${formatRelativeTime(timestamp)}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
});
</script>
