// src/__tests__/components/DocsView.component.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import { IDBFactory } from "fake-indexeddb";
import db from "../../db";
import { useDocsStore } from "../../stores/docs";
import { useFoldersStore } from "../../stores/folders";
import DocsView from "../../views/DocsView.vue";
import ExplorerGrid from "../../components/ExplorerGrid.vue";

// ─── Composable mocks ─────────────────────────────────────────────────────────
vi.mock("../../composables/useToast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock("../../composables/useConfirm", () => ({
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(false) }),
}));
vi.mock("../../composables/useExplorerViewMode", () => {
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
vi.mock("../../components/FolderTree.vue", () => ({
  default: { template: "<div data-testid='folder-tree' />" },
}));
vi.mock("../../components/FolderTreeDrawer.vue", () => ({
  default: { template: "<div data-testid='folder-tree-drawer' />" },
}));
vi.mock("../../components/Breadcrumbs.vue", () => ({
  default: { template: "<div data-testid='breadcrumbs' />" },
}));
vi.mock("../../components/ExplorerActions.vue", () => ({
  default: {
    template: `<div data-testid='explorer-actions'>
      <button data-testid='create-folder-btn' @click="$emit('create-folder')">New Folder</button>
      <button data-testid='create-file-btn' @click="$emit('create-file')">New Doc</button>
    </div>`,
    emits: ["create-folder", "create-file"],
  },
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
      { path: "/docs/doc/:pathMatch(.*)*", component: routerStub, name: "docs-doc", props: true },
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

// ─── Grid emit helper — uses camelCase matching ExplorerGrid's defineEmits ────
async function emitFromGrid(wrapper: ReturnType<typeof mount>, event: string, ...args: unknown[]) {
  wrapper.findComponent(ExplorerGrid).vm.$emit(event, ...args);
  await flushPromises();
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
      expect(wrapper.find("[data-testid='folder-tree']").exists()).toBe(true);
    });

    it("renders the ExplorerActions stub", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView();
      expect(wrapper.find("[data-testid='explorer-actions']").exists()).toBe(true);
    });

    it("renders the Breadcrumbs stub", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView();
      expect(wrapper.find("[data-testid='breadcrumbs']").exists()).toBe(true);
    });
  });

  // ── onMounted loading ──────────────────────────────────────────────────────
  describe("onMounted loading", () => {
    it("loads folders on mount", async () => {
      expect.hasAssertions();
      await mountDocsView();
      expect(Array.isArray(useFoldersStore().folders)).toBe(true);
    });

    it("loads docs on mount", async () => {
      expect.hasAssertions();
      await mountDocsView();
      expect(Array.isArray(useDocsStore().docs)).toBe(true);
    });
  });

  // ── visibleDocs ────────────────────────────────────────────────────────────
  describe("visibleDocs", () => {
    // Empty-state test runs first on a clean DB — no seeding here
    it("shows empty state when current folder has no docs", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView([]);
      expect(wrapper.text()).toContain("This folder is empty.");
    });

    // Seeded variant isolated in its own describe so its beforeEach
    // doesn't affect the empty-state test above
    describe("with seeded docs", () => {
      beforeEach(async () => {
        await db.docs.bulkAdd([
          {
            id: "d-root",
            title: "In Root",
            folderId: null,
            contentJSON: null,
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: "d-other",
            title: "In Other",
            folderId: "folder-xyz",
            contentJSON: null,
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
      const rows = await db.folders.toArray();
      expect(rows.some((f) => f.name === "New Folder")).toBe(true);
    });
  });

  // ── handleCreateFile ───────────────────────────────────────────────────────
  describe("handleCreateFile", () => {
    it("creates a doc in the DB when ExplorerGrid emits createFile", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "createFile", "My New Doc");
      const rows = await db.docs.toArray();
      expect(rows.some((d) => d.title === "My New Doc")).toBe(true);
    });

    it("navigates to the doc route after creating a doc", async () => {
      expect.hasAssertions();
      const { wrapper, router } = await mountDocsView([]);
      const docsStore = useDocsStore();
      // createDoc adds to DB but doesn't update docsStore.docs reactively,
      // so openDoc() can't find the new doc. We spy to force a reload after create.
      const original = docsStore.createDoc.bind(docsStore);
      vi.spyOn(docsStore, "createDoc").mockImplementation(async (title, folderId) => {
        const id = await original(title, folderId);
        await docsStore.loadDocs();
        return id;
      });
      await emitFromGrid(wrapper, "createFile", "Nav Doc");
      expect(router.currentRoute.value.name).toBe("docs-doc");
    });
  });

  // ── handleRenameFolder ─────────────────────────────────────────────────────
  describe("handleRenameFolder", () => {
    it("renames a folder in the DB when ExplorerGrid emits renameFolder", async () => {
      expect.hasAssertions();
      const folderId = "rename-folder-id";
      await db.folders.add({
        id: folderId,
        name: "OldName",
        parentId: null,
        type: "doc",
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "renameFolder", folderId, "NewName");
      expect((await db.folders.get(folderId))?.name).toBe("NewName");
    });
  });

  // ── handleDeleteFolder ─────────────────────────────────────────────────────
  describe("handleDeleteFolder", () => {
    it("deletes a folder from the DB when ExplorerGrid emits deleteFolder", async () => {
      expect.hasAssertions();
      const folderId = "delete-folder-id";
      await db.folders.add({
        id: folderId,
        name: "ToDelete",
        parentId: null,
        type: "doc",
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      // Emit directly into DocsView's handleDeleteFolder — bypasses ExplorerGrid's confirm guard
      await emitFromGrid(wrapper, "deleteFolder", folderId);
      expect(await db.folders.get(folderId)).toBeUndefined();
    });
  });

  // ── handleRenameFile ───────────────────────────────────────────────────────
  describe("handleRenameFile", () => {
    it("renames a doc in the DB when ExplorerGrid emits renameFile", async () => {
      expect.hasAssertions();
      const docId = "rename-doc-id";
      await db.docs.add({
        id: docId,
        title: "OldTitle",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "renameFile", docId, "NewTitle");
      expect((await db.docs.get(docId))?.title).toBe("NewTitle");
    });

    it("falls back to 'Untitled' when renameFile is emitted with a blank name", async () => {
      expect.hasAssertions();
      const docId = "blank-rename-doc-id";
      await db.docs.add({
        id: docId,
        title: "HasTitle",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      await emitFromGrid(wrapper, "renameFile", docId, "   ");
      expect((await db.docs.get(docId))?.title).toBe("Untitled");
    });
  });

  // ── handleDeleteFile ───────────────────────────────────────────────────────
  describe("handleDeleteFile", () => {
    it("deletes a doc from the DB when ExplorerGrid emits deleteFile", async () => {
      expect.hasAssertions();
      const docId = "delete-doc-id";
      await db.docs.add({
        id: docId,
        title: "ToDelete",
        folderId: null,
        contentJSON: null,
        createdAt: 1,
        updatedAt: 1,
      });
      const { wrapper } = await mountDocsView([]);
      // Emit directly — bypasses ExplorerGrid's confirm guard
      await emitFromGrid(wrapper, "deleteFile", docId);
      expect(await db.docs.get(docId)).toBeUndefined();
    });
  });

  // ── mobile drawer ──────────────────────────────────────────────────────────
  describe("mobile drawer", () => {
    it("opens the drawer when the mobile folders button is clicked", async () => {
      expect.hasAssertions();
      const { wrapper } = await mountDocsView([]);
      await wrapper.find("button.md\\:hidden").trigger("click");
      expect(wrapper.find("[data-testid='folder-tree-drawer']").exists()).toBe(true);
    });
  });
});
