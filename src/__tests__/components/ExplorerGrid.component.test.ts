// src/__tests__/components/ExplorerGrid.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { ListIcon } from "@lucide/vue";
import ExplorerGrid from "@/components/explorer/ExplorerGrid.vue";

const mockViewMode = ref<"grid" | "list">("grid");
const mockSortKey = ref<"name" | "updatedAt">("name");
const mockSortDir = ref<"asc" | "desc">("asc");
const mockSetSortKey = vi.fn((key: "name" | "updatedAt") => {
  if (mockSortKey.value === key) {
    mockSortDir.value = mockSortDir.value === "asc" ? "desc" : "asc";
  } else {
    mockSortKey.value = key;
    mockSortDir.value = "asc";
  }
});
const mockToggleViewMode = vi.fn(() => {
  mockViewMode.value = mockViewMode.value === "grid" ? "list" : "grid";
});

vi.mock(import('../../composables/useExplorerViewMode'), () => ({
  useExplorerViewMode: () => ({
    setSortKey: mockSetSortKey,
    sortDir: mockSortDir,
    sortKey: mockSortKey,
    toggleViewMode: mockToggleViewMode,
    viewMode: mockViewMode,
  }),
}));

const mockConfirm = vi.fn().mockResolvedValue(false);

vi.mock(import('../../composables/useConfirm'), () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}));

vi.mock(import('../../composables/useToast'), () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const FOLDERS = [
  { id: "f1", name: "Zebra", updatedAt: 300, createdAt: 100 },
  { id: "f2", name: "Alpha", updatedAt: 100, createdAt: 200 },
  { id: "f3", name: "Mango", updatedAt: 200, createdAt: 300 },
];
const FILES = [{ id: "l1", name: "Work", updatedAt: 150, createdAt: 150 }];

function mountGrid(folders = FOLDERS, files = FILES) {
  return mount(ExplorerGrid, {
    props: { fileIcon: ListIcon, fileLabel: "list", files, folders },
  });
}

describe("ExplorerGrid", () => {
  beforeEach(() => {
    mockViewMode.value = "grid";
    mockSortKey.value = "name";
    mockSortDir.value = "asc";
    mockSetSortKey.mockClear();
    mockToggleViewMode.mockClear();
    mockConfirm.mockReset();
    mockConfirm.mockResolvedValue(false);
  });

  describe("empty state", () => {
    it("renders the empty state message when no folders or files exist", () => {
      const wrapper = mountGrid([], []);
      expect(wrapper.text()).toContain("This folder is empty.");
    });

    it("does not render the empty state when folders exist", () => {
      const wrapper = mountGrid();
      expect(wrapper.text()).not.toContain("This folder is empty.");
    });
  });

  describe("grid view", () => {
    it("renders folder names in grid view by default", () => {
      const wrapper = mountGrid();
      expect(wrapper.text()).toContain("Zebra");
      expect(wrapper.text()).toContain("Alpha");
      expect(wrapper.text()).toContain("Mango");
    });

    it("renders file names in grid view", () => {
      const wrapper = mountGrid();
      expect(wrapper.text()).toContain("Work");
    });
  });

  describe("list view", () => {
    beforeEach(() => {
      mockViewMode.value = "list";
    });

    it("renders column headers in list view", () => {
      const wrapper = mountGrid();
      const text = wrapper.text();
      expect(text).toContain("Name");
      expect(text).toContain("Type");
      expect(text).toContain("Items");
      expect(text).toContain("Created");
      expect(text).toContain("Modified");
    });

    it("renders folder type label as 'Folder'", () => {
      const wrapper = mountGrid();
      expect(wrapper.text()).toContain("Folder");
    });

    it("renders file type label from fileLabel prop", () => {
      const wrapper = mountGrid();
      // fileLabel="list" → typeLabel capitalises to "List"
      expect(wrapper.text()).toContain("List");
    });
  });

  describe("sort by name", () => {
    it("renders folders in ascending alphabetical order by default", () => {
      const wrapper = mountGrid();
      const spans = wrapper
        .findAll(".text-sm.text-rose-text")
        .map((el) => el.text())
        .filter((n) => ["Zebra", "Alpha", "Mango"].includes(n));
      expect(spans).toStrictEqual(["Alpha", "Mango", "Zebra"]);
    });

    it("calls setSortKey('name') when Name button is clicked", async () => {
      const wrapper = mountGrid();
      const sortButtons = wrapper.findAll(
        "div.flex.flex-wrap button[class*='text-rose-text-muted']",
      );
      await sortButtons[0]!.trigger("click");
      expect(mockSetSortKey).toHaveBeenCalledWith("name");
    });
  });

  describe("sort by modified date", () => {
    it("calls setSortKey('updatedAt') when Modified button is clicked", async () => {
      const wrapper = mountGrid();
      const sortButtons = wrapper.findAll(
        "div.flex.flex-wrap button[class*='text-rose-text-muted']",
      );
      await sortButtons[1]!.trigger("click");
      expect(mockSetSortKey).toHaveBeenCalledWith("updatedAt");
    });

    it("renders folders sorted by updatedAt asc when sortKey is updatedAt", () => {
      mockSortKey.value = "updatedAt";
      mockSortDir.value = "asc";
      const wrapper = mountGrid();
      const spans = wrapper
        .findAll(".text-sm.text-rose-text")
        .map((el) => el.text())
        .filter((n) => ["Zebra", "Alpha", "Mango"].includes(n));
      // Alpha=100, Mango=200, Zebra=300
      expect(spans).toStrictEqual(["Alpha", "Mango", "Zebra"]);
    });
  });

  describe("view toggle", () => {
    it("calls toggleViewMode when the list view button is clicked", async () => {
      const wrapper = mountGrid();
      await wrapper.find("button[title='List view']").trigger("click");
      expect(mockToggleViewMode).toHaveBeenCalledWith();
    });

    it("calls no toggleViewMode when grid view button is already active and clicked", async () => {
      const wrapper = mountGrid();
      await wrapper.find("button[title='Grid view']").trigger("click");
      expect(mockToggleViewMode).not.toHaveBeenCalled();
    });
  });

  describe("rename", () => {
    it("shows a rename input after clicking the pencil (rename) button", async () => {
      const wrapper = mountGrid();
      // Action buttons are inside .absolute div: first = pencil, second = trash
      await wrapper.find('button[aria-label="Rename"]').trigger("click");
      const input = wrapper.find("input[type='text']:not([placeholder])");
      expect(input.exists()).toBeTruthy();
    });

    it("emits renameFolder with the new name on Enter", async () => {
      const wrapper = mountGrid();
      await wrapper.find('button[aria-label="Rename"]').trigger("click");
      const input = wrapper.find("input[type='text']:not([placeholder])");
      await input.setValue("Renamed");
      await input.trigger("keyup.enter");
      expect(wrapper.emitted("renameFolder")?.[0]).toStrictEqual(["f2", "Renamed"]);
    });
  });

  describe("delete", () => {
    it("calls confirm() when the trash button is clicked", async () => {
      const wrapper = mountGrid();
      await wrapper.find('button[aria-label="Delete"]').trigger("click");
      expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: "Delete folder" }));
    });

    it("emits deleteFolder when confirm returns true", async () => {
      mockConfirm.mockResolvedValueOnce(true);
      const wrapper = mountGrid();
      await wrapper.find('button[aria-label="Delete"]').trigger("click");
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted("deleteFolder")).toBe(true);
    });

    it("does not emit deleteFolder when confirm returns false", async () => {
      const wrapper = mountGrid();
      await wrapper.find('button[aria-label="Delete"]').trigger("click");
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted("deleteFolder")).toBe(false);
    });
  });

  describe("create", () => {
    it("shows a new folder input when startCreate('folder') is called", async () => {
      const wrapper = mountGrid();
      await (wrapper.vm as unknown as { startCreate: (t: string) => void }).startCreate("folder");
      await wrapper.vm.$nextTick();
      expect(wrapper.find("input[placeholder='Folder name']").exists()).toBeTruthy();
    });

    it("emits createFolder with the typed name on Enter", async () => {
      const wrapper = mountGrid();
      await (wrapper.vm as unknown as { startCreate: (t: string) => void }).startCreate("folder");
      await wrapper.vm.$nextTick();
      const input = wrapper.find("input[placeholder='Folder name']");
      await input.setValue("My New Folder");
      await input.trigger("keyup.enter");
      expect(wrapper.emitted("createFolder")?.[0]).toStrictEqual(["My New Folder"]);
    });
  });
});
