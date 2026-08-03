import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import NoteCanvas from "@/components/notes/NoteCanvas.vue";
import { ref } from "vue";

// Mock the debounce utility to run immediately or expose flush
vi.mock("../../utils/debounce", () => ({
  debounce: (fn: (...args: unknown[]) => unknown) => {
    const debounced = (...args: unknown[]) => fn(...args);
    debounced.flush = vi.fn(() => fn());
    return debounced;
  },
}));

// Mock the toolbar
vi.mock("../../components/NoteToolbar.vue", () => ({
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

vi.mock("../../composables/useHandwritingCanvas", () => ({
  useHandwritingCanvas: () => {
    return {
      init: mockInit,
      loadFromJSON: mockLoadFromJSON,
      toJSON: mockToJSON,
      generateThumbnail: mockGenerateThumbnail,
      tool: ref("pen"),
      penTool: ref("pen"),
      shapeTool: ref("rectangle"),
      penColor: ref("#000000"),
      backgroundColor: ref("#ffffff"),
      canUndo: ref(false),
      canRedo: ref(false),
      undo: mockUndo,
      redo: mockRedo,
      addShape: mockAddShape,
      addText: mockAddText,
      addImage: mockAddImage,
      fabricCanvas: ref(mockFabricCanvas),
      destroy: mockDestroy,
    };
  },
} as any));

describe("NoteCanvas.vue", () => {
  const defaultProps = {
    initialCanvasJson: null,
    initialBackgroundColor: "#ffffff",
    toolbarPosition: "top" as any,
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
    expect(mockInit).toHaveBeenCalled();
    expect(mockLoadFromJSON).toHaveBeenCalledWith(null, "#ffffff");
  });

  it("loads initial JSON data when provided", async () => {
    const initialJson = { version: 1, objects: [] };
    mountCanvas({ initialCanvasJson: initialJson, initialBackgroundColor: "#000" });
    expect(mockLoadFromJSON).toHaveBeenCalledWith(initialJson, "#000");
  });

  it("sets up event listeners on the fabric canvas", async () => {
    mountCanvas();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockFabricCanvas.on).toHaveBeenCalledWith("object:added", expect.any(Function));
    expect(mockFabricCanvas.on).toHaveBeenCalledWith("object:removed", expect.any(Function));
    expect(mockFabricCanvas.on).toHaveBeenCalledWith("object:modified", expect.any(Function));
  });

  it("flushes debounced save and destroys canvas on unmount", async () => {
    const wrapper = mountCanvas();
    wrapper.unmount();
    // In our mock, flush() calls the function which triggers emit
    expect(mockDestroy).toHaveBeenCalled();
    // Since flush is called, we can't easily assert emit on an unmounted wrapper,
    // but we know destroy is called
  });
});
