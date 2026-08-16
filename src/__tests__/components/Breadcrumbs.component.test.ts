// src/__tests__/components/Breadcrumbs.component.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Breadcrumbs from "@/components/ui/Breadcrumbs.vue";
import type { Crumb } from "../../types/explorer";

function mountBreadcrumbs(crumbs: Crumb[] = []) {
  return mount(Breadcrumbs, {
    props: { crumbs },
    global: {
      stubs: {
        // Stub Teleport so popover renders inline instead of into body
        Teleport: true,
      },
    },
  });
}

describe("Breadcrumbs", () => {
  beforeEach(() => {
    // no shared state to reset
  });

  // ─────────────────────────────────────────────
  // rendering
  // ─────────────────────────────────────────────
  describe("rendering", () => {
    it("renders a home button", () => {
      expect.hasAssertions();
      const wrapper = mountBreadcrumbs();
      const homeBtn = wrapper.find("button");
      expect(homeBtn.exists()).toBeTruthy();
    });

    it("renders the nav element", () => {
      expect.hasAssertions();
      const wrapper = mountBreadcrumbs();
      expect(wrapper.find("nav").exists()).toBeTruthy();
    });

    it("renders crumb names in the desktop trail", () => {
      expect.hasAssertions();
      const crumbs: Crumb[] = [
        { id: "f1", name: "Projects" },
        { id: "f2", name: "Work" },
      ];
      const wrapper = mountBreadcrumbs(crumbs);
      // The full trail is rendered in sm:flex containers
      const buttons = wrapper.findAll("button");
      const buttonTexts = buttons.map((b) => b.text());
      expect(buttonTexts.some((t) => t.includes("Projects"))).toBeTruthy();
      expect(buttonTexts.some((t) => t.includes("Work"))).toBeTruthy();
    });

    it("shows last crumb name for single-crumb path", () => {
      expect.hasAssertions();
      const crumbs: Crumb[] = [{ id: "f1", name: "Documents" }];
      const wrapper = mountBreadcrumbs(crumbs);
      expect(wrapper.text()).toContain("Documents");
    });

    it("renders nothing besides home when crumbs array is empty", () => {
      expect.hasAssertions();
      const wrapper = mountBreadcrumbs([]);
      const buttons = wrapper.findAll("button");
      // Only the home button should exist
      expect(buttons).toHaveLength(1);
    });
  });

  // ─────────────────────────────────────────────
  // navigation emits
  // ─────────────────────────────────────────────
  describe("navigation emits", () => {
    it("emits navigate(null) when home button is clicked", async () => {
      expect.hasAssertions();
      const wrapper = mountBreadcrumbs([{ id: "f1", name: "Folder" }]);
      const homeBtn = wrapper.findAll("button").find((b) => !b.text().includes("Folder"))!;
      await homeBtn.trigger("click");
      expect(wrapper.emitted("navigate")).toBe(true);
      expect(wrapper.emitted("navigate")![0]).toStrictEqual([null]);
    });

    it("emits navigate(crumbId) when a desktop crumb button is clicked", async () => {
      expect.hasAssertions();
      const crumbs: Crumb[] = [
        { id: "f1", name: "Alpha" },
        { id: "f2", name: "Beta" },
      ];
      const wrapper = mountBreadcrumbs(crumbs);
      // Find the desktop crumb buttons (the ones inside sm:flex containers)
      const crumbButtons = wrapper.findAll("button").filter((b) => b.text().includes("Alpha"));
      if (crumbButtons.length > 0) {
        await crumbButtons[0]!.trigger("click");
        expect(wrapper.emitted("navigate")).toBe(true);
        expect(wrapper.emitted("navigate")![0]).toStrictEqual(["f1"]);
      }
    });
  });

  // ─────────────────────────────────────────────
  // multi-crumb trail
  // ─────────────────────────────────────────────
  describe("multi-crumb trail", () => {
    it("renders all crumb names in the desktop trail for 3+ crumbs", () => {
      expect.hasAssertions();
      const crumbs: Crumb[] = [
        { id: "f1", name: "Root" },
        { id: "f2", name: "Sub" },
        { id: "f3", name: "Deep" },
      ];
      const wrapper = mountBreadcrumbs(crumbs);
      expect(wrapper.text()).toContain("Root");
      expect(wrapper.text()).toContain("Sub");
      expect(wrapper.text()).toContain("Deep");
    });
  });
});
