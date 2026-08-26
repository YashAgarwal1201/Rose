import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import HomeActivityHeatmap from "@/components/home/HomeActivityHeatmap.vue";

describe("HomeActivityHeatmap.vue", () => {
  it("renders weeks and labels correctly", async () => {
    expect.hasAssertions();
    const mockDate = new Date("2026-08-26T12:00:00Z");
    const mockWeeks = [
      [
        { date: mockDate, count: 5, level: 2 as const, dateKey: "2026-08-26" }
      ]
    ];

    const wrapper = mount(HomeActivityHeatmap, {
      props: { weeks: mockWeeks }
    });

    const cells = wrapper.findAll("div[title]");
    expect(cells).toHaveLength(1);
    expect(cells[0]?.attributes("title")).toContain("5 contributions on");
    expect(cells[0]?.classes()).toContain("bg-rose-primary/45");
  });
});
