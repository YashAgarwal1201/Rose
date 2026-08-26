import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog.vue";
import { useConfirm } from "@/composables/ui/useConfirm";
import { nextTick, ref } from "vue";
import { createPinia } from "pinia";

vi.mock("@/composables/ui/useConfirm", () => {
  return {
    useConfirm: vi.fn()
  };
});
vi.mock("@/composables/ui/useBackButtonClose", () => ({
  useBackButtonClose: vi.fn()
}));
vi.mock("@vueuse/integrations/useFocusTrap", () => ({
  useFocusTrap: () => ({ activate: vi.fn(), deactivate: vi.fn() })
}));

describe("ConfirmDialog.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when isOpen is true", async () => {
    expect.hasAssertions();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    
    vi.mocked(useConfirm).mockReturnValue({
      isOpen: ref(true),
      options: ref({
        title: "Test Title",
        message: "Test Message",
        confirmLabel: "Yes",
        cancelLabel: "No"
      }),
      handleConfirm,
      handleCancel,
      confirm: vi.fn()
    });

    const wrapper = mount(ConfirmDialog, {
      global: {
        plugins: [createPinia()],
        stubs: { Teleport: true }
      }
    });

    expect(wrapper.find("h3").text()).toBe("Test Title");
    expect(wrapper.find("p").text()).toBe("Test Message");
    
    const buttons = wrapper.findAll("button");
    expect(buttons[0]?.text()).toBe("No");
    expect(buttons[1]?.text()).toBe("Yes");

    await buttons[0]?.trigger("click");
    expect(handleCancel).toHaveBeenCalled();

    await buttons[1]?.trigger("click");
    expect(handleConfirm).toHaveBeenCalled();
  });

  it("does not render when isOpen is false", async () => {
    expect.hasAssertions();
    vi.mocked(useConfirm).mockReturnValue({
      isOpen: ref(false),
      options: ref({ title: "Test Title", message: "Test Message" }),
      handleConfirm: vi.fn(),
      handleCancel: vi.fn(),
      confirm: vi.fn()
    });

    const wrapper = mount(ConfirmDialog, {
      global: {
        plugins: [createPinia()],
        stubs: { Teleport: true }
      }
    });

    expect(wrapper.find("h3").exists()).toBeFalsy();
  });
});
