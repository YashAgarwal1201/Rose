import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TrashView from "@/views/trash/TrashView.vue";
import { useTrashStore } from "@/stores/trash";
import * as confirmModule from "@/composables/ui/useConfirm";

vi.mock(import("vue-router"), () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
} as any));

describe("TrashView.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it("renders empty state when trash is empty", () => {
    const trashStore = useTrashStore();
    trashStore.trashedItems = [];

    const wrapper = mount(TrashView);
    expect(wrapper.text()).toContain("Trash is empty");
    expect(wrapper.text()).toContain("Items you delete will appear here for 30 days");
  });

  it("renders trashed items with titles, location, and countdown badge", () => {
    const trashStore = useTrashStore();
    trashStore.trashedItems = [
      {
        id: "doc-1",
        kind: "doc",
        title: "Meeting Notes",
        originalFolderId: null,
        originalFolderPath: [],
        trashedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        childCount: 0,
        daysRemaining: 28,
      },
      {
        id: "folder-1",
        kind: "folder",
        title: "Work Archive",
        originalFolderId: "root-1",
        originalFolderPath: ["Office", "Q3"],
        trashedAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
        childCount: 5,
        daysRemaining: 5,
      },
    ];

    const wrapper = mount(TrashView);
    expect(wrapper.text()).toContain("Meeting Notes");
    expect(wrapper.text()).toContain("Files (Root)");
    expect(wrapper.text()).toContain("28 days left");

    expect(wrapper.text()).toContain("Work Archive");
    expect(wrapper.text()).toContain("Office / Q3");
    expect(wrapper.text()).toContain("Folder • 5 items");
    expect(wrapper.text()).toContain("5 days left");
  });

  it("calls restoreItem when Restore button is clicked", async () => {
    const trashStore = useTrashStore();
    trashStore.trashedItems = [
      {
        id: "doc-1",
        kind: "doc",
        title: "Important Memo",
        originalFolderId: null,
        originalFolderPath: [],
        trashedAt: Date.now(),
        childCount: 0,
        daysRemaining: 30,
      },
    ];
    const restoreSpy = vi.spyOn(trashStore, "restoreItem").mockResolvedValue(undefined);

    const wrapper = mount(TrashView);
    const restoreBtn = wrapper.findAll("button").find((b) => b.text().includes("Restore"));
    expect(restoreBtn).toBeDefined();

    await restoreBtn!.trigger("click");
    expect(restoreSpy).toHaveBeenCalledWith("doc", "doc-1");
  });

  it("calls deleteForever when Delete button is clicked and confirmed", async () => {
    const trashStore = useTrashStore();
    trashStore.trashedItems = [
      {
        id: "note-1",
        kind: "note",
        title: "Draft Sketch",
        originalFolderId: null,
        originalFolderPath: [],
        trashedAt: Date.now(),
        childCount: 0,
        daysRemaining: 30,
      },
    ];
    vi.spyOn(confirmModule, "useConfirm").mockReturnValue({
      confirm: vi.fn().mockResolvedValue(true),
      handleCancel: vi.fn(),
      handleConfirm: vi.fn(),
      isOpen: { value: false } as any,
      options: { value: { message: "" } } as any,
    });
    const deleteSpy = vi.spyOn(trashStore, "deleteForever").mockResolvedValue(undefined);

    const wrapper = mount(TrashView);
    const deleteBtn = wrapper.findAll("button").find((b) => b.text().includes("Delete") && !b.text().includes("Empty"));
    expect(deleteBtn).toBeDefined();

    await deleteBtn!.trigger("click");
    expect(deleteSpy).toHaveBeenCalledWith("note", "note-1");
  });

  it("calls emptyTrash when Empty Trash button is clicked and confirmed", async () => {
    const trashStore = useTrashStore();
    trashStore.trashedItems = [
      {
        id: "note-1",
        kind: "note",
        title: "Draft Sketch",
        originalFolderId: null,
        originalFolderPath: [],
        trashedAt: Date.now(),
        childCount: 0,
        daysRemaining: 30,
      },
    ];
    vi.spyOn(confirmModule, "useConfirm").mockReturnValue({
      confirm: vi.fn().mockResolvedValue(true),
      handleCancel: vi.fn(),
      handleConfirm: vi.fn(),
      isOpen: { value: false } as any,
      options: { value: { message: "" } } as any,
    });
    const emptySpy = vi.spyOn(trashStore, "emptyTrash").mockResolvedValue(undefined);

    const wrapper = mount(TrashView);
    const emptyBtn = wrapper.findAll("button").find((b) => b.text().includes("Empty Trash"));
    expect(emptyBtn).toBeDefined();

    await emptyBtn!.trigger("click");
    expect(emptySpy).toHaveBeenCalled();
  });

  it("filters items when searchQuery is typed", async () => {
    const trashStore = useTrashStore();
    trashStore.trashedItems = [
      {
        id: "1",
        kind: "doc",
        title: "Alpha Document",
        originalFolderId: null,
        originalFolderPath: [],
        trashedAt: Date.now(),
        childCount: 0,
        daysRemaining: 30,
      },
      {
        id: "2",
        kind: "doc",
        title: "Beta Document",
        originalFolderId: null,
        originalFolderPath: [],
        trashedAt: Date.now(),
        childCount: 0,
        daysRemaining: 30,
      },
    ];

    const wrapper = mount(TrashView);
    const searchInput = wrapper.find("input[type='text']");
    expect(searchInput.exists()).toBe(true);

    await searchInput.setValue("Alpha");
    expect(wrapper.text()).toContain("Alpha Document");
    expect(wrapper.text()).not.toContain("Beta Document");
  });

  it("toggles the retention info popover when info button is clicked", async () => {
    const wrapper = mount(TrashView);
    expect(wrapper.text()).not.toContain("Retention Policy");

    const infoBtn = wrapper.find("button[aria-label='Trash retention policy info']");
    expect(infoBtn.exists()).toBe(true);

    await infoBtn.trigger("click");
    expect(wrapper.text()).toContain("Retention Policy");
    expect(wrapper.text()).toContain("Items in Trash are retained for 30 days");

    const closeBtn = wrapper.find("button[aria-label='Close retention info']");
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger("click");
    expect(wrapper.text()).not.toContain("Retention Policy");
  });

  it("toggles viewMode between cards and list view", async () => {
    const trashStore = useTrashStore();
    trashStore.trashedItems = [
      {
        id: "doc-1",
        kind: "doc",
        title: "Test Doc",
        originalFolderId: null,
        originalFolderPath: [],
        trashedAt: Date.now(),
        childCount: 0,
        daysRemaining: 30,
      },
    ];

    const wrapper = mount(TrashView);
    const listBtn = wrapper.find("button[aria-label='List view']");
    const cardsBtn = wrapper.find("button[aria-label='Cards view']");
    expect(listBtn.exists()).toBe(true);
    expect(cardsBtn.exists()).toBe(true);

    await listBtn.trigger("click");
    expect(wrapper.find(".grid").exists()).toBe(false);

    await cardsBtn.trigger("click");
    expect(wrapper.find(".grid").exists()).toBe(true);
  });
});
