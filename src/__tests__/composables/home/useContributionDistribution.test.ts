import { describe, expect, it, vi, beforeEach } from "vitest";
import { useContributionDistribution } from "@/composables/home/useContributionDistribution";
import { createPinia, setActivePinia } from "pinia";
import { useActivityStore } from "@/stores/activity";

describe("useContributionDistribution", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it("initializes zeroed and correctly identifies empty state", () => {
    expect.hasAssertions();
    const { isLoaded, hasEnoughData, total, segments } = useContributionDistribution();
    expect(isLoaded.value).toBeFalsy();
    expect(hasEnoughData.value).toBeFalsy();
    expect(total.value).toBe(0);
    
    expect(segments.value[0]?.percentage).toBe(0);
  });

  it("aggregates entries and calculates percentages correctly", async () => {
    expect.hasAssertions();
    const store = useActivityStore();
    
    // total of 4 valid entries: 1 doc, 1 note, 2 todo
    // 1 invalid entry (folder_created)
    vi.spyOn(store, "getEntriesSince").mockResolvedValue([
      { id: "1", type: "doc_created", entityId: "a", timestamp: 1 },
      { id: "2", type: "note_updated", entityId: "b", timestamp: 2 },
      { id: "3", type: "todo_created", entityId: "c", timestamp: 3 },
      { id: "4", type: "todo_toggled", entityId: "c", timestamp: 4 },
      { id: "5", type: "folder_created", entityId: "f", timestamp: 5 }, // should be ignored
    ] as any);

    const dist = useContributionDistribution();
    await dist.refresh();

    expect(dist.isLoaded.value).toBeTruthy();
    expect(dist.total.value).toBe(4);
    expect(dist.hasEnoughData.value).toBeTruthy();

    const segments = dist.segments.value;
    
    const todoSegment = segments.find(s => s.type === "todo")!;
    expect(todoSegment.count).toBe(2);
    expect(todoSegment.percentage).toBe(50); // 2/4 = 50%
    
    const docSegment = segments.find(s => s.type === "doc")!;
    expect(docSegment.count).toBe(1);
    expect(docSegment.percentage).toBe(25); // 1/4 = 25%

    const noteSegment = segments.find(s => s.type === "note")!;
    expect(noteSegment.count).toBe(1);
    expect(noteSegment.percentage).toBe(25); // 1/4 = 25%
  });
});
