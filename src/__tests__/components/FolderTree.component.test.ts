// src/__tests__/components/FolderTree.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import FolderTree from "@/components/explorer/FolderTree.vue";

vi.mock("../../stores/folders", () => ({
  useFoldersStore: () => ({
    folders: [
      { id: "f1", name: "Alpha", parentId: null, type: "todo", createdAt: 1, updatedAt: 1 },
      { id: "f2", name: "Beta", parentId: null, type: "todo", createdAt: 2, updatedAt: 2 },
      { id: "f3", name: "Child", parentId: "f1", type: "todo", createdAt: 3, updatedAt: 3 },
    ],
    createFolder: vi.fn(),
    deleteFolder: vi.fn(),
  }),
}));

const mockConfirm = vi.fn().mockResolvedValue(false);

vi.mock("../../composables/useConfirm", () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}));

vi.mock("../../composables/useToast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function mountTree(activeFolderId: string | null = null) {
  return mount(FolderTree, {
    props: { activeFolderId, type: "todo" },
  });
}

describe("FolderTree", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockConfirm.mockReset();
    mockConfirm.mockResolvedValue(false);
  });

  describe("rendering", () => {
    it("renders root folder names from store state", () => {
      const wrapper = mountTree();
      expect(wrapper.text()).toContain("Alpha");
      expect(wrapper.text()).toContain("Beta");
    });

    it("does not render child folders before parent is expanded", () => {
      const wrapper = mountTree();
      expect(wrapper.text()).not.toContain("Child");
    });

    it("applies active highlight class to the active folder", () => {
      const wrapper = mountTree("f1");
      const activeLi = wrapper.findAll("li").find((li) => li.text().includes("Alpha"));
      expect(activeLi?.classes()).toContain("bg-rose-surface-alt");
    });

    it("renders the expand chevron only for folders that have children", () => {
      const wrapper = mountTree();
      // f1 has child f3, f2 does not — only one chevron button
      const chevronBtns = wrapper
        .findAll('button[aria-label="Toggle folder expansion"]')
        .filter((btn) => !btn.classes().includes("opacity-0"));
      expect(chevronBtns).toHaveLength(1);
    });
  });

  describe("expand/collapse", () => {
    it("shows child folder after clicking the expand chevron", async () => {
      const wrapper = mountTree();
      const chevron = wrapper.find('button[aria-label="Toggle folder expansion"]');
      await chevron.trigger("click");
      expect(wrapper.text()).toContain("Child");
    });

    it("hides child folder after collapsing an expanded parent", async () => {
      const wrapper = mountTree();
      const chevron = wrapper.find('button[aria-label="Toggle folder expansion"]');
      await chevron.trigger("click");
      await chevron.trigger("click");
      expect(wrapper.text()).not.toContain("Child");
    });
  });

  describe("create folder", () => {
    it("shows the New folder button initially", () => {
      const wrapper = mountTree();
      expect(wrapper.find("button.text-rose-primary").text()).toContain("New folder");
    });

    it("shows root-level name input after clicking New folder", async () => {
      const wrapper = mountTree();
      await wrapper.find("button.text-rose-primary").trigger("click");
      expect(wrapper.find("input[placeholder='Folder name']").exists()).toBe(true);
    });

    it("hides the input after pressing Escape", async () => {
      const wrapper = mountTree();
      await wrapper.find("button.text-rose-primary").trigger("click");
      await wrapper.find("input[placeholder='Folder name']").trigger("keyup.escape");
      expect(wrapper.find("input[placeholder='Folder name']").exists()).toBe(false);
    });
  });

  describe("delete folder", () => {
    it("calls confirm() when the delete button is clicked", async () => {
      const wrapper = mountTree();
      await wrapper.find("button[title='Delete folder']").trigger("click");
      expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: "Delete folder" }));
    });

    it("does not call store.deleteFolder when confirm returns false", async () => {
      const { useFoldersStore } = await import("../../stores/folders");
      const store = useFoldersStore();
      const wrapper = mountTree();
      await wrapper.find("button[title='Delete folder']").trigger("click");
      await wrapper.vm.$nextTick();
      expect(store.deleteFolder).not.toHaveBeenCalled();
    });
  });

  describe("select emit", () => {
    it("emits select with the folder id when a folder row is clicked", async () => {
      const wrapper = mountTree();
      await wrapper.find('button[aria-label^="Select folder "]').trigger("click");
      expect(wrapper.emitted("select")?.[0]).toStrictEqual(["f1"]);
    });
  });
});
