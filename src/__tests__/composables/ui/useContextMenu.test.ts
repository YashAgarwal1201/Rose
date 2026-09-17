import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { useContextMenu, vLongPress } from "@/composables/ui/useContextMenu";

describe("useContextMenu", () => {
  it("initializes with default values", () => {
    expect.hasAssertions();
    const { isOpen, activeItem, x, y } = useContextMenu();
    expect(isOpen.value).toBe(false);
    expect(activeItem.value).toBeNull();
    expect(x.value).toBe(0);
    expect(y.value).toBe(0);
  });

  it("opens with MouseEvent and sets coordinates", () => {
    expect.hasAssertions();
    const onOpen = vi.fn();
    const { open, isOpen, activeItem, x, y } = useContextMenu({ onOpen });
    
    const mockEvent = new MouseEvent("contextmenu", {
      clientX: 100,
      clientY: 200,
    });
    
    const item = { id: 1, name: "Test Item" };
    open(item, mockEvent);
    
    expect(isOpen.value).toBe(true);
    expect(activeItem.value).toStrictEqual(item);
    expect(x.value).toBe(100);
    expect(y.value).toBe(200);
    expect(onOpen).toHaveBeenCalledWith(item);
  });

  it("opens with HTMLElement and sets coordinates based on bounding rect", () => {
    expect.hasAssertions();
    const { open, isOpen, x, y } = useContextMenu();
    
    const mockElement = document.createElement("button");
    mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
      right: 150,
      bottom: 250,
    });
    
    open("test-item", mockElement);
    
    expect(isOpen.value).toBe(true);
    expect(x.value).toBe(150);
    expect(y.value).toBe(250);
  });

  it("closes and resets state", () => {
    expect.hasAssertions();
    const onClose = vi.fn();
    const { open, close, isOpen, activeItem } = useContextMenu({ onClose });
    
    open("test-item", new MouseEvent("click"));
    expect(isOpen.value).toBe(true);
    
    close();
    
    expect(isOpen.value).toBe(false);
    expect(activeItem.value).toBeNull();
    expect(onClose).toHaveBeenCalledWith();
  });
});

describe("vLongPress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function mountDirective(handler: any) {
    return mount(
      {
        template: '<div v-long-press="handler" class="test-div"></div>',
        props: ['handler'],
      },
      {
        global: { directives: { longPress: vLongPress } },
        props: { handler },
      }
    );
  }

  it("triggers handler and dispatches pointercancel after 500ms of holding still", async () => {
    const handler = vi.fn();
    const wrapper = mountDirective(handler);
    
    // Listen for pointercancel
    let cancelFired = false;
    wrapper.element.addEventListener("pointercancel", () => {
      cancelFired = true;
    });

    const pointerDownEvent = new PointerEvent("pointerdown", { pointerType: "touch", clientX: 10, clientY: 10 });
    wrapper.element.dispatchEvent(pointerDownEvent);

    vi.advanceTimersByTime(499);
    expect(handler).not.toHaveBeenCalled();
    expect(cancelFired).toBe(false);

    vi.advanceTimersByTime(1); // 500ms reached
    expect(handler).toHaveBeenCalled();
    expect(cancelFired).toBe(true);
  });

  it("cancels the timer if pointer moves more than 10px", async () => {
    const handler = vi.fn();
    const wrapper = mountDirective(handler);

    const pointerDownEvent = new PointerEvent("pointerdown", { pointerType: "touch", clientX: 10, clientY: 10 });
    wrapper.element.dispatchEvent(pointerDownEvent);

    // Move more than 10px
    const pointerMoveEvent = new PointerEvent("pointermove", { pointerType: "touch", clientX: 25, clientY: 10 });
    wrapper.element.dispatchEvent(pointerMoveEvent);

    vi.advanceTimersByTime(600);
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores non-touch pointer events", async () => {
    const handler = vi.fn();
    const wrapper = mountDirective(handler);

    const pointerDownEvent = new PointerEvent("pointerdown", { pointerType: "mouse", clientX: 10, clientY: 10 });
    wrapper.element.dispatchEvent(pointerDownEvent);

    vi.advanceTimersByTime(600);
    expect(handler).not.toHaveBeenCalled();
  });
});
