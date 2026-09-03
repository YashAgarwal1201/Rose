import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useDocExport } from "@/composables/docs/useDocExport";
import { ref } from "vue";
import type { Editor } from "@tiptap/core";

describe("useDocExport", () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockWindowOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:fake-url");
    mockRevokeObjectURL = vi.fn();
    mockWindowOpen = vi.fn().mockReturnValue({});
    
    global.URL.createObjectURL = mockCreateObjectURL as any;
    global.URL.revokeObjectURL = mockRevokeObjectURL as any;
    window.open = mockWindowOpen as any;
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("exports as HTML and triggers download", () => {
    expect.hasAssertions();
    const editor = ref<Editor | undefined>({ getHTML: () => "<p>Hello</p>" } as unknown as Editor);
    const title = ref("My Doc");
    const isOpen = ref(true);
    
    // Mock anchor click
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return { click: mockClick } as any;
      }
      return (document.createElement as any).getMockImplementation()?.(tagName);
    });

    const { exportAsHtml } = useDocExport(editor as any, title, isOpen);
    exportAsHtml();

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
    expect(isOpen.value).toBeFalsy();
  });

  it("exports as PDF and triggers window open", () => {
    expect.hasAssertions();
    const editor = ref<Editor | undefined>({ getHTML: () => "<p>PDF Content</p>" } as unknown as Editor);
    const title = ref("My PDF");
    const isOpen = ref(true);
    
    const { exportAsPdf } = useDocExport(editor as any, title, isOpen);
    exportAsPdf();

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockWindowOpen).toHaveBeenCalledWith("blob:fake-url", "_blank");
    
    // Revoke happens on timeout
    vi.advanceTimersByTime(11000);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
    expect(isOpen.value).toBeFalsy();
  });

  it("does nothing if editor or title is missing", () => {
    expect.hasAssertions();
    const editor = ref<Editor | undefined>(undefined);
    const title = ref("Title");
    const isOpen = ref(true);
    
    const { exportAsText } = useDocExport(editor as any, title, isOpen);
    exportAsText();
    
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
    expect(isOpen.value).toBeTruthy();
  });
});
