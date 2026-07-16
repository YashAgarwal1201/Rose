import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import App from "../App.vue";

describe("app mount", () => {
  it("renders properly", () => {
    expect.hasAssertions();
    const wrapper = mount(App);
    expect(wrapper.text()).toContain("You did it!");
  });
});
