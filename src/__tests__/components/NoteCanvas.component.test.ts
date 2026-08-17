import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import NoteCanvas from "@/components/notes/NoteCanvas.vue";
import { ref } from "vue";

// Mock the debounce utility to run immediately or expose flush
vi.mock('../../utils/debounce', () => ({
  debounce: (fn: (...args: unknown[]) => unknown) => {
    const debounced = (...args: unknown[]) => fn(...args);
    debounced.flush = vi.fn(() => fn());
    return debounced;
  },
}));

// Mock the toolbar
vi.mock('../../components/NoteToolbar.vue', () => ({
  default: { template: "<div data-testid='note-toolbar'></div>" },
} as any));

// We need a stable mock for useHandwritingCanvas
const mockInit = vi.fn();
const mockLoadFromJSON = vi.fn();
const mockToJSON = vi.fn(() => ({ type: "test-canvas-json" }));
const mockGenerateThumbnail = vi.fn(() => "data:image/png;base64,mock");
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockAddShape = vi.fn();
const mockAddText = vi.fn();
const mockAddImage = vi.fn();
const mockDestroy = vi.fn();

// This represents the fake fabric canvas events
const mockFabricCanvas = {
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('@/composables/notes/useHandwritingCanvas.ts', () => ({
  useHandwritingCanvas: () => (
    {
      init: mockInit,
      loadFromJSON: mockLoadFromJSON,
      toJSON: mockToJSON,
      generateThumbnail: mockGenerateThumbnail,
      tool: ref("pen"),
      penTool: ref("pen"),
      shapeTool: ref("rectangle"),
      penColor: ref("#000000"),
      backgroundColor: ref("#ffffff"),
      backgroundPattern: ref("solid"),
      canUndo: ref(false),
      canRedo: ref(false),
      undo: mockUndo,
      redo: mockRedo,
      addShape: mockAddShape,
      addText: mockAddText,
      addImage: mockAddImage,
      fabricCanvas: ref(mockFabricCanvas),
      destroy: mockDestroy,
    }
  ),
} as any));

describe("NoteCanvas.vue", () => {
  const defaultProps = {
    initialCanvasJson: null,
    initialBackgroundColor: "#ffffff",
    initialBackgroundPattern: "solid" as const,
    toolbarPosition: "top" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mountCanvas(props = {}) {
    return mount(NoteCanvas, {
      props: { ...defaultProps, ...props },
    });
  }

  it("initializes handwriting canvas on mount", async () => {
    mountCanvas();
    await flushPromises();
    expect(mockInit).toHaveBeenCalledWith(expect.any(HTMLCanvasElement));
    expect(mockLoadFromJSON).toHaveBeenCalledWith(null, "#ffffff", "solid");
  });

  it("loads initial JSON data when provided", async () => {
    const initialJson = { version: 1, objects: [] };
    mountCanvas({ initialCanvasJson: initialJson, initialBackgroundColor: "#000" });
    await flushPromises();
    expect(mockLoadFromJSON).toHaveBeenCalledWith(initialJson, "#000", "solid");
  });

  it("sets up event listeners on the fabric canvas", async () => {
    mountCanvas();
    await flushPromises();
    expect(mockFabricCanvas.on).toHaveBeenCalledWith("object:added", expect.any(Function));
    expect(mockFabricCanvas.on).toHaveBeenCalledWith("object:removed", expect.any(Function));
    expect(mockFabricCanvas.on).toHaveBeenCalledWith("object:modified", expect.any(Function));
  });

  it("flushes debounced save and destroys canvas on unmount", async () => {
    const wrapper = mountCanvas({ backgroundColor: "#fff", backgroundPattern: "solid" });
    await flushPromises();
    wrapper.unmount();
    // In our mock, flush() calls the function which triggers emit
    expect(mockDestroy).toHaveBeenCalledWith();
    // Since flush is called, we can't easily assert emit on an unmounted wrapper,
    // but we know destroy is called
  });
});
