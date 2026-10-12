import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, unmount } from "@/components/external/SharedDocUI.ts";

// Mock the Vue component so we don't have to render Tiptap in the wrapper test
vi.mock('@/components/external/SharedDocUI.vue', () => ({
  default: {
    template: "<div id='mocked-doc-ui'>{{ title }}</div>",
    props: ["title", "contentJSON"]
  }
}));

describe("SharedDocUI.ts Wrapper", () => {
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
    const { app } = mount(container, { title: "Test Doc" });
    expect(app).toBeDefined();
    expect(container.innerHTML).toContain("Test Doc");
    expect(container.innerHTML).toContain("mocked-doc-ui");
  });

  it("updates state reactively when update() is called", async () => {
    const { update } = mount(container, { title: "Old Title" });
    expect(container.innerHTML).toContain("Old Title");

    update({ title: "New Title" });
    
    // Wait for Vue's next tick
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.innerHTML).toContain("New Title");
  });

  it("syncs dark mode from documentElement class", async () => {
    mount(container, {});
    
    // It shouldn't be dark initially
    expect(container.classList.contains("dark")).toBe(false);

    // Simulate host app adding dark mode
    document.documentElement.classList.add("dark");

    // Give MutationObserver a moment to fire
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.classList.contains("dark")).toBe(true);
  });
});
