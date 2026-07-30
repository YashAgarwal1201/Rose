// src/composables/useContributionDistribution.ts
import { computed, ref } from "vue";
import { useActivityStore } from "../stores/activity";
import { useSettingsStore } from "../stores/settings";
import type { ActivityAction, FeatureType } from "../db/types";

export interface DistributionSegment {
  type: FeatureType;
  label: string;
  count: number;
  percentage: number;
}

// folder_created is intentionally excluded — it doesn't tell us which
// feature the folder belongs to.
const CATEGORY_BY_ACTION: Partial<Record<ActivityAction, FeatureType>> = {
  doc_created: "doc",
  doc_updated: "doc",
  note_created: "note",
  note_updated: "note",
  todo_created: "todo",
  todo_list_created: "todo",
  todo_toggled: "todo",
  todo_updated: "todo",
};

const LABELS: Record<FeatureType, string> = {
  doc: "Docs",
  note: "Notes",
  todo: "Todos",
};

// Fixed order so the chart's shape stays predictable as features get toggled.
const AXIS_ORDER: FeatureType[] = ["todo", "doc", "note"];

export function useContributionDistribution() {
  const activityStore = useActivityStore();
  const settingsStore = useSettingsStore();
  const rawCounts = ref<Record<FeatureType, number>>({ doc: 0, note: 0, todo: 0 });
  const isLoaded = ref(false);

  async function refresh() {
    const entries = await activityStore.getEntriesSince(0);
    const next: Record<FeatureType, number> = { doc: 0, note: 0, todo: 0 };
    for (const entry of entries) {
      const category = CATEGORY_BY_ACTION[entry.type];
      if (category) {
        next[category] += 1;
      }
    }
    rawCounts.value = next;
    isLoaded.value = true;
  }

  const categories = computed(() =>
    AXIS_ORDER.filter((type) => settingsStore.isFeatureEnabled(type)),
  );

  const total = computed(() =>
    categories.value.reduce((sum, type) => sum + rawCounts.value[type], 0),
  );

  const segments = computed<DistributionSegment[]>(() =>
    categories.value.map((type) => {
      const count = rawCounts.value[type];
      const t = total.value;
      return {
        count,
        label: LABELS[type],
        percentage: t === 0 ? 0 : Math.round((count / t) * 1000) / 10,
        type,
      };
    }),
  );

  const hasEnoughData = computed(() => categories.value.length >= 2 && total.value > 0);

  return { hasEnoughData, isLoaded, refresh, segments, total };
}
