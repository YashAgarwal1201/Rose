import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import NoteToolbar from "../../components/NoteToolbar.vue";

// Mock the popover position composable
vi.mock("../../composables/usePopoverPosition", () => ({
  usePopoverPosition: () => ({
    style: { top: "0px", left: "0px" },
    open: vi.fn(),
    close: vi.fn(),
  }),
}));

describe("NoteToolbar.vue", () => {
  const defaultProps = {
    tool: "pen" as any,
    penTool: "pen" as any,
    shapeTool: "rectangle" as any,
    penColor: "#ef4444",
    backgroundColor: "#ffffff",
    canUndo: true,
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
    it("opens the pen popover and emits update:penTool", async () => {
      const wrapper = mountToolbar();
      const penBtn = wrapper.find('button[title="Pen"]');
      await penBtn.trigger("click");
      // popover should be open now, find the marker preset
      const popoverBtns = wrapper.findAll("button").filter(b => b.text().includes("marker"));
      await popoverBtns[0]?.trigger("click");
      expect(wrapper.emitted("update:penTool")?.[0]).toStrictEqual(["marker"]);
    });

    it("opens the shape popover and emits update:shapeTool", async () => {
      const wrapper = mountToolbar();
      await wrapper.find('button[title="Shapes"]').trigger("click");
      const ellipseBtn = wrapper.findAll("button").filter(b => b.text().includes("Ellipse"));
      await ellipseBtn[0]?.trigger("click");
      expect(wrapper.emitted("update:shapeTool")?.[0]).toStrictEqual(["ellipse"]);
    });

    it("opens the color popover and emits update:penColor", async () => {
      const wrapper = mountToolbar();
      await wrapper.find('button[title="Pen color"]').trigger("click");
      // Find a color swatch button
      const allBtns = wrapper.findAll("button");
      const colorBtn = allBtns.find(b => b.attributes("style")?.includes("background-color: rgb(34, 197, 94)")); 
      await colorBtn?.trigger("click");
      expect(wrapper.emitted("update:penColor")?.[0]).toStrictEqual(["#22c55e"]);
    });

    it("opens the background popover and emits update:backgroundColor", async () => {
      const wrapper = mountToolbar();
      await wrapper.find('button[title="Page background"]').trigger("click");
      const bgBtn = wrapper.findAll("button").filter(b => b.text().includes("Cream"));
      await bgBtn[0]?.trigger("click");
      expect(wrapper.emitted("update:backgroundColor")?.[0]).toStrictEqual(["#fdf6e3"]);
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
