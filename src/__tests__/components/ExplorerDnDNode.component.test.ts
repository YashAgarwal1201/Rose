// src/__tests__/components/ExplorerDnDNode.component.test.ts
import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ExplorerDnDNode from "@/components/explorer/ExplorerDnDNode.vue";

const state = vi.hoisted(() => ({
  isDragging: false,
  isDropTarget: false,
}));

vi.mock(import('@dnd-kit/vue'), async (importOriginal) => {
  const actual = await importOriginal();
  const vue = await import('vue');
  
  return {
    ...actual,
    useDraggable: vi.fn(() => ({ isDragging: vue.ref(state.isDragging) })),
    useDroppable: vi.fn(() => ({ isDropTarget: vue.ref(state.isDropTarget) })),
  };
});

function mountNode(props = {}) {
  return mount(ExplorerDnDNode, {
    props: {
      id: "test-node",
      data: { kind: "folder" },
      ...props
    },
    slots: {
      default: '<div class="slotted-content">Slot</div>'
    }
  });
}

describe("ExplorerDnDNode", () => {
  it("renders as a div by default with slot content", () => {
    const wrapper = mountNode();
    expect(wrapper.element.tagName.toLowerCase()).toBe("div");
    expect(wrapper.find(".slotted-content").exists()).toBe(true);
  });

  it("renders as the provided 'as' component", () => {
    const wrapper = mountNode({ as: "li" });
    expect(wrapper.html()).toContain("<li");
  });

  it("applies draggingClass when isDragging is true", async () => {
    state.isDragging = false;
    let wrapper = mountNode({ draggingClass: "is-dragging-test" });
    expect(wrapper.classes()).not.toContain("is-dragging-test");

    state.isDragging = true;
    wrapper = mountNode({ draggingClass: "is-dragging-test" });
    console.log("DRAG WRAPPER HTML:", wrapper.html());
    expect(wrapper.classes()).toContain("is-dragging-test");
  });

  it("applies dropTargetClass when isDropTarget is true", async () => {
    state.isDropTarget = false;
    let wrapper = mountNode({ dropTargetClass: "is-drop-target-test" });
    expect(wrapper.classes()).not.toContain("is-drop-target-test");

    state.isDropTarget = true;
    wrapper = mountNode({ dropTargetClass: "is-drop-target-test" });
    expect(wrapper.classes()).toContain("is-drop-target-test");
  });
});
