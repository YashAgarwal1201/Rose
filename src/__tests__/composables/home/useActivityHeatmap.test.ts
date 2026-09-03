import { describe, expect, it, vi, beforeEach } from "vitest";
import { useActivityHeatmap } from "@/composables/home/useActivityHeatmap";
import { createPinia, setActivePinia } from "pinia";
import { useActivityStore } from "@/stores/activity";

describe("useActivityHeatmap", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it("initializes empty and un-loaded", () => {
    expect.hasAssertions();
    const { isLoaded, hasAnyActivity, totalCount } = useActivityHeatmap();
    expect(isLoaded.value).toBeFalsy();
    expect(hasAnyActivity.value).toBeFalsy();
    expect(totalCount.value).toBe(0);
  });

  it("fetches and groups activity correctly", async () => {
    expect.hasAssertions();
    const activityStore = useActivityStore();
    
    // Mock today
    const now = new Date("2023-12-25T12:00:00Z").getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    // Mock entries
    vi.spyOn(activityStore, "getEntriesSince").mockResolvedValue([
      { id: "1", entityId: "a", type: "note_created", timestamp: now - 86400000 }, // 1 day ago
      { id: "2", entityId: "b", type: "doc_created", timestamp: now - 86400000 }, // 1 day ago
      { id: "3", entityId: "c", type: "todo_created", timestamp: now - 2 * 86400000 }, // 2 days ago
    ]);

    const { refresh, isLoaded, totalCount, hasAnyActivity, weeks } = useActivityHeatmap();
    
    await refresh();
    
    expect(isLoaded.value).toBeTruthy();
    expect(totalCount.value).toBe(3);
    expect(hasAnyActivity.value).toBeTruthy();
    
    // 53 weeks
    expect(weeks.value.length).toBe(53);
    
    // Get last week (where today is)
    const lastWeek = weeks.value[52]!;
    expect(lastWeek.length).toBe(7);
    
    const sunday = lastWeek[0]!;
    const monday = lastWeek[1]!; // Today is Monday 2023-12-25
    const yesterday = sunday; // Sunday 2023-12-24
    
    expect(yesterday.count).toBe(2);
    expect(yesterday.level).toBeGreaterThan(0);
    
    expect(monday.count).toBe(0);
    expect(monday.level).toBe(0);
    
    vi.useRealTimers();
  });
});
