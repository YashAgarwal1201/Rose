// src/__tests__/components/MixedExplorerActions.component.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import MixedExplorerActions from "@/components/explorer/MixedExplorerActions.vue";

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();

vi.mock(import('@vueuse/integrations/useFocusTrap'), () => ({
  useFocusTrap: vi.fn(() => ({
    activate: mockActivate,
    deactivate: mockDeactivate
  }))
}));

function mountActions() {
  return mount(MixedExplorerActions);
}

describe("MixedExplorerActions", () => {
  beforeEach(() => {
    mockActivate.mockClear();
    mockDeactivate.mockClear();
  });

  describe("rendering", () => {
    it("renders the desktop 'New folder' button", () => {
      const wrapper = mountActions();
      const folderBtn = wrapper.findAll("button").find(b => b.text().includes("New folder"))!;
      expect(folderBtn).toBeDefined();
    });

    it("renders the mobile FAB toggle button", () => {
      const wrapper = mountActions();
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      expect(fabBtn.exists()).toBe(true);
    });
  });

  describe("desktop button emits", () => {
    it("emits createFolder when the desktop New folder button is clicked", async () => {
      const wrapper = mountActions();
      const folderBtn = wrapper.findAll("button").find(b => b.text().includes("New folder"))!;
      await folderBtn.trigger("click");
      expect(wrapper.emitted("createFolder")).toBeTruthy();
    });

    it("emits createDoc when the desktop New doc button is clicked", async () => {
      const wrapper = mountActions();
      // First open the popover
      const newFileBtn = wrapper.findAll("button").find(b => b.text().includes("New file"))!;
      await newFileBtn.trigger("click");
      // Then click Document
      const docBtn = wrapper.findAll("button").find(b => b.text().includes("New doc"))!;
      await docBtn.trigger("click");
      expect(wrapper.emitted("createDoc")).toBeTruthy();
    });
    
    it("emits createNote when the desktop Note button is clicked", async () => {
      const wrapper = mountActions();
      const newFileBtn = wrapper.findAll("button").find(b => b.text().includes("New file"))!;
      await newFileBtn.trigger("click");
      const noteBtn = wrapper.findAll("button").find(b => b.text().includes("New note"))!;
      await noteBtn.trigger("click");
      expect(wrapper.emitted("createNote")).toBeTruthy();
    });
  });

  describe("FAB toggle and Focus Trap", () => {
    it("opens the speed-dial on FAB click and activates focus trap", async () => {
      const wrapper = mountActions();
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      
      const closeBtn = wrapper.find('button[aria-label="Close action menu"]');
      expect(closeBtn.exists()).toBe(true);
      
      await wrapper.vm.$nextTick(); // Wait for activate promise
      expect(mockActivate).toHaveBeenCalled();
    });

    it("closes the speed-dial on second FAB click and deactivates focus trap", async () => {
      const wrapper = mountActions();
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      
      const closeBtn = wrapper.find('button[aria-label="Close action menu"]');
      await closeBtn.trigger("click");
      
      const openBtn = wrapper.find('button[aria-label="Open action menu"]');
      expect(openBtn.exists()).toBe(true);
      expect(mockDeactivate).toHaveBeenCalled();
    });

    it("emits createTodo from the mobile speed-dial button", async () => {
      const wrapper = mountActions();
      const fabBtn = wrapper.find('button[aria-label="Open action menu"]');
      await fabBtn.trigger("click");
      
      const mobileTodoBtn = wrapper.findAll('button').find(b => b.attributes('aria-label') === 'New list')!;
      await mobileTodoBtn.trigger("click");
      expect(wrapper.emitted("createTodo")).toBeTruthy();
      expect(mockDeactivate).toHaveBeenCalled(); // Because fab closes
    });
  });
});
