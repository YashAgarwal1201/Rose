import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import SideMenu from "@/components/layout/SideMenu.vue";
import { createPinia } from "pinia";
import { useThemeStore } from "@/stores/theme";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: { template: "<div></div>" } },
    { path: "/settings", name: "settings", component: { template: "<div></div>" } }
  ]
});

describe("SideMenu.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when isOpen is true", async () => {
    expect.hasAssertions();
    const wrapper = mount(SideMenu, {
      props: { isOpen: true },
      global: {
        plugins: [createPinia(), router],
        stubs: { Teleport: true, PanelSection: { template: "<div><slot/><slot name='collapsed-preview'/></div>" } }
      }
    });

    expect(wrapper.find("h3").text()).toBe("More Options");

    const themeStore = useThemeStore();
    vi.spyOn(themeStore, "setMode");
    const select = wrapper.find("select");
    expect(select.exists()).toBeTruthy();

    await select.setValue("dark");
    expect(themeStore.setMode).toHaveBeenCalledWith("dark");
  });

  it("does not render when isOpen is false", () => {
    expect.hasAssertions();
    const wrapper = mount(SideMenu, {
      props: { isOpen: false },
      global: {
        plugins: [createPinia(), router],
        stubs: { Teleport: true, PanelSection: true }
      }
    });

    expect(wrapper.find("h3").exists()).toBeFalsy();
  });
});
