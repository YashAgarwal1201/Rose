// src/composables/useActivityHeatmap.ts
import { computed, ref } from "vue";
import { useActivityStore } from "../stores/activity";

export interface HeatmapDay {
  dateKey: string;
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const WEEKS_IN_VIEW = 53; // trailing year, GitHub-style

function startOfDay(timestamp: number): Date {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function gridBounds(): { start: Date; end: Date } {
  const today = startOfDay(Date.now());
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay())); // extend to this week's Saturday
  const start = new Date(end);
  start.setDate(start.getDate() - (WEEKS_IN_VIEW * 7 - 1)); // back to a Sunday
  return { end, start };
}

function levelFor(count: number, maxCount: number): HeatmapDay["level"] {
  if (count === 0) {
    return 0;
  }
  if (maxCount <= 4) {
    return Math.min(count, 4) as HeatmapDay["level"];
  }
  const ratio = count / maxCount;
  if (ratio > 0.75) {
    return 4;
  }
  if (ratio > 0.5) {
    return 3;
  }
  if (ratio > 0.25) {
    return 2;
  }
  return 1;
}

export function useActivityHeatmap() {
  const activityStore = useActivityStore();
  const counts = ref<Map<string, number>>(new Map());
  const isLoaded = ref(false);

  async function refresh() {
    const { start } = gridBounds();
    const entries = await activityStore.getEntriesSince(start.getTime());
    const next = new Map<string, number>();
    for (const entry of entries) {
      const key = dateKey(startOfDay(entry.timestamp));
      next.set(key, (next.get(key) ?? 0) + 1);
    }
    counts.value = next;
    isLoaded.value = true;
  }

  const weeks = computed<HeatmapDay[][]>(() => {
    const { start } = gridBounds();
    const today = startOfDay(Date.now());
    const maxCount = Math.max(0, ...counts.value.values());

    const result: HeatmapDay[][] = [];
    const cursor = new Date(start);
    for (let w = 0; w < WEEKS_IN_VIEW; w++) {
      const week: HeatmapDay[] = [];
      for (let d = 0; d < 7; d++) {
        const key = dateKey(cursor);
        const count = cursor.getTime() > today.getTime() ? 0 : (counts.value.get(key) ?? 0);
        week.push({
          count,
          date: new Date(cursor),
          dateKey: key,
          level: levelFor(count, maxCount),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  });

  const totalCount = computed(() =>
    weeks.value.reduce(
      (sum, week) => sum + week.reduce((weekSum, day) => weekSum + day.count, 0),
      0,
    ),
  );

  const hasAnyActivity = computed(() => totalCount.value > 0);

  return { hasAnyActivity, isLoaded, refresh, totalCount, weeks };
}
