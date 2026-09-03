import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import HomeContributionAreaChart from "@/components/home/HomeContributionAreaChart.vue";

describe("HomeContributionAreaChart.vue", () => {
  it("renders SVG elements for segments", () => {
    expect.hasAssertions();
    const segments = [
      { label: "Todos", percentage: 50, type: "todo" as const, count: 5 },
      { label: "Notes", percentage: 30, type: "note" as const, count: 3 },
      { label: "Docs", percentage: 20, type: "doc" as const, count: 2 }
    ];

    const wrapper = mount(HomeContributionAreaChart, {
      props: { segments }
    });

    const svg = wrapper.find("svg");
    expect(svg.exists()).toBeTruthy();

    const texts = wrapper.findAll("text");
    const textContents = texts.map(t => t.text());
    
    expect(textContents).toContain("Todos");
    expect(textContents).toContain("50%");
    expect(textContents).toContain("Notes");
    expect(textContents).toContain("30%");
    expect(textContents).toContain("Docs");
    expect(textContents).toContain("20%");
  });
});
