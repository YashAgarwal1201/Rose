import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import FolderPickerModal from "@/components/ui/FolderPickerModal.vue";
import { useFoldersStore } from "@/stores/folders";

describe("FolderPickerModal.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders modal when isOpen is true", () => {
    expect.hasAssertions();
    const wrapper = mount(FolderPickerModal, {
      global: {
        plugins: [createPinia()],
        stubs: { Teleport: true },
      },
      props: {
        isOpen: true,
        itemsToMove: [{ id: "item-1", kind: "doc", name: "My Doc", parentId: null }],
      },
    });

    expect(wrapper.find("h2").text()).toBe('Move "My Doc"');
    expect(wrapper.text()).toContain("Files (Root)");
  });

  it("emits selectTarget with chosen folder when Move Here is clicked", async () => {
    expect.hasAssertions();
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useFoldersStore();
    store.folders = [{ createdAt: 1, id: "folder-1", name: "Work", parentId: null, type: "mixed", updatedAt: 1 }];

    const wrapper = mount(FolderPickerModal, {
      global: {
        plugins: [pinia],
        stubs: { Teleport: true },
      },
      props: {
        isOpen: true,
        itemsToMove: [{ id: "item-1", kind: "doc", name: "My Doc", parentId: "old-folder" }],
      },
    });



    const folderRow = wrapper.find('[data-folder-id="folder-1"]');
    await folderRow.trigger("click");



    const moveBtn = wrapper.findAll("button").find((b) => b.text().includes("Move Here"));
    await moveBtn?.trigger("click");

    expect(wrapper.emitted("selectTarget")).toBeTruthy();
    expect(wrapper.emitted("selectTarget")?.[0]).toEqual(["folder-1"]);
  });

  it("emits close when cancel is clicked", async () => {
    expect.hasAssertions();
    const wrapper = mount(FolderPickerModal, {
      global: {
        plugins: [createPinia()],
        stubs: { Teleport: true },
      },
      props: {
        isOpen: true,
        itemsToMove: [{ id: "item-1", kind: "doc", name: "My Doc", parentId: null }],
      },
    });

    const cancelBtn = wrapper.findAll("button").find((b) => b.text().includes("Cancel"));
    await cancelBtn?.trigger("click");

    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
