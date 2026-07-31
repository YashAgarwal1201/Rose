// src/__tests__/components/NotesView.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { IDBFactory } from "fake-indexeddb";
import db from "../../db";
import { useNotesStore } from "../../stores/notes";
import { useFoldersStore } from "../../stores/folders";
import NotesView from "../../views/NotesView.vue";
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
      <button data-testid='create-file-btn' @click="$emit('create-file')">New Note</button>
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
      { path: "/", redirect: "/notes/folder" },
      {
        path: "/notes/folder/:pathMatch(.*)*",
        component: routerStub,
        name: "notes-folder",
        props: true,
      },
      {
        path: "/notes/note/:pathMatch(.*)*",
        component: routerStub,
        name: "notes-note",
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
}

// ─── Mount helper ─────────────────────────────────────────────────────────────
async function mountNotesView(pathMatch: string[] = []) {
  const router = makeRouter();
  await router.push("/notes/folder");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(NotesView, {
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

describe("NotesView.component.test.ts", () => {
  beforeEach(async () => {
    await freshDb();
    vi.clearAllMocks();
  });

  describe("Mounting and Initial Data Load", () => {
    it("loads current folder contents correctly at root", async () => {
      // Create a root folder and a root note.
      await db.folders.add({
        id: "folder-1",
        parentId: null,
        name: "Root Folder",
        type: "note",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await db.notes.add({
        id: "note-1",
        folderId: null,
        title: "Root Note",
        canvasJSON: null,
        backgroundColor: "#fff",
        thumbnail: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountNotesView();
      const grid = wrapper.findComponent(ExplorerGrid);
      expect(grid.props("folders")).toHaveLength(1);
      expect(grid.props("files")).toHaveLength(1);
      expect((grid.props("folders") as any[])[0].name).toBe("Root Folder");
      expect((grid.props("files") as any[])[0].name).toBe("Root Note");
    });
  });

  describe("File Operations (ExplorerGrid emits)", () => {
    it("creates a new file and routes to it", async () => {
      const { wrapper, router } = await mountNotesView();
      const pushSpy = vi.spyOn(router, "push");
      await emitFromGrid(wrapper, "create-file", "My New Note");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Expect DB insertion.
      const allNotes = await db.notes.toArray();
      expect(allNotes).toHaveLength(1);
      expect(allNotes[0]?.title).toBe("My New Note");
      // Expect routing to the new file.
      expect(pushSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "notes-note",
          params: expect.objectContaining({ pathMatch: ["My New Note"] }),
        }),
      );
    });

    it("renames a file successfully", async () => {
      await db.notes.add({
        id: "note-7",
        folderId: null,
        title: "Old Title",
        canvasJSON: null,
        backgroundColor: "#fff",
        thumbnail: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountNotesView();
      await emitFromGrid(wrapper, "rename-file", "note-7", "New Title");
      expect((await db.notes.get("note-7"))?.title).toBe("New Title");
    });

    it("deletes a file successfully", async () => {
      await db.notes.add({
        id: "note-8",
        folderId: null,
        title: "Untouched Title",
        canvasJSON: null,
        backgroundColor: "#fff",
        thumbnail: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountNotesView();
      await emitFromGrid(wrapper, "delete-file", "note-8");
      expect(await db.notes.get("note-8")).toBeUndefined();
    });
  });

  describe("Folder Operations (ExplorerGrid emits)", () => {
    it("creates a new folder", async () => {
      const { wrapper } = await mountNotesView();
      await emitFromGrid(wrapper, "create-folder", "New Subfolder");
      const allFolders = await db.folders.toArray();
      expect(allFolders).toHaveLength(1);
      expect(allFolders[0]?.name).toBe("New Subfolder");
    });

    it("renames a folder and remains in current view if renaming a child", async () => {
      await db.folders.add({
        id: "folder-4",
        parentId: null,
        name: "Child Folder",
        type: "note",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper, router } = await mountNotesView();
      const pushSpy = vi.spyOn(router, "push");
      await emitFromGrid(wrapper, "rename-folder", "folder-4", "Renamed Folder");
      expect((await db.folders.get("folder-4"))?.name).toBe("Renamed Folder");
      // Since "folder-4" is a child of the current root, we shouldn't navigate.
      expect(pushSpy).not.toHaveBeenCalled();
    });

    it("deletes a folder", async () => {
      await db.folders.add({
        id: "folder-5",
        parentId: null,
        name: "To Delete",
        type: "note",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountNotesView();
      await emitFromGrid(wrapper, "delete-folder", "folder-5");
      expect(await db.folders.get("folder-5")).toBeUndefined();
    });
  });
});
