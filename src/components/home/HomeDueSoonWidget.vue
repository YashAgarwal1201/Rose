<!-- src/components/home/HomeDueSoonWidget.vue -->
<template>
  <section v-if="items.length > 0" class="mt-8 rounded-2xl border border-rose-border bg-rose-surface/40 p-4 sm:p-5 shadow-xs" data-testid="home-due-soon-widget">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-rose-primary/10 text-rose-primary flex items-center justify-center shrink-0">
          <ClockIcon :size="18" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base sm:text-lg font-bold text-rose-text">Due Soon</h2>
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-primary/10 text-rose-primary">
              {{ totalCount ?? items.length }}
            </span>
          </div>
        </div>
      </div>

      <button
        v-if="totalCount && totalCount > items.length"
        type="button"
        data-testid="view-all-due-soon"
        class="text-xs font-semibold text-rose-primary hover:text-rose-primary-hover flex items-center gap-1 transition-colors"
        @click="emit('viewAll')"
      >
        <span>View all {{ totalCount }}</span>
        <ArrowRight :size="13" />
      </button>
    </div>

    <!-- Items list -->
    <div class="mt-4 space-y-2">
      <div
        v-for="item in items"
        :key="item.id"
        role="button"
        tabindex="0"
        data-testid="due-soon-item"
        class="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 p-3 rounded-xl bg-rose-surface border border-rose-border hover:border-rose-primary/50 hover:bg-rose-surface-alt transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-primary"
        @click="emit('open', item)"
        @keyup.enter="emit('open', item)"
        @keyup.space.prevent="emit('open', item)"
      >
        <!-- Left: Status dot, Title, List name -->
        <div class="flex items-start gap-2.5 min-w-0 flex-1">
          <span
            class="w-2 h-2 rounded-full mt-1.5 shrink-0"
            :class="{
              'bg-red-500 ring-2 ring-red-500/20': getDueInfo(item.dueDate).urgency === 'overdue',
              'bg-amber-500 ring-2 ring-amber-500/20': getDueInfo(item.dueDate).urgency === 'today' || getDueInfo(item.dueDate).urgency === 'tomorrow',
              'bg-rose-primary/50': getDueInfo(item.dueDate).urgency === 'soon',
            }"
          ></span>

          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-rose-text group-hover:text-rose-primary transition-colors truncate">
              {{ item.title }}
            </p>
            <p class="text-xs text-rose-text-muted flex items-center gap-1.5 mt-0.5 truncate">
              <ListTodoIcon :size="12" class="shrink-0" />
              <span class="truncate">{{ item.listName }}</span>
            </p>
          </div>
        </div>

        <!-- Right: Priority badge, Due date label, arrow -->
        <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
          <span
            v-if="item.priority"
            class="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
            :class="{
              'bg-red-500/15 text-red-500 dark:text-red-400': item.priority === 'high',
              'bg-amber-500/15 text-amber-600 dark:text-amber-400': item.priority === 'medium',
              'bg-sky-500/15 text-sky-600 dark:text-sky-400': item.priority === 'low',
            }"
          >
            {{ item.priority }}
          </span>

          <span
            class="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
            :class="{
              'bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/25':
                getDueInfo(item.dueDate).urgency === 'overdue',
              'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25':
                getDueInfo(item.dueDate).urgency === 'today' || getDueInfo(item.dueDate).urgency === 'tomorrow',
              'bg-rose-surface-alt text-rose-text-muted border border-rose-border':
                getDueInfo(item.dueDate).urgency === 'soon',
            }"
          >
            <AlertCircleIcon v-if="getDueInfo(item.dueDate).urgency === 'overdue'" :size="12" class="shrink-0" />
            <CalendarIcon v-else :size="12" class="shrink-0" />
            <span>{{ getDueInfo(item.dueDate).label }}</span>
          </span>

          <ArrowRight :size="14" class="text-rose-text-muted opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { AlertCircleIcon, ArrowRight, CalendarIcon, ClockIcon, ListTodoIcon } from "@lucide/vue";
import type { DueSoonItem } from "@/composables/home/useHomeSummary";
import { formatDueDate } from "@/utils/formatDueDate";

defineProps<{
  items: DueSoonItem[];
  totalCount?: number;
}>();

const emit = defineEmits<{
  open: [item: DueSoonItem];
  viewAll: [];
}>();

function getDueInfo(timestamp: number) {
  return formatDueDate(timestamp);
}
</script>
