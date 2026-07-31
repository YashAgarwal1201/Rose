// src/__tests__/components/DocsView.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { IDBFactory } from "fake-indexeddb";
import db from "../../db";
import { useDocsStore } from "../../stores/docs";
import { useFoldersStore } from "../../stores/folders";
import DocsView from "../../views/DocsView.vue";
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
      <button data-testid='create-file-btn' @click="$emit('create-file')">New Doc</button>
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
      { path: "/", redirect: "/docs/folder" },
      {
        path: "/docs/folder/:pathMatch(.*)*",
        component: routerStub,
        name: "docs-folder",
        props: true,
      },
      {
        path: "/docs/doc/:pathMatch(.*)*",
        component: routerStub,
        name: "docs-doc",
        props: true,
      },
    ],
  });
}

// ─── DB reset ─────────────────────────────────────────────────────────────────
async function freshDb() {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

// ─── Mount helper ─────────────────────────────────────────────────────────────
async function mountDocsView(pathMatch: string[] = []) {
  const router = makeRouter();
  await router.push("/docs/folder");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(DocsView, {
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
  await flushPromises(); // second flush — router.push + async store chains
}

// ─────────────────────────────────────────────────────────────────────────────
describe("DocsView", () => {
  beforeEach(async () => {
    await freshDb();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────
  describe("rendering", () => {
    it("renders the Docs heading", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView();
      expect(wrapper.find("h1").text()).toBe("Docs");
    });

    it("renders the aside sidebar with Folders heading", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView();
      expect(wrapper.find("aside").text()).toContain("Folders");
    });

    it("renders the FolderTree stub", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView();
      expect(wrapper.find("[data-testid='folder-tree']").exists()).toBeTruthy();
    });

    it("renders the ExplorerActions stub", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView();
      expect(wrapper.find("[data-testid='explorer-actions']").exists()).toBeTruthy();
    });

    it("renders the Breadcrumbs stub", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView();
      expect(wrapper.find("[data-testid='breadcrumbs']").exists()).toBeTruthy();
    });
  });

  // ── onMounted loading ──────────────────────────────────────────────────────
  describe("onMounted loading", () => {
    it("loads folders on mount", async () => {
      expect.hasAssertions();
      await mountDocsView();
      expect(Array.isArray(useFoldersStore().folders)).toBeTruthy();
    });

    it("loads docs on mount", async () => {
      expect.hasAssertions();
      await mountDocsView();
      expect(Array.isArray(useDocsStore().docs)).toBeTruthy();
    });
  });

  // ── visibleDocs ────────────────────────────────────────────────────────────
  describe("visibleDocs", () => {
    it("shows empty state when current folder has no docs", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView([]);
      expect(wrapper.text()).toContain("This folder is empty.");
    });

    describe("with seeded docs", () => {
      beforeEach(async () => {
        await db.docs.bulkAdd([
          {
            id: "d-root",
            title: "In Root",
            folderId: null,
            contentJSON: null,
            lastOpenedAt: null,
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: "d-other",
            title: "In Other",
            folderId: "f-root",
            contentJSON: null,
            lastOpenedAt: null,
            createdAt: 2,
            updatedAt: 2,
          },
        ]);
      });

      it("shows only docs belonging to the current folder (root = null)", async () => {
        expect.hasAssertions();
        const { wrapper } = await mountDocsView([]);
        expect(wrapper.text()).toContain("In Root");
        expect(wrapper.text()).not.toContain("In Other");
      });
    });
  });

  // ── subfolders ─────────────────────────────────────────────────────────────
  describe("subfolders", () => {
    it("shows only subfolders of the current folder", async () => {
      expect.hasAssertions();
      await db.folders.add({
        id: "f-child",
        name: "Child",
        parentId: null,
        type: "doc",
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      expect(wrapper.text()).toContain("Child");
    });
  });

  // ── handleCreateFolder ─────────────────────────────────────────────────────
  describe("handleCreateFolder", () => {
    it("creates a folder in the DB when ExplorerGrid emits createFolder", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "createFolder", "New Folder");
      expect((await db.folders.toArray()).some((f) => f.name === "New Folder")).toBeTruthy();
    });
  });

  // ── handleCreateFile ───────────────────────────────────────────────────────
  describe("handleCreateFile", () => {
    it("creates a doc in the DB when ExplorerGrid emits createFile", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "createFile", "My New Doc");
      expect((await db.docs.toArray()).some((d) => d.title === "My New Doc")).toBeTruthy();
    });

    it("navigates to the doc route after creating a doc", async () => {
      expect.hasAssertions();
      const { wrapper, router } = await mountDocsView([]);
      wrapper.findComponent(ExplorerGrid).vm.$emit("createFile", "Nav Doc");
      // handleCreateFile is async — wait until router actually changes
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("docs-doc");
      });
    });
  });

  // ── handleRenameFolder ─────────────────────────────────────────────────────
  describe("handleRenameFolder", () => {
    it("renames a folder in the DB when ExplorerGrid emits renameFolder", async () => {
      expect.hasAssertions();
      await db.folders.add({
        id: "rename-folder-id",
        name: "OldName",
        parentId: null,
        type: "doc",
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "renameFolder", "rename-folder-id", "NewName");
      expect((await db.folders.get("rename-folder-id"))?.name).toBe("NewName");
    });
  });

  // ── handleDeleteFolder ─────────────────────────────────────────────────────
  describe("handleDeleteFolder", () => {
    it("deletes a folder from the DB when ExplorerGrid emits deleteFolder", async () => {
      expect.hasAssertions();
      await db.folders.add({
        id: "delete-folder-id",
        name: "ToDelete",
        parentId: null,
        type: "doc",
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "deleteFolder", "delete-folder-id");
      await expect(db.folders.get("delete-folder-id")).resolves.toBeUndefined();
    });
  });

  // ── handleRenameFile ───────────────────────────────────────────────────────
  describe("handleRenameFile", () => {
    it("renames a doc in the DB when ExplorerGrid emits renameFile", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "rename-doc-id",
        title: "OldTitle",
        folderId: null,
        contentJSON: null,
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "renameFile", "rename-doc-id", "NewTitle");
      expect((await db.docs.get("rename-doc-id"))?.title).toBe("NewTitle");
    });

    it("falls back to 'Untitled' when renameFile is emitted with a blank name", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "blank-rename-doc-id",
        title: "HasTitle",
        folderId: null,
        contentJSON: null,
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "renameFile", "blank-rename-doc-id", "   ");
      expect((await db.docs.get("blank-rename-doc-id"))?.title).toBe("Untitled");
    });
  });

  // ── handleDeleteFile ───────────────────────────────────────────────────────
  describe("handleDeleteFile", () => {
    it("deletes a doc from the DB when ExplorerGrid emits deleteFile", async () => {
      expect.hasAssertions();
      await db.docs.add({
        id: "delete-doc-id",
        title: "ToDelete",
        folderId: null,
        contentJSON: null,
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "deleteFile", "delete-doc-id");
      await expect(db.docs.get("delete-doc-id")).resolves.toBeUndefined();
    });
  });

  // ── mobile drawer ──────────────────────────────────────────────────────────
  describe("mobile drawer", () => {
    it("opens the drawer when the mobile folders button is clicked", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView([]);
      await wrapper.find(String.raw`button.md\:hidden`).trigger("click");
      expect(wrapper.find("[data-testid='folder-tree-drawer']").exists()).toBeTruthy();
    });
  });
});
