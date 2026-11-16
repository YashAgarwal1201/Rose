import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, unmount } from "@/components/external/SharedNoteUI.ts";

// Mock the Vue component
vi.mock("@/components/external/SharedNoteUI.vue", () => ({
  default: {
    template: "<div id='mocked-note-ui'>{{ title }}</div>",
    props: ["title", "canvasJSON", "backgroundColor", "backgroundPattern"],
  },
}));

describe("SharedNoteUI.ts Wrapper", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
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

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.innerHTML).toContain("New Note Title");
  });

  it("syncs dark mode from documentElement class", async () => {
    mount(container, {});
    expect(container.classList.contains("dark")).toBe(false);

    document.documentElement.classList.add("dark");
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.classList.contains("dark")).toBe(true);
  });

  it("returns a scoped unmount function for isolated cleanup", () => {
    const { unmount: unmountInstance } = mount(container, { title: "Isolated Note" });
    expect(container.innerHTML).toContain("Isolated Note");

    unmountInstance();
    expect(container.innerHTML).toBe("");
  });

  it("supports multiple instances without collisions", () => {
    const container2 = document.createElement("div");
    document.body.appendChild(container2);

    const inst1 = mount(container, { title: "Note Instance 1" });
    const inst2 = mount(container2, { title: "Note Instance 2" });

    expect(container.innerHTML).toContain("Note Instance 1");
    expect(container2.innerHTML).toContain("Note Instance 2");

    inst1.unmount();
    expect(container.innerHTML).toBe("");
    expect(container2.innerHTML).toContain("Note Instance 2");

    inst2.unmount();
    expect(container2.innerHTML).toBe("");

    if (container2.parentNode) {
      container2.parentNode.removeChild(container2);
    }
  });
});
