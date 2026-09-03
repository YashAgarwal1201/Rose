import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ColorPickerGrid from "@/components/ui/ColorPickerGrid.vue";

describe("ColorPickerGrid.vue", () => {
  it("renders colors and emits on click", async () => {
    expect.hasAssertions();
    const wrapper = mount(ColorPickerGrid, {
      props: {
        modelValue: "#ffffff",
        defaultColor: "#1a1a1a"
      },
      global: { stubs: { CheckIcon: true, PlusIcon: true } }
    });

    const buttons = wrapper.findAll("button");
    // Should have COLORS (15) + custom + reset = 17 buttons
    expect(buttons.length).toBeGreaterThan(15);
    
    // Click the second color button
    await buttons[1]?.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("emits default color on reset", async () => {
    expect.hasAssertions();
    const wrapper = mount(ColorPickerGrid, {
      props: { modelValue: "#ffffff", defaultColor: "#ef4444" },
      global: { stubs: { CheckIcon: true, PlusIcon: true } }
    });

    const buttons = wrapper.findAll("button");
    const resetButton = buttons[buttons.length - 1];
    
    await resetButton?.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["#ef4444"]);
  });
});
