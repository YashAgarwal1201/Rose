<!-- src/components/home/HomeActivityHeatmap.vue -->
<template>
  <div ref="scrollerRef" class="overflow-x-auto no-scrollbar pb-1">
    <div class="inline-flex flex-col gap-1">
      <div class="flex gap-1 pl-8">
        <span v-for="(label, index) in monthLabels" :key="index"
          class="shrink-0 text-xs leading-none text-rose-text-muted" :style="cellStyle">{{ label }}</span>
      </div>

      <div class="flex flex-row gap-2">
        <div class="flex flex-col gap-1 pr-3 shrink-0 sticky left-0 bg-rose-bg">
          <span v-for="(label, index) in dayLabels" :key="index"
            class="w-full flex items-center text-xs leading-none text-rose-text-muted" :style="cellStyle">{{ label
            }}</span>
        </div>

        <div class="grow flex gap-1">
          <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="flex flex-col gap-1">
            <div v-for="day in week" :key="day.dateKey" :class="['rounded-sm', levelClasses[day.level]]"
              :style="cellStyle" :title="tooltipFor(day)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import type { HeatmapDay } from "@/composables/home/useActivityHeatmap";

const { weeks } = defineProps<{ weeks: HeatmapDay[][] }>();

const CELL_SIZE = 13;
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
  for (const week of weeks) {
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
  await nextTick();
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
