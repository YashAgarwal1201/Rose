// src/__tests__/components/Navbar.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Navbar from "@/components/layout/Navbar.vue";


function createTestRouter(initialRoute = "/") {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      { path: "/files/folder", component: { template: "<div />" } },
    ],
  });
}

async function mountNavbar(routePath = "/") {
  const router = createTestRouter(routePath);
  await router.push(routePath);
  await router.isReady();

  return mount(Navbar, {
    global: {
      plugins: [router, createPinia()],
      stubs: {
        HomeIcon: true,
        FolderIcon: true,
        MenuIcon: true,
      },
    },
  });
}

describe("Navbar.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // rendering
  // ─────────────────────────────────────────────
  describe("rendering", () => {
    it("renders the Home link", async () => {
      expect.hasAssertions();
      const wrapper = await mountNavbar();
      expect(wrapper.text()).toContain("Home");
    });

    it("renders the Files link", async () => {
      expect.hasAssertions();
      const wrapper = await mountNavbar();
      expect(wrapper.text()).toContain("Files");
    });

    it("renders the Menu button", async () => {
      expect.hasAssertions();
      const wrapper = await mountNavbar();
      expect(wrapper.text()).toContain("Menu");
    });
  });

  // ─────────────────────────────────────────────
  // toggleMenu emit
  // ─────────────────────────────────────────────
  describe("toggleMenu emit", () => {
    it("emits toggleMenu when the Menu button is clicked", async () => {
      expect.hasAssertions();
      const wrapper = await mountNavbar();
      const menuBtn = wrapper.find('button[aria-label="Menu"]');
      await menuBtn.trigger("click");
      expect(wrapper.emitted("toggleMenu")).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────
  // active state
  // ─────────────────────────────────────────────
  describe("active state", () => {
    it("applies active styling to Home when on '/'", async () => {
      expect.hasAssertions();
      const wrapper = await mountNavbar("/");
      const homeLink = wrapper.findAll("a").find((a) => a.text().includes("Home"))!;
      // The active link should have the primary color class
      expect(homeLink.html()).toContain("bg-rose-primary");
    });

    it("applies active styling to Files when on a /files/ route", async () => {
      expect.hasAssertions();
      const wrapper = await mountNavbar("/files/folder");
      const filesLink = wrapper.findAll("a").find((a) => a.text().includes("Files"))!;
      expect(filesLink.html()).toContain("bg-rose-primary");
    });

    it("does not apply active styling to Home when on /files/", async () => {
      expect.hasAssertions();
      const wrapper = await mountNavbar("/files/folder");
      const homeLink = wrapper.findAll("a").find((a) => a.text().includes("Home"))!;
      expect(homeLink.html()).not.toContain("bg-rose-primary");
    });
  });
});
