import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useKeyboardShortcuts } from "@/composables/app/useKeyboardShortcuts";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("registers and triggers the handler on matching keydown", () => {
    expect.hasAssertions();
    const handler = vi.fn();
    
    // We use a dummy component to mount the composable so onMounted/onUnmounted fire
    const TestComponent = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: "s", ctrl: true, handler }]);
        return () => null;
      },
    });

    const wrapper = mount(TestComponent);

    // Simulate keydown on window
    const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    // After unmount, it should not trigger
    window.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not trigger if modifiers do not match", () => {
    expect.hasAssertions();
    const handler = vi.fn();
    
    const TestComponent = defineComponent({
      setup() {
        useKeyboardShortcuts([
          { key: "a", shift: true, handler },
        ]);
        return () => null;
      },
    });

    const wrapper = mount(TestComponent);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", shiftKey: false }));
    expect(handler).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", shiftKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it("skips input elements when skipInInput is true", () => {
    expect.hasAssertions();
    const handler = vi.fn();
    
    const TestComponent = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: "b", handler, skipInInput: true }]);
        return () => null;
      },
    });

    const wrapper = mount(TestComponent);

    // Create an input and focus it
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
    
    // Handler should NOT have been called because input is focused
    expect(handler).not.toHaveBeenCalled();

    // Blur input, should now be called
    input.blur();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
    expect(handler).toHaveBeenCalledTimes(1);

    input.remove();
    wrapper.unmount();
  });

  it("prevents default if handler does not return false", () => {
    expect.hasAssertions();
    const handler = vi.fn(); // Returns undefined
    
    const TestComponent = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: "x", handler }]);
        return () => null;
      },
    });

    const wrapper = mount(TestComponent);

    const event = new KeyboardEvent("keydown", { key: "x", cancelable: true });
    vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();

    wrapper.unmount();
  });

  it("does not prevent default if handler returns false", () => {
    expect.hasAssertions();
    const handler = vi.fn().mockReturnValue(false);
    
    const TestComponent = defineComponent({
      setup() {
        useKeyboardShortcuts([{ key: "y", handler }]);
        return () => null;
      },
    });

    const wrapper = mount(TestComponent);

    const event = new KeyboardEvent("keydown", { key: "y", cancelable: true });
    vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
