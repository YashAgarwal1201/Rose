import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import ContextMenu from "@/components/ui/ContextMenu.vue";

describe("ContextMenu.vue", () => {
  it("renders when isOpen is true and applies position styles", async () => {
    expect.hasAssertions();
    const wrapper = mount(ContextMenu, {
      props: {
        isOpen: false,
        x: 100,
        y: 200
      },
      slots: {
        default: "<div class='menu-item'>Action 1</div>"
      },
      global: {
        stubs: { Teleport: true }
      }
    });

    await wrapper.setProps({ isOpen: true });
    // wait for watcher's internal nextTick
    await new Promise(r => setTimeout(r, 0));

    const menu = wrapper.find(".bg-rose-surface");
    expect(menu.exists()).toBeTruthy();
    expect(menu.html()).toContain("Action 1");

    expect(menu.attributes("style")).toContain("opacity: 1");
  });

  it("does not render when isOpen is false", () => {
    expect.hasAssertions();
    const wrapper = mount(ContextMenu, {
      props: { isOpen: false, x: 0, y: 0 },
      global: { stubs: { Teleport: true } }
    });
    
    expect(wrapper.find(".bg-rose-surface").exists()).toBeFalsy();
  });
});
