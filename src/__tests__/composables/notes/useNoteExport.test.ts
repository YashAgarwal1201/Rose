import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useNoteExport } from "@/composables/notes/useNoteExport";
import { ref } from "vue";
import type { Canvas } from "fabric";

describe("useNoteExport", () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:fake-url");
    mockRevokeObjectURL = vi.fn();
    
    global.URL.createObjectURL = mockCreateObjectURL as any;
    global.URL.revokeObjectURL = mockRevokeObjectURL as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports as PNG", () => {
    expect.hasAssertions();
    const mockToDataURL = vi.fn().mockReturnValue("data:image/png;base64,...");
    const canvas = ref<Canvas | null>({ toDataURL: mockToDataURL } as unknown as Canvas);
    const title = ref("My Note");
    const isOpen = ref(true);
    
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") return { click: mockClick } as any;
      return (document.createElement as any).getMockImplementation()?.(tagName);
    });

    const { exportAsPng } = useNoteExport(canvas as any, title, isOpen);
    exportAsPng();

    expect(mockToDataURL).toHaveBeenCalledWith({ format: "png", multiplier: 1 });
    expect(mockClick).toHaveBeenCalled();
    expect(isOpen.value).toBeFalsy();
  });

  it("exports as JPEG", () => {
    expect.hasAssertions();
    const mockToDataURL = vi.fn().mockReturnValue("data:image/jpeg;base64,...");
    const canvas = ref<Canvas | null>({ toDataURL: mockToDataURL } as unknown as Canvas);
    const title = ref("My Note");
    const isOpen = ref(true);
    
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") return { click: mockClick } as any;
      return (document.createElement as any).getMockImplementation()?.(tagName);
    });

    const { exportAsJpeg } = useNoteExport(canvas as any, title, isOpen);
    exportAsJpeg();

    expect(mockToDataURL).toHaveBeenCalledWith({ format: "jpeg", quality: 0.9, multiplier: 1 });
    expect(mockClick).toHaveBeenCalled();
    expect(isOpen.value).toBeFalsy();
  });

  it("exports as SVG", () => {
    expect.hasAssertions();
    const mockToSVG = vi.fn().mockReturnValue("<svg></svg>");
    const canvas = ref<Canvas | null>({ toSVG: mockToSVG } as unknown as Canvas);
    const title = ref("My Note");
    const isOpen = ref(true);
    
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") return { click: mockClick } as any;
      return (document.createElement as any).getMockImplementation()?.(tagName);
    });

    const { exportAsSvg } = useNoteExport(canvas as any, title, isOpen);
    exportAsSvg();

    expect(mockToSVG).toHaveBeenCalled();
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
    expect(isOpen.value).toBeFalsy();
  });

  it("does nothing if canvas is not initialized", () => {
    expect.hasAssertions();
    const canvas = ref<Canvas | null>(null);
    const title = ref("My Note");
    const isOpen = ref(true);

    const { exportAsPng } = useNoteExport(canvas as any, title, isOpen);
    exportAsPng();
    expect(isOpen.value).toBeTruthy(); // still true
  });
});
