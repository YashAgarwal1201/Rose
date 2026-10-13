// src/__tests__/components/home/HomeDueSoonWidget.component.test.ts
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import HomeDueSoonWidget from "@/components/home/HomeDueSoonWidget.vue";
import type { DueSoonItem } from "@/composables/home/useHomeSummary";

describe("HomeDueSoonWidget", () => {
  const sampleItems: DueSoonItem[] = [
    {
      id: "due-1",
      listId: "list-1",
      title: "File Taxes",
      dueDate: Date.now() - 24 * 60 * 60 * 1000, // yesterday -> Overdue
      priority: "high",
      listName: "Finance",
      listPath: ["Personal", "Finance"],
    },
    {
      id: "due-2",
      listId: "list-2",
      title: "Buy Groceries",
      dueDate: Date.now(), // today -> Today
      priority: "medium",
      listName: "Shopping",
      listPath: ["Shopping"],
    },
  ];

  it("does not render when items array is empty", () => {
    expect.hasAssertions();
    const wrapper = mount(HomeDueSoonWidget, {
      props: {
        items: [],
      },
    });

    expect(wrapper.find("[data-testid='home-due-soon-widget']").exists()).toBe(false);
  });

  it("renders due soon items with titles, list names, badges and due date labels", () => {
    expect.hasAssertions();
    const wrapper = mount(HomeDueSoonWidget, {
      props: {
        items: sampleItems,
        totalCount: 2,
      },
    });

    expect(wrapper.find("[data-testid='home-due-soon-widget']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Due Soon");
    expect(wrapper.text()).toContain("2");

    const items = wrapper.findAll("[data-testid='due-soon-item']");
    expect(items).toHaveLength(2);

    expect(items[0]!.text()).toContain("File Taxes");
    expect(items[0]!.text()).toContain("Finance");
    expect(items[0]!.text()).toContain("high");
    expect(items[0]!.text()).toContain("Overdue");

    expect(items[1]!.text()).toContain("Buy Groceries");
    expect(items[1]!.text()).toContain("Shopping");
    expect(items[1]!.text()).toContain("medium");
    expect(items[1]!.text()).toContain("Today");
  });

  it("emits open event when an item is clicked", async () => {
    expect.hasAssertions();
    const wrapper = mount(HomeDueSoonWidget, {
      props: {
        items: sampleItems,
        totalCount: 2,
      },
    });

    const items = wrapper.findAll("[data-testid='due-soon-item']");
    await items[0]!.trigger("click");

    expect(wrapper.emitted("open")).toBeTruthy();
    expect(wrapper.emitted("open")![0]).toEqual([sampleItems[0]]);
  });

  it("emits open event when Enter key is pressed on an item", async () => {
    expect.hasAssertions();
    const wrapper = mount(HomeDueSoonWidget, {
      props: {
        items: sampleItems,
        totalCount: 2,
      },
    });

    const items = wrapper.findAll("[data-testid='due-soon-item']");
    await items[1]!.trigger("keyup.enter");

    expect(wrapper.emitted("open")).toBeTruthy();
    expect(wrapper.emitted("open")![0]).toEqual([sampleItems[1]]);
  });

  it("shows view all button when totalCount exceeds items.length and emits viewAll when clicked", async () => {
    expect.hasAssertions();
    const wrapper = mount(HomeDueSoonWidget, {
      props: {
        items: sampleItems,
        totalCount: 7,
      },
    });

    const viewAllBtn = wrapper.find("[data-testid='view-all-due-soon']");
    expect(viewAllBtn.exists()).toBe(true);
    expect(viewAllBtn.text()).toContain("View all 7");

    await viewAllBtn.trigger("click");
    expect(wrapper.emitted("viewAll")).toBeTruthy();
  });
});
