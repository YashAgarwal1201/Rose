import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SettingsSwitch from "@/components/settings/SettingsSwitch.vue";

describe("SettingsSwitch.vue", () => {
  it("renders properly based on modelValue", async () => {
    expect.hasAssertions();
    const wrapper = mount(SettingsSwitch, {
      props: {
        modelValue: false,
        ariaLabelledby: "label-1",
        ariaDescribedby: "desc-1"
      }
    });

    const button = wrapper.find("button");
    expect(button.attributes("aria-checked")).toBe("false");
    expect(button.attributes("aria-labelledby")).toBe("label-1");
    expect(button.attributes("aria-describedby")).toBe("desc-1");
    expect(button.classes()).toContain("bg-rose-border");

    // Click to toggle
    await button.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([true]);
  });

  it("renders active state when true", () => {
    expect.hasAssertions();
    const wrapper = mount(SettingsSwitch, {
      props: { modelValue: true }
    });

    const button = wrapper.find("button");
    expect(button.attributes("aria-checked")).toBe("true");
    expect(button.classes()).toContain("bg-rose-primary");
    expect(wrapper.find("span").classes()).toContain("translate-x-5");
  });
});
