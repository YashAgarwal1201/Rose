<!-- src/components/home/HomeActivityHeatmap.vue -->
<template>
  <div v-if="hasAnyActivity" class="mt-8">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-rose-text-muted uppercase tracking-wide">Activity</h2>
      <p class="text-xs text-rose-text-muted whitespace-nowrap">
        {{ totalCount }} {{ totalCount === 1 ? "contribution" : "contributions" }} in the last year
      </p>
    </div>

    <div ref="scrollerRef" class="mt-3 overflow-x-auto no-scrollbar pb-1">
      <div class="inline-flex flex-col gap-1">
        <div class="flex gap-1 pl-7">
          <span
            v-for="(label, index) in monthLabels"
            :key="index"
            class="shrink-0 text-[10px] leading-none text-rose-text-muted"
            :style="cellStyle"
            >{{ label }}</span
          >
        </div>

        <div class="flex gap-1">
          <div class="flex flex-col gap-1 pr-1 shrink-0">
            <span
              v-for="(label, index) in dayLabels"
              :key="index"
              class="flex items-center text-[10px] leading-none text-rose-text-muted"
              :style="cellStyle"
              >{{ label }}</span
            >
          </div>

          <div class="flex gap-1">
            <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="flex flex-col gap-1">
              <div
                v-for="day in week"
                :key="day.dateKey"
                :class="['rounded-sm', levelClasses[day.level]]"
                :style="cellStyle"
                :title="tooltipFor(day)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { type HeatmapDay, useActivityHeatmap } from "../../composables/useActivityHeatmap";

const { hasAnyActivity, totalCount, weeks, refresh } = useActivityHeatmap();

const CELL_SIZE = 11;
const cellStyle = { height: `${CELL_SIZE}px`, width: `${CELL_SIZE}px` };

const levelClasses = [
  "bg-rose-surface border border-rose-border",
  "bg-rose-primary/25",
  "bg-rose-primary/45",
  "bg-rose-primary/70",
  "bg-rose-primary/95",
];

const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

const monthLabels = computed(() => {
  const labels: string[] = [];
  let lastMonth = -1;
  for (const week of weeks.value) {
    const [firstDay] = week;
    if (firstDay && firstDay.date.getMonth() !== lastMonth) {
      labels.push(firstDay.date.toLocaleDateString(undefined, { month: "short" }));
      lastMonth = firstDay.date.getMonth();
    } else {
      labels.push("");
    }
  }
  return labels;
});

function tooltipFor(day: HeatmapDay): string {
  const formatted = day.date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return day.count === 0
    ? `No contributions on ${formatted}`
    : `${day.count} ${day.count === 1 ? "contribution" : "contributions"} on ${formatted}`;
}

const scrollerRef = ref<HTMLDivElement | null>(null);

onMounted(async () => {
  await refresh();
  await nextTick();
  // Scrolled to show the most recent weeks by default — narrower screens
  // just naturally show fewer of them before the user scrolls left.
  if (scrollerRef.value) {
    scrollerRef.value.scrollLeft = scrollerRef.value.scrollWidth;
  }
});
</script>

<style scoped>
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
