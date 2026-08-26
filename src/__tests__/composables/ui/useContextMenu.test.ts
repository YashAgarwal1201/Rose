import { describe, expect, it, vi } from "vitest";
import { useContextMenu } from "@/composables/ui/useContextMenu";

describe("useContextMenu", () => {
  it("initializes with default values", () => {
    expect.hasAssertions();
    const { isOpen, activeItem, x, y } = useContextMenu();
    expect(isOpen.value).toBeFalsy();
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
    
    expect(isOpen.value).toBeTruthy();
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
    
    expect(isOpen.value).toBeTruthy();
    expect(x.value).toBe(150);
    expect(y.value).toBe(250);
  });

  it("closes and resets state", () => {
    expect.hasAssertions();
    const onClose = vi.fn();
    const { open, close, isOpen, activeItem } = useContextMenu({ onClose });
    
    open("test-item", new MouseEvent("click"));
    expect(isOpen.value).toBeTruthy();
    
    close();
    
    expect(isOpen.value).toBeFalsy();
    expect(activeItem.value).toBeNull();
    expect(onClose).toHaveBeenCalled();
  });
});
