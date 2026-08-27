import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import NameCollisionDialog from "@/components/ui/NameCollisionDialog.vue";

describe("NameCollisionDialog.vue", () => {
  it("renders collision warning and suggested name", () => {
    expect.hasAssertions();
    const wrapper = mount(NameCollisionDialog, {
      global: {
        stubs: { Teleport: true },
      },
      props: {
        isOpen: true,
        itemName: "Project Plan",
        suggestedName: "Project Plan (1)",
        targetFolderName: "Work",
      },
    });

    expect(wrapper.text()).toContain('An item named "Project Plan" already exists in Work.');
    const input = wrapper.find("input").element as HTMLInputElement;
    expect(input.value).toBe("Project Plan (1)");
  });

  it("emits confirm with new name when confirmed", async () => {
    expect.hasAssertions();
    const wrapper = mount(NameCollisionDialog, {
      global: {
        stubs: { Teleport: true },
      },
      props: {
        isOpen: true,
        itemName: "Project Plan",
        suggestedName: "Project Plan (1)",
        targetFolderName: "Work",
      },
    });

    const confirmBtn = wrapper.findAll("button").find((b) => b.text().includes("Move & Rename"));
    await confirmBtn?.trigger("click");

    expect(wrapper.emitted("confirm")).toBeTruthy();
    expect(wrapper.emitted("confirm")?.[0]).toEqual(["Project Plan (1)"]);
  });
});
