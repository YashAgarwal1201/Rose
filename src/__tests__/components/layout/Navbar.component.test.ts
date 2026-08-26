import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Navbar from "@/components/layout/Navbar.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: { template: "<div></div>" } },
    { path: "/files/folder", name: "files", component: { template: "<div></div>" } }
  ]
});

describe("Navbar.vue", () => {
  it("renders navigation links and toggle button", async () => {
    expect.hasAssertions();
    router.push("/");
    await router.isReady();

    const wrapper = mount(Navbar, {
      global: {
        plugins: [router],
        stubs: { MenuIcon: true, HomeIcon: true, FolderIcon: true }
      }
    });

    const links = wrapper.findAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]?.text()).toContain("Home");
    expect(links[1]?.text()).toContain("Files");

    const menuButton = wrapper.find("button");
    expect(menuButton.text()).toContain("Menu");

    await menuButton.trigger("click");
    expect(wrapper.emitted("toggleMenu")).toBeTruthy();
  });
});
