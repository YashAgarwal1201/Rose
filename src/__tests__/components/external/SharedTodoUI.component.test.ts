import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import SharedTodoUI from "@/components/external/SharedTodoUI.vue";
import type { TodoItem } from "@/components/external/SharedTodoUI.vue";

// Mock the context menu to prevent errors during rendering
vi.mock(import('@/composables/ui/useContextMenu'), () => ({
  useContextMenu: () => ({
    isOpen: { value: false },
    x: { value: 0 },
    y: { value: 0 },
    activeItem: { value: null },
    open: vi.fn(),
    close: vi.fn(),
  }),
  vLongPress: {
    mounted: vi.fn(),
    unmounted: vi.fn()
  }
} as any));

describe("SharedTodoUI.vue", () => {
  it("renders correctly with empty items", () => {
    const wrapper = mount(SharedTodoUI, {
      props: { items: [] },
    });
    expect(wrapper.text()).toContain("No todos yet");
  });

  it("renders a list of todo items", () => {
    const items: TodoItem[] = [
      { id: "1", title: "Buy groceries", done: false },
      { id: "2", title: "Clean the house", done: true },
    ];
    const wrapper = mount(SharedTodoUI, {
      props: { items },
    });
    expect(wrapper.text()).toContain("Buy groceries");
    expect(wrapper.text()).toContain("Clean the house");
  });

  it("emits 'change' when adding a new todo", async () => {
    const wrapper = mount(SharedTodoUI, {
      props: { items: [] },
    });

    const input = wrapper.find('input[placeholder="Add a todo..."]');
    await input.setValue("New Task");
    await input.trigger("keyup.enter");

    const emitted = wrapper.emitted("change");
    expect(emitted).toBeTruthy();
    const newItems = emitted![0]![0] as TodoItem[];
    expect(newItems.length).toBe(1);
    expect(newItems[0]?.title).toBe("New Task");
    expect(newItems[0]?.done).toBe(false);
  });

  it("emits 'change' when toggling done status", async () => {
    const items: TodoItem[] = [{ id: "1", title: "Task", done: false }];
    const wrapper = mount(SharedTodoUI, {
      props: { items },
    });

    // Find the toggle button
    const toggleButton = wrapper.find('button[aria-label="Mark as completed"]');
    await toggleButton.trigger("click");

    const emitted = wrapper.emitted("change");
    expect(emitted).toBeTruthy();
    const newItems = emitted![0]![0] as TodoItem[];
    expect(newItems[0]?.done).toBe(true);
  });

  it("emits 'change' when marking all as done", async () => {
    const items: TodoItem[] = [
      { id: "1", title: "Task 1", done: false },
      { id: "2", title: "Task 2", done: false },
    ];
    const wrapper = mount(SharedTodoUI, {
      props: { items },
    });

    const buttons = wrapper.findAll("button");
    const markAllButton = buttons.find((b) => b.text().includes("Mark all done"));
    expect(markAllButton).toBeDefined();

    await markAllButton!.trigger("click");

    const emitted = wrapper.emitted("change");
    expect(emitted).toBeTruthy();
    const newItems = emitted![0]![0] as TodoItem[];
    expect(newItems.every((i) => i.done)).toBe(true);
  });
});
