import { describe, expect, it, vi, beforeEach } from "vitest";
import { usePopoverPosition, type PopoverPlacement } from "@/composables/ui/usePopoverPosition";
import { ref, defineComponent, type Ref } from "vue";
import { mount } from "@vue/test-utils";

describe("usePopoverPosition", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setupComposable(
    root: Ref<HTMLElement | null>,
    trigger: Ref<HTMLElement | null>,
    popover: Ref<HTMLElement | null>,
    placement: PopoverPlacement
  ) {
    let result: any;
    const TestComp = defineComponent({
      setup() {
        result = usePopoverPosition(root, trigger, popover, placement);
        return () => null;
      }
    });
    const wrapper = mount(TestComp);
    return { result, wrapper };
  }

  it("initializes off-screen", () => {
    expect.hasAssertions();
    const root = ref<HTMLElement | null>(null);
    const trigger = ref<HTMLElement | null>(null);
    const popover = ref<HTMLElement | null>(null);
    
    const { result, wrapper } = setupComposable(root, trigger, popover, "bottom-start");
    
    expect(result.style.top).toBe("-9999px");
    expect(result.style.left).toBe("-9999px");
    wrapper.unmount();
  });

  it("repositions based on bounding rects", () => {
    expect.hasAssertions();
    const root = ref<HTMLElement | null>(document.createElement("div"));
    const trigger = ref<HTMLElement | null>(document.createElement("button"));
    const popover = ref<HTMLElement | null>(document.createElement("div"));
    
    root.value!.getBoundingClientRect = vi.fn().mockReturnValue({ top: 0, left: 0, width: 1000, height: 1000, right: 1000, bottom: 1000 } as any) as any;
    trigger.value!.getBoundingClientRect = vi.fn().mockReturnValue({ top: 100, left: 100, width: 50, height: 20, right: 150, bottom: 120 } as any) as any;
    popover.value!.getBoundingClientRect = vi.fn().mockReturnValue({ top: 0, left: 0, width: 200, height: 200, right: 200, bottom: 200 } as any) as any;

    Object.defineProperty(window, "innerWidth", { value: 1000, writable: true });
    Object.defineProperty(window, "innerHeight", { value: 1000, writable: true });

    const { result, wrapper } = setupComposable(root, trigger, popover, "bottom-start");
    
    result.reposition();
    
    expect(result.style.top).toBe("124px");
    expect(result.style.left).toBe("100px");
    wrapper.unmount();
  });

  it("clamps to viewport margins if it would go off-screen", () => {
    expect.hasAssertions();
    const root = ref<HTMLElement | null>(document.createElement("div"));
    const trigger = ref<HTMLElement | null>(document.createElement("button"));
    const popover = ref<HTMLElement | null>(document.createElement("div"));
    
    root.value!.getBoundingClientRect = vi.fn().mockReturnValue({ top: 0, left: 0, width: 1000, height: 1000, right: 1000, bottom: 1000 } as any) as any;
    trigger.value!.getBoundingClientRect = vi.fn().mockReturnValue({ top: 100, left: 900, width: 50, height: 20, right: 950, bottom: 120 } as any) as any;
    popover.value!.getBoundingClientRect = vi.fn().mockReturnValue({ top: 0, left: 0, width: 200, height: 200, right: 200, bottom: 200 } as any) as any;

    Object.defineProperty(window, "innerWidth", { value: 1000, writable: true });
    Object.defineProperty(window, "innerHeight", { value: 1000, writable: true });

    const { result, wrapper } = setupComposable(root, trigger, popover, "bottom-start");
    
    result.reposition();
    
    expect(result.style.left).toBe("792px");
    expect(result.style.top).toBe("124px");
    wrapper.unmount();
  });
});
