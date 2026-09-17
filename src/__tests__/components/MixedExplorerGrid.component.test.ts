// src/__tests__/components/MixedExplorerGrid.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { ListIcon } from "@lucide/vue";
import MixedExplorerGrid from "@/components/explorer/MixedExplorerGrid.vue";

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

vi.mock(import('../../composables/explorer/useExplorerViewMode.ts'), () => ({
  useExplorerViewMode: () => ({
    setSortKey: mockSetSortKey,
    sortDir: mockSortDir,
    sortKey: mockSortKey,
    toggleViewMode: mockToggleViewMode,
    viewMode: mockViewMode,
  }),
}));

const mockConfirm = vi.fn().mockResolvedValue(false);
vi.mock(import('@/composables/ui/useConfirm.ts'), () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}));

vi.mock(import('@/composables/ui/useToast.ts'), () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const mockIsMobile = ref(false);
vi.mock(import('@vueuse/core'), () => ({
  useMediaQuery: vi.fn(() => mockIsMobile),
}));

vi.mock(import('@dnd-kit/vue'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDraggable: vi.fn(() => ({ isDragging: ref(false) })),
    useDroppable: vi.fn(() => ({ isDropTarget: ref(false) })),
    useDragOverlay: vi.fn(() => ({ active: ref(false) })),
  };
});

const ITEMS = [
  { id: "f1", name: "Zebra", kind: "folder" as const, updatedAt: 300, createdAt: 100 },
  { id: "f2", name: "Alpha", kind: "folder" as const, updatedAt: 100, createdAt: 200 },
  { id: "l1", name: "Work", kind: "file" as const, updatedAt: 150, createdAt: 150, thumbnail: null },
];

function mountGrid(items = ITEMS) {
  return mount(MixedExplorerGrid, {
    props: { items, fileLabel: "list" },
    global: { stubs: { ContextMenu: { template: '<div><slot/></div>' } } }
  });
}

describe("MixedExplorerGrid", () => {
  beforeEach(() => {
    mockViewMode.value = "grid";
    mockSortKey.value = "name";
    mockSortDir.value = "asc";
    mockIsMobile.value = false;
    mockSetSortKey.mockClear();
    mockToggleViewMode.mockClear();
    mockConfirm.mockReset();
    mockConfirm.mockResolvedValue(false);
  });

  describe("rendering", () => {
    it("renders folder and file names in grid view", () => {
      const wrapper = mountGrid();
      expect(wrapper.text()).toContain("Zebra");
      expect(wrapper.text()).toContain("Alpha");
      expect(wrapper.text()).toContain("Work");
    });
    
    it("sorts items by name correctly", () => {
      const wrapper = mountGrid();
      const spans = wrapper
        .findAll(".text-sm.text-rose-text")
        .map((el) => el.text())
        .filter((n) => ["Zebra", "Alpha", "Work"].includes(n));
      expect(spans).toStrictEqual(["Alpha", "Zebra", "Work"]);
    });
  });

  describe("mobile behavior", () => {
    it("removes touch-none class when on a mobile device", () => {
      mockIsMobile.value = true;
      const wrapper = mountGrid();
      const nodes = wrapper.findAll('[role="listitem"]');
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes[0].classes()).not.toContain('touch-none');
    });

    it("applies touch-none class when on a desktop device", () => {
      mockIsMobile.value = false;
      const wrapper = mountGrid();
      const nodes = wrapper.findAll('[role="listitem"]');
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes[0].classes()).toContain('touch-none');
    });
  });

  describe("drag and drop", () => {
    it("emits moveItem on valid handleDragEnd", () => {
      const wrapper = mountGrid();
      const vm = wrapper.vm as any;
      vm.handleDragEnd({
        canceled: false,
        operation: {
          source: { id: "l1", data: { id: "l1", kind: "file" } },
          target: { id: "f1", data: { id: "f1", kind: "folder" } }
        }
      });
      expect(wrapper.emitted("moveItem")).toBeTruthy();
      expect(wrapper.emitted("moveItem")?.[0]).toStrictEqual(["file", "l1", "f1"]);
    });

    it("does not emit moveItem if drag is canceled", () => {
      const wrapper = mountGrid();
      const vm = wrapper.vm as any;
      vm.handleDragEnd({
        canceled: true,
        operation: {
          source: { id: "l1" },
          target: { id: "f1" }
        }
      });
      expect(wrapper.emitted("moveItem")).toBeFalsy();
    });
    
    it("does not emit moveItem when moving out of folder (id = vault)", () => {
      const wrapper = mountGrid();
      const vm = wrapper.vm as any;
      vm.handleDragEnd({
        canceled: false,
        operation: {
          source: { id: "f2", data: { id: "f2", kind: "folder" } },
          target: { id: "vault", data: { id: "vault", kind: "folder" } }
        }
      });
      expect(wrapper.emitted("moveItem")).toBeFalsy();
    });
  });
});
