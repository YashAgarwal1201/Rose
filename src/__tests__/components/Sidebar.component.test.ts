// src/__tests__/components/Sidebar.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Sidebar from "../../components/Sidebar.vue";

// Mock the settings store to control enabled features
const mockEnabledFeatures = vi.fn<() => string[]>().mockReturnValue(["todo", "note", "doc"]);
const mockIsFeatureEnabled = vi.fn((feature: string) => mockEnabledFeatures().includes(feature));

vi.mock("../../stores/settings", () => ({
  useSettingsStore: () => ({
    enabledFeatures: mockEnabledFeatures(),
    isFeatureEnabled: mockIsFeatureEnabled,
  }),
}));

function createTestRouter(initialRoute = "/") {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div>Home</div>" } },
      { path: "/todos/folder", name: "todos-folder", component: { template: "<div>Todos</div>" } },
      { path: "/notes/folder", name: "notes-folder", component: { template: "<div>Notes</div>" } },
      { path: "/docs/folder", name: "docs-folder", component: { template: "<div>Docs</div>" } },
      { path: "/settings", name: "settings", component: { template: "<div>Settings</div>" } },
    ],
  });
}

async function mountSidebar(initialRoute = "/") {
  const router = createTestRouter(initialRoute);
  await router.push(initialRoute);
  await router.isReady();

  return mount(Sidebar, {
    global: {
      plugins: [router],
    },
  });
}

describe("Sidebar", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockEnabledFeatures.mockReturnValue(["todo", "note", "doc"]);
    mockIsFeatureEnabled.mockImplementation((feature: string) =>
      mockEnabledFeatures().includes(feature),
    );
  });

  // ─────────────────────────────────────────────
  // rendering
  // ─────────────────────────────────────────────
  describe("rendering", () => {
    it("renders the Home nav item", async () => {
      expect.hasAssertions();
      const wrapper = await mountSidebar();
      expect(wrapper.text()).toContain("Home");
    });

    it("renders all enabled feature nav items", async () => {
      expect.hasAssertions();
      const wrapper = await mountSidebar();
      expect(wrapper.text()).toContain("Todos");
      expect(wrapper.text()).toContain("Notes");
      expect(wrapper.text()).toContain("Docs");
    });

    it("hides disabled feature nav items", async () => {
      expect.hasAssertions();
      mockEnabledFeatures.mockReturnValue(["todo"]);
      const wrapper = await mountSidebar();
      expect(wrapper.text()).toContain("Todos");
      expect(wrapper.text()).not.toContain("Notes");
      expect(wrapper.text()).not.toContain("Docs");
    });

    it("renders the Menu button", async () => {
      expect.hasAssertions();
      const wrapper = await mountSidebar();
      expect(wrapper.text()).toContain("Menu");
    });
  });

  // ─────────────────────────────────────────────
  // toggleMenu emit
  // ─────────────────────────────────────────────
  describe("toggleMenu emit", () => {
    it("emits toggleMenu when the Menu button is clicked", async () => {
      expect.hasAssertions();
      const wrapper = await mountSidebar();
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
      const wrapper = await mountSidebar("/");
      const homeLink = wrapper.findAll("a").find((a) => a.text().includes("Home"))!;
      // The active link should have the primary color class
      expect(homeLink.html()).toContain("bg-rose-primary");
    });

    it("applies active styling to Todos when on a /todos/ route", async () => {
      expect.hasAssertions();
      const wrapper = await mountSidebar("/todos/folder");
      const todosLink = wrapper.findAll("a").find((a) => a.text().includes("Todos"))!;
      expect(todosLink.html()).toContain("bg-rose-primary");
    });

    it("does not apply active styling to Home when on /todos/", async () => {
      expect.hasAssertions();
      const wrapper = await mountSidebar("/todos/folder");
      const homeLink = wrapper.findAll("a").find((a) => a.text().includes("Home"))!;
      expect(homeLink.html()).not.toContain("bg-rose-primary");
    });
  });
});
