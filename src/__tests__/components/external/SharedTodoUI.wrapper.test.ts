import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, unmount } from "@/components/external/SharedTodoUI.ts";

// Mock the Vue component
vi.mock('@/components/external/SharedTodoUI.vue', () => ({
  default: {
    template: "<div id='mocked-todo-ui'><span v-for='item in items' :key='item.id'>{{ item.title }}</span></div>",
    props: ["items"]
  }
}));

describe("SharedTodoUI.ts Wrapper", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    document.documentElement.className = "";
    document.body.className = "";
    vi.clearAllMocks();
  });

  it("mounts the Vue application to the given element", () => {
    const { app } = mount(container, { items: [{ id: "1", title: "Test Todo", done: false }] });
    expect(app).toBeDefined();
    expect(container.innerHTML).toContain("Test Todo");
    expect(container.innerHTML).toContain("mocked-todo-ui");
  });

  it("updates state reactively when update() is called", async () => {
    const { update } = mount(container, { items: [{ id: "1", title: "Old Todo", done: false }] });
    expect(container.innerHTML).toContain("Old Todo");

    update({ items: [{ id: "1", title: "New Todo", done: false }] });
    
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.innerHTML).toContain("New Todo");
    expect(container.innerHTML).not.toContain("Old Todo");
  });

  it("syncs dark mode from documentElement class", async () => {
    mount(container, {});
    expect(container.classList.contains("dark")).toBe(false);

    document.documentElement.classList.add("dark");
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.classList.contains("dark")).toBe(true);
  });
});
