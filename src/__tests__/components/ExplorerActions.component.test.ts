// src/__tests__/components/ExplorerActions.component.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ExplorerActions from "@/components/explorer/ExplorerActions.vue";

function mountActions(fileLabel = "note") {
  return mount(ExplorerActions, {
    props: { fileLabel },
  });
}

describe("ExplorerActions", () => {
  beforeEach(() => {
    // no shared state
  });

  // ─────────────────────────────────────────────
  // rendering
  // ─────────────────────────────────────────────
  describe("rendering", () => {
    it("renders the desktop 'New folder' button", () => {
      expect.hasAssertions();
      const wrapper = mountActions();
      const buttons = wrapper.findAll("button");
      const folderBtn = buttons.find((b) => b.text().includes("New folder"));
      expect(folderBtn?.exists()).toBe(true);
    });

    it("renders the desktop 'New {fileLabel}' button with correct label", () => {
      expect.hasAssertions();
      const wrapper = mountActions("document");
      const buttons = wrapper.findAll("button");
      const fileBtn = buttons.find((b) => b.text().includes("New document"));
      expect(fileBtn?.exists()).toBe(true);
    });

    it("renders the mobile FAB toggle button", () => {
      expect.hasAssertions();
      const wrapper = mountActions();
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      expect(fabBtn.exists()).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // desktop button emits
  // ─────────────────────────────────────────────
  describe("desktop button emits", () => {
    it("emits createFolder when the desktop New folder button is clicked", async () => {
      expect.hasAssertions();
      const wrapper = mountActions();
      const buttons = wrapper.findAll("button");
      const folderBtn = buttons.find((b) => b.text().includes("New folder"))!;
      await folderBtn.trigger("click");
      expect(wrapper.emitted("createFolder")).toBeTruthy();
    });

    it("emits createFile when the desktop New {fileLabel} button is clicked", async () => {
      expect.hasAssertions();
      const wrapper = mountActions("note");
      const buttons = wrapper.findAll("button");
      const fileBtn = buttons.find((b) => b.text().includes("New note"))!;
      await fileBtn.trigger("click");
      expect(wrapper.emitted("createFile")).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────
  // FAB toggle
  // ─────────────────────────────────────────────
  describe("FAB toggle", () => {
    it("opens the speed-dial on FAB click", async () => {
      expect.hasAssertions();
      const wrapper = mountActions();
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      // After opening, the button should show "Close action menu"
      const closeBtn = wrapper.find('button[aria-label="Close action menu"]');
      expect(closeBtn.exists()).toBe(true);
    });

    it("closes the speed-dial on second FAB click", async () => {
      expect.hasAssertions();
      const wrapper = mountActions();
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      const closeBtn = wrapper.find('button[aria-label="Close action menu"]');
      await closeBtn.trigger("click");
      const openBtn = wrapper.find('button[aria-label="Open action menu"]');
      expect(openBtn.exists()).toBe(true);
    });

    it("shows a backdrop when FAB is open", async () => {
      expect.hasAssertions();
      const wrapper = mountActions();
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      const backdrop = wrapper.find('div[aria-hidden="true"]');
      expect(backdrop.exists()).toBe(true);
    });

    it("emits createFile from the mobile speed-dial button", async () => {
      expect.hasAssertions();
      const wrapper = mountActions("list");
      // Open FAB
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      // Find the mobile file button (aria-label="New list")
      const mobileFileBtn = wrapper.find('button[aria-label="New list"]');
      await mobileFileBtn.trigger("click");
      expect(wrapper.emitted("createFile")).toBeTruthy();
    });

    it("emits createFolder from the mobile speed-dial button", async () => {
      expect.hasAssertions();
      const wrapper = mountActions();
      // Open FAB
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      // Find the mobile folder button
      const mobileFolderBtn = wrapper.find('button[aria-label="New folder"]');
      await mobileFolderBtn.trigger("click");
      expect(wrapper.emitted("createFolder")).toBeTruthy();
    });

    it("closes FAB after emitting createFile", async () => {
      expect.hasAssertions();
      const wrapper = mountActions("note");
      // Open FAB
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      // Click the mobile file button
      const mobileFileBtn = wrapper.find('button[aria-label="New note"]');
      await mobileFileBtn.trigger("click");
      // FAB should be closed now — should show "Open" again
      const openBtn = wrapper.find('button[aria-label="Open action menu"]');
      expect(openBtn.exists()).toBe(true);
    });
  });
});
