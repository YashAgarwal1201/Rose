import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { IDBFactory } from "fake-indexeddb";
import db from "../../db";
import { useTodosStore } from "../../stores/todos";
import { useFoldersStore } from "../../stores/folders";
import TodosView from "../../views/TodosView.vue";
import ExplorerGrid from "../../components/ExplorerGrid.vue";

// ─── Composable mocks ─────────────────────────────────────────────────────────
vi.mock(import("../../composables/useToast"), () => ({
  useToast: () => ({ showToast: vi.fn() }),
} as any));
vi.mock(import("../../composables/useConfirm"), () => ({
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(false) }),
} as any));
vi.mock(import("../../composables/useExplorerViewMode"), () => {
  const { ref } = require("vue");
  return {
    useExplorerViewMode: () => ({
      viewMode: ref("grid"),
      sortKey: ref("name"),
      sortDir: ref("asc"),
      setSortKey: vi.fn(),
      toggleViewMode: vi.fn(),
    }),
  };
});

// ─── Child component stubs ────────────────────────────────────────────────────
vi.mock(import("../../components/FolderTree.vue"), () => ({
  default: { template: "<div data-testid='folder-tree' />" },
} as any));
vi.mock(import("../../components/FolderTreeDrawer.vue"), () => ({
  default: { template: "<div data-testid='folder-tree-drawer' />" },
} as any));
vi.mock(import("../../components/Breadcrumbs.vue"), () => ({
  default: { template: "<div data-testid='breadcrumbs' />" },
} as any));
vi.mock(import("../../components/ExplorerActions.vue"), () => ({
  default: {
    template: `<div data-testid='explorer-actions'>
      <button data-testid='create-folder-btn' @click="$emit('create-folder')">New Folder</button>
      <button data-testid='create-file-btn' @click="$emit('create-file')">New List</button>
    </div>`,
    emits: ["create-folder", "create-file"],
  } as any,
}));

// ─── Router factory ───────────────────────────────────────────────────────────
const routerStub = { template: "<div />" };
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", redirect: "/todos/folder" },
      {
        path: "/todos/folder/:pathMatch(.*)*",
        component: routerStub,
        name: "todos-folder",
        props: true,
      },
      {
        path: "/todos/list/:pathMatch(.*)*",
        component: routerStub,
        name: "todos-list",
        props: true,
      },
    ],
  });
}

// ─── DB reset ─────────────────────────────────────────────────────────────────
async function freshDb() {
  await db.docs.clear();
  await db.folders.clear();
  await db.notes.clear();
  await db.todos.clear();
  await db.todoLists.clear();
}

// ─── Mount helper ─────────────────────────────────────────────────────────────
async function mountTodosView(pathMatch: string[] = []) {
  const router = makeRouter();
  await router.push("/todos/folder");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(TodosView, {
    props: { pathMatch },
    global: { plugins: [router, pinia] },
  });
  await flushPromises();
  return { wrapper, router };
}

// ─── Grid emit helper (camelCase matches ExplorerGrid defineEmits) ─────────────
async function emitFromGrid(wrapper: ReturnType<typeof mount>, event: string, ...args: unknown[]) {
  wrapper.findComponent(ExplorerGrid).vm.$emit(event, ...args);
  await flushPromises();
}

describe("TodosView.component.test.ts", () => {
  beforeEach(async () => {
    await freshDb();
    vi.clearAllMocks();
  });

  describe("Mounting and Initial Data Load", () => {
    it("loads current folder contents correctly at root", async () => {
      // Create a root folder and a root list.
      await db.folders.add({
        id: "folder-1",
        parentId: null,
        name: "Root Folder",
        type: "todo",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await db.todoLists.add({
        id: "list-1",
        folderId: null,
        name: "Root List",
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountTodosView();
      const grid = wrapper.findComponent(ExplorerGrid);
      expect(grid.props("folders")).toHaveLength(1);
      expect(grid.props("files")).toHaveLength(1);
      expect((grid.props("folders") as any[])[0].name).toBe("Root Folder");
      expect((grid.props("files") as any[])[0].name).toBe("Root List");
    });
  });

  describe("File Operations (ExplorerGrid emits)", () => {
    it("creates a new list and routes to it", async () => {
      const { wrapper, router } = await mountTodosView();
      const pushSpy = vi.spyOn(router, "push");
      await emitFromGrid(wrapper, "create-file", "My New List");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Expect DB insertion.
      const allLists = await db.todoLists.toArray();
      expect(allLists).toHaveLength(1);
      expect(allLists[0]?.name).toBe("My New List");
    });

    it("renames a list successfully", async () => {
      await db.todoLists.add({
        id: "list-7",
        folderId: null,
        name: "Old Title",
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountTodosView();
      await emitFromGrid(wrapper, "rename-file", "list-7", "New Title");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect((await db.todoLists.get("list-7"))?.name).toBe("New Title");
    });

    it("deletes a list successfully", async () => {
      await db.todoLists.add({
        id: "list-8",
        folderId: null,
        name: "Untouched Title",
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountTodosView();
      await emitFromGrid(wrapper, "delete-file", "list-8");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(await db.todoLists.get("list-8")).toBeUndefined();
    });
  });

  describe("Folder Operations (ExplorerGrid emits)", () => {
    it("creates a new folder", async () => {
      const { wrapper } = await mountTodosView();
      await emitFromGrid(wrapper, "create-folder", "New Subfolder");
      await new Promise((resolve) => setTimeout(resolve, 50));
      const allFolders = await db.folders.toArray();
      expect(allFolders).toHaveLength(1);
      expect(allFolders[0]?.name).toBe("New Subfolder");
      expect(allFolders[0]?.type).toBe("todo");
    });

    it("renames a folder and remains in current view if renaming a child", async () => {
      await db.folders.add({
        id: "folder-4",
        parentId: null,
        name: "Child Folder",
        type: "todo",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper, router } = await mountTodosView();
      const pushSpy = vi.spyOn(router, "push");
      await emitFromGrid(wrapper, "rename-folder", "folder-4", "Renamed Folder");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect((await db.folders.get("folder-4"))?.name).toBe("Renamed Folder");
      // Since "folder-4" is a child of the current root, we shouldn't navigate.
      expect(pushSpy).not.toHaveBeenCalled();
    });

    it("deletes a folder", async () => {
      await db.folders.add({
        id: "folder-5",
        parentId: null,
        name: "To Delete",
        type: "todo",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountTodosView();
      await emitFromGrid(wrapper, "delete-folder", "folder-5");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(await db.folders.get("folder-5")).toBeUndefined();
    });
  });
});
