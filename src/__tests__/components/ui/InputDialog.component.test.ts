import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import InputDialog from "@/components/ui/InputDialog.vue";
import { useInput } from "@/composables/ui/useInput";
import { nextTick, ref } from "vue";
import { createPinia } from "pinia";

vi.mock("@/composables/ui/useInput", () => ({
  useInput: vi.fn()
}));
vi.mock("@/composables/ui/useBackButtonClose", () => ({
  useBackButtonClose: vi.fn()
}));
vi.mock("@vueuse/integrations/useFocusTrap", () => ({
  useFocusTrap: () => ({ activate: vi.fn(), deactivate: vi.fn() })
}));

describe("InputDialog.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly and binds input", async () => {
    expect.hasAssertions();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    const inputValue = ref("test-val");
    
    vi.mocked(useInput).mockReturnValue({
      isOpen: ref(true),
      options: ref({
        title: "Test Title",
        message: "Test Message",
        placeholder: "placeholder...",
      }),
      inputValue,
      handleConfirm,
      handleCancel,
      requestInput: vi.fn()
    });

    const wrapper = mount(InputDialog, {
      global: {
        plugins: [createPinia()],
        stubs: { Teleport: true }
      }
    });

    expect(wrapper.find("h3").text()).toBe("Test Title");
    
    const input = wrapper.find("input");
    expect(input.exists()).toBeTruthy();
    expect(input.element.value).toBe("test-val");
    expect(input.attributes("placeholder")).toBe("placeholder...");

    await input.setValue("new value");
    expect(inputValue.value).toBe("new value");

    const buttons = wrapper.findAll("button");
    await buttons[0]?.trigger("click");
    expect(handleCancel).toHaveBeenCalled();

    await buttons[1]?.trigger("click");
    expect(handleConfirm).toHaveBeenCalled();
  });
});
