import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import NoteToolbar from "@/components/notes/NoteToolbar.vue";

// Mock the popover position composable
vi.mock('../../composables/usePopoverPosition', () => ({
  usePopoverPosition: () => ({
    style: { top: "0px", left: "0px" },
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

describe("NoteToolbar.vue", () => {
  const defaultProps = {
    tool: "select" as any,
    penTool: "pen" as any,
    shapeTool: "rectangle" as any,
    penColor: "#000000",
    backgroundColor: "#ffffff",
    backgroundPattern: "solid" as any,
    canUndo: false,
    canRedo: false,
    position: "top" as any,
  };

  function mountToolbar(props = {}) {
    return mount(NoteToolbar, {
      props: { ...defaultProps, ...props },
    });
  }

  describe("tool selection", () => {
    it("emits update:tool when a standard tool is clicked", async () => {
      const wrapper = mountToolbar();
      await wrapper.find('button[title="Eraser"]').trigger("click");
      expect(wrapper.emitted("update:tool")?.[0]).toStrictEqual(["eraser"]);
    });

    it("emits update:tool when the pen tool is clicked", async () => {
      const wrapper = mountToolbar();
      await wrapper.find('button[title="Pen"]').trigger("click");
      expect(wrapper.emitted("update:tool")?.[0]).toStrictEqual(["pen"]);
    });

    it("emits triggerImagePick when the insert image button is clicked", async () => {
      const wrapper = mountToolbar();
      await wrapper.find('button[title="Insert image"]').trigger("click");
      expect(wrapper.emitted("triggerImagePick")).toBeTruthy();
    });
  });

  describe("popovers", () => {
    it("opens the pen popover when pen tool is clicked again", async () => {
      const wrapper = mountToolbar({ tool: "pen", penTool: "pen" });
      const penBtn = wrapper.find('button[title="Pen"]');
      await penBtn.trigger("click");
      expect(wrapper.html()).toContain("Color"); // Color picker renders
    });

    it("opens the shape popover and emits update:shapeTool", async () => {
      const wrapper = mountToolbar();
      await wrapper.find('button[title="Shapes"]').trigger("click");
      const ellipseBtn = wrapper.findAll("button").filter(b => b.text().includes("Ellipse"));
      await ellipseBtn[0]?.trigger("click");
      expect(wrapper.emitted("update:shapeTool")?.[0]).toStrictEqual(["ellipse"]);
    });

    it("opens the background popover when page background button is clicked", async () => {
      const wrapper = mountToolbar();
      await wrapper.find('button[title="Page background"]').trigger("click");
      expect(wrapper.html()).toContain("Color"); // Color picker renders
    });
  });

  describe("undo/redo", () => {
    it("emits undo when the undo button is clicked and canUndo is true", async () => {
      const wrapper = mountToolbar({ canUndo: true });
      await wrapper.find('button[title="Undo"]').trigger("click");
      expect(wrapper.emitted("undo")).toBeTruthy();
    });

    it("does not emit undo when the undo button is disabled", async () => {
      const wrapper = mountToolbar({ canUndo: false });
      await wrapper.find('button[title="Undo"]').trigger("click");
      expect(wrapper.emitted("undo")).toBeFalsy();
    });

    it("emits redo when the redo button is clicked and canRedo is true", async () => {
      const wrapper = mountToolbar({ canRedo: true });
      await wrapper.find('button[title="Redo"]').trigger("click");
      expect(wrapper.emitted("redo")).toBeTruthy();
    });
  });
});
