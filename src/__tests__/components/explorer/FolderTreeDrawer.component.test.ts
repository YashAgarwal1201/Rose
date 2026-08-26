import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import FolderTreeDrawer from "@/components/explorer/FolderTreeDrawer.vue";

describe("FolderTreeDrawer.vue", () => {
  it("renders when isOpen is true and emits close", async () => {
    expect.hasAssertions();
    const wrapper = mount(FolderTreeDrawer, {
      props: { isOpen: true },
      slots: {
        default: "<div class='slotted'>test content</div>"
      },
      global: {
        stubs: { XIcon: true }
      }
    });

    const title = wrapper.find("h3");
    expect(title.exists()).toBeTruthy();
    expect(title.text()).toBe("Folders");
    expect(wrapper.html()).toContain("test content");

    const closeButton = wrapper.find("button");
    await closeButton.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("does not render when isOpen is false", () => {
    expect.hasAssertions();
    const wrapper = mount(FolderTreeDrawer, {
      props: { isOpen: false },
      global: { stubs: { XIcon: true } }
    });

    expect(wrapper.find("h3").exists()).toBeFalsy();
  });
});
