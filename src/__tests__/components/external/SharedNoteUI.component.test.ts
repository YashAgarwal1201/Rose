import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import SharedNoteUI from "@/components/external/SharedNoteUI.vue";

// Mock NoteCanvas to avoid rendering fabric.js in JSDom
vi.mock(import('@/components/notes/NoteCanvas.vue'), () => ({
  default: {
    template: "<div data-testid='note-canvas' @click='triggerChange'></div>",
    props: ["initialCanvasJson", "initialBackgroundColor", "initialBackgroundPattern", "toolbarPosition", "noteTitle"],
    methods: {
      triggerChange() {
        (this as any).$emit('change', { objects: [] }, '#ff0000', 'dots', 'data:image/png;base64,...');
      }
    }
  },
} as any));

// Mock useToolbarPosition
vi.mock(import('@/composables/ui/useToolbarPosition.ts'), () => ({
  useToolbarPosition: () => ({
    effectivePosition: { value: "top" }
  }),
} as any));

describe("SharedNoteUI.vue", () => {
  it("renders correctly with default props", () => {
    const wrapper = mount(SharedNoteUI);
    const canvas = wrapper.find('[data-testid="note-canvas"]');
    expect(canvas.exists()).toBe(true);
  });

  it("passes props correctly to NoteCanvas", () => {
    const canvasJSON = { version: "1.0", objects: [] };
    const wrapper = mount(SharedNoteUI, {
      props: {
        canvasJSON,
        backgroundColor: "#123456",
        backgroundPattern: "grid",
        title: "Test Note"
      }
    });

    const canvas = wrapper.getComponent('[data-testid="note-canvas"]') as any;
    expect(canvas.exists()).toBe(true);
    expect(canvas.props('initialBackgroundColor')).toBe('#123456');
    expect(canvas.props('initialBackgroundPattern')).toBe('grid');
    expect(canvas.props('noteTitle')).toBe('Test Note');
  });

  it("emits 'change' when NoteCanvas emits 'change'", async () => {
    const wrapper = mount(SharedNoteUI);
    
    // Trigger our mock method
    const canvas = wrapper.find('[data-testid="note-canvas"]');
    await canvas.trigger('click');

    const changeEvents = wrapper.emitted("change");
    expect(changeEvents).toBeTruthy();
    expect(changeEvents![0]).toEqual([
      { objects: [] }, 
      '#ff0000', 
      'dots', 
      'data:image/png;base64,...'
    ]);
  });
});
