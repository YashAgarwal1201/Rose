import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia } from "pinia";
import App from "../App.vue";

describe("app mount", () => {
  it("renders the sidebar navigation", () => {
    expect.hasAssertions();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: { template: "<div />" } }],
    });
    const pinia = createPinia();
    const wrapper = mount(App, {
      global: { plugins: [router, pinia] },
    });
    expect(wrapper.find("aside").exists()).toBe(true);
  });
});
