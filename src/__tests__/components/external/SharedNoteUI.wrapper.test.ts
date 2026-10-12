import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, unmount } from "@/components/external/SharedNoteUI.ts";

// Mock the Vue component
vi.mock('@/components/external/SharedNoteUI.vue', () => ({
  default: {
    template: "<div id='mocked-note-ui'>{{ title }}</div>",
    props: ["title", "canvasJSON", "backgroundColor", "backgroundPattern"]
  }
}));

describe("SharedNoteUI.ts Wrapper", () => {
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
    const { app } = mount(container, { title: "Test Note" });
    expect(app).toBeDefined();
    expect(container.innerHTML).toContain("Test Note");
    expect(container.innerHTML).toContain("mocked-note-ui");
  });

  it("updates state reactively when update() is called", async () => {
    const { update } = mount(container, { title: "Old Note Title" });
    expect(container.innerHTML).toContain("Old Note Title");

    update({ title: "New Note Title" });
    
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.innerHTML).toContain("New Note Title");
  });

  it("syncs dark mode from documentElement class", async () => {
    mount(container, {});
    expect(container.classList.contains("dark")).toBe(false);

    document.documentElement.classList.add("dark");
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(container.classList.contains("dark")).toBe(true);
  });
});
