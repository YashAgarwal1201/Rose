import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import FeedbackSidebar from "@/components/layout/FeedbackSidebar.vue";

describe("FeedbackSidebar.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when isOpen is true and submits form", async () => {
    expect.hasAssertions();
    const wrapper = mount(FeedbackSidebar, {
      props: { isOpen: true },
      global: {
        stubs: { Teleport: true }
      }
    });

    expect(wrapper.find("h3").text()).toBe("Let's connect");

    const inputs = wrapper.findAll("input");
    const textarea = wrapper.find("textarea");
    
    // Set valid form values
    await inputs[0]?.setValue("John Doe");
    await inputs[1]?.setValue("john@example.com");
    await textarea.setValue("Great app!");

    const form = wrapper.find("form");
    await form.trigger("submit");
    
    // Wait for validation and the 600ms network simulation timeout
    await new Promise((r) => setTimeout(r, 700));

    // It should emit close after successful mock submit
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("does not render when isOpen is false", () => {
    expect.hasAssertions();
    const wrapper = mount(FeedbackSidebar, {
      props: { isOpen: false },
      global: { stubs: { Teleport: true } }
    });

    expect(wrapper.find("h3").exists()).toBeFalsy();
  });
});
