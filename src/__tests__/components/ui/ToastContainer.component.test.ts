import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ToastContainer from "@/components/ui/ToastContainer.vue";
import { useToast } from "@/composables/ui/useToast";
import { ref } from "vue";

vi.mock("@/composables/ui/useToast", () => ({
  useToast: vi.fn()
}));

describe("ToastContainer.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders toasts from composable state", async () => {
    expect.hasAssertions();
    const dismissToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      toasts: ref([
        { id: 1, message: "Success msg", type: "success" },
        { id: 2, message: "Error msg", type: "error" }
      ] as any),
      dismissToast,
      showToast: vi.fn()
    });

    const wrapper = mount(ToastContainer, {
      global: {
        stubs: { Teleport: true, TransitionGroup: false, XIcon: true, CheckCircleIcon: true, XCircleIcon: true }
      }
    });

    const textNodes = wrapper.findAll("p");
    expect(textNodes).toHaveLength(2);
    expect(textNodes[0]?.text()).toBe("Success msg");
    expect(textNodes[1]?.text()).toBe("Error msg");

    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(2);

    await buttons[0]?.trigger("click");
    expect(dismissToast).toHaveBeenCalledWith(1);
  });
});
