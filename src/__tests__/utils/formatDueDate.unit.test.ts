// src/__tests__/utils/formatDueDate.unit.test.ts
import { describe, expect, it } from "vitest";
import { formatDueDate } from "@/utils/formatDueDate";

describe("formatDueDate", () => {
  const baseNow = new Date(2026, 9, 15, 14, 30, 0).getTime(); // Oct 15, 2026 at 14:30

  it("returns Overdue for dates in the past (yesterday or earlier)", () => {
    const yesterday = new Date(2026, 9, 14, 10, 0, 0).getTime();
    const result = formatDueDate(yesterday, baseNow);
    expect(result.label).toBe("Overdue");
    expect(result.urgency).toBe("overdue");
    expect(result.isOverdue).toBe(true);
  });

  it("returns Today for timestamps falling on the same calendar day", () => {
    const todayEarlier = new Date(2026, 9, 15, 8, 0, 0).getTime();
    const todayLater = new Date(2026, 9, 15, 22, 0, 0).getTime();

    expect(formatDueDate(todayEarlier, baseNow)).toEqual({
      label: "Today",
      urgency: "today",
      isOverdue: false,
    });
    expect(formatDueDate(todayLater, baseNow)).toEqual({
      label: "Today",
      urgency: "today",
      isOverdue: false,
    });
  });

  it("returns Tomorrow for dates on the next calendar day", () => {
    const tomorrow = new Date(2026, 9, 16, 9, 0, 0).getTime();
    const result = formatDueDate(tomorrow, baseNow);
    expect(result.label).toBe("Tomorrow");
    expect(result.urgency).toBe("tomorrow");
    expect(result.isOverdue).toBe(false);
  });

  it("returns formatted short date for dates beyond tomorrow", () => {
    const inTwoDays = new Date(2026, 9, 17, 12, 0, 0).getTime();
    const result = formatDueDate(inTwoDays, baseNow);
    expect(result.label).toContain("17");
    expect(result.urgency).toBe("soon");
    expect(result.isOverdue).toBe(false);
  });
});
