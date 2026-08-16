// src/__tests__/App.test.ts
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia } from "pinia";
import App from "../App.vue";

const stub = { template: "<div />" };

const testRoutes = [
  { path: "/", redirect: "/todos/folder" },
  { path: "/todos/folder/:pathMatch(.*)*", component: stub },
  { path: "/todos/list/:pathMatch(.*)*", component: stub },
  { path: "/notes/folder/:pathMatch(.*)*", component: stub },
  { path: "/docs/folder/:pathMatch(.*)*", component: stub },
  { path: "/docs/doc/:pathMatch(.*)*", component: stub },
];

describe("app mount", () => {
  it("renders the sidebar navigation", () => {
    expect.hasAssertions();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: testRoutes,
    });
    const pinia = createPinia();
    const wrapper = mount(App, {
      global: { plugins: [router, pinia] },
    });
    expect(wrapper.find("aside").exists()).toBeTruthy();
  });
});
