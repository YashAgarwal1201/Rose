import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useToolbarPosition } from "@/composables/ui/useToolbarPosition";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";

describe("useToolbarPosition", () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    localStorage.clear();
    originalInnerWidth = window.innerWidth;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("initializes with top as default", () => {
    expect.hasAssertions();
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    
    const TestComponent = defineComponent({
      setup() {
        return useToolbarPosition();
      },
      template: "<div></div>",
    });
    
    const wrapper = mount(TestComponent);
    expect(wrapper.vm.savedPosition).toBe("top");
    expect(wrapper.vm.effectivePosition).toBe("top");
    expect(wrapper.vm.isMobile).toBeFalsy();
    
    wrapper.unmount();
  });

  it("forces bottom position on mobile, but retains saved position", async () => {
    expect.hasAssertions();
    Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
    
    const TestComponent = defineComponent({
      setup() {
        return useToolbarPosition();
      },
      template: "<div></div>",
    });
    
    const wrapper = mount(TestComponent);
    
    // Check initial state
    expect(wrapper.vm.isMobile).toBeTruthy();
    expect(wrapper.vm.effectivePosition).toBe("bottom");
    expect(wrapper.vm.savedPosition).toBe("top");
    
    // Change saved position to left
    wrapper.vm.setPosition("left");
    
    // effective should still be bottom, saved should be left
    expect(wrapper.vm.savedPosition).toBe("left");
    expect(wrapper.vm.effectivePosition).toBe("bottom");
    expect(localStorage.getItem("doc-toolbar-position")).toBe("left");
    
    // Resize to desktop
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    
    expect(wrapper.vm.isMobile).toBeFalsy();
    expect(wrapper.vm.effectivePosition).toBe("left"); // Now reflects saved
    
    wrapper.unmount();
  });
});
