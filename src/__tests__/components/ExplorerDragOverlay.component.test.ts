// src/__tests__/components/ExplorerDragOverlay.component.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { ListIcon } from "@lucide/vue";
import ExplorerDragOverlay from "@/components/explorer/ExplorerDragOverlay.vue";

const state = vi.hoisted(() => ({
  activeRef: null as any,
  dragOperation: { source: null } as any,
}));

vi.mock(import('@dnd-kit/vue'), async (importOriginal) => {
  const actual = await importOriginal();
  const vue = await import('vue');
  
  state.activeRef = vue.ref(false);
  
  return {
    ...actual,
    useDragOverlay: vi.fn(() => ({ active: state.activeRef })),
    useDragOperation: vi.fn(() => state.dragOperation),
    DragOverlay: {
      template: '<div><slot v-if="$attrs.active !== false" /></div>'
    }
  };
});

function mountOverlay(props = {}) {
  return mount(ExplorerDragOverlay, {
    props: {
      fileIcon: ListIcon,
      fileLabel: "list",
      ...props
    }
  });
}

describe("ExplorerDragOverlay", () => {
  beforeEach(() => {
    state.activeRef.value = false;
    state.dragOperation = {
      source: null
    };
  });

  it("renders nothing when inactive", () => {
    state.activeRef.value = false;
    state.dragOperation.source = null;
    const wrapper = mountOverlay();
    expect(wrapper.find(".flex").exists()).toBe(false);
  });

  it("renders the ghost overlay when active", async () => {
    state.activeRef.value = true;
    state.dragOperation.source = {
      data: { name: "Test File", kind: "file", id: "1" }
    };
    const wrapper = mountOverlay();
    await wrapper.vm.$nextTick();
    
    // Using string matching to verify it rendered something meaningful
    expect(wrapper.text()).toContain("Test File");
  });

  it("renders the correct name for folders", async () => {
    state.activeRef.value = true;
    state.dragOperation.source = {
      data: { name: "My Folder", kind: "folder", id: "f1" }
    };
    
    const wrapper = mountOverlay();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("My Folder");
  });
});
