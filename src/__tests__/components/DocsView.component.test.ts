import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import DocsView from "@/views/docs/DocsView.vue";
import ExplorerGrid from "@/components/explorer/ExplorerGrid.vue";

// ─── Composable mocks ─────────────────────────────────────────────────────────
vi.mock("@/composables/ui/useToast.ts", () => ({
  useToast: () => ({ showToast: vi.fn() }),
} as any));
vi.mock("@/composables/ui/useConfirm.ts", () => ({
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(false) }),
} as any));
vi.mock("@/composables/explorer/useExplorerViewMode.ts", () => {
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
vi.mock("@/components/explorer/ExplorerActions.vue", () => ({
  default: {
    template: `<div data-testid='explorer-actions'>
      <button data-testid='create-file-btn' @click="$emit('create-file')">New Doc</button>
    </div>`,
    emits: ["create-file"],
  } as any,
}));

// ─── Router factory ───────────────────────────────────────────────────────────
const routerStub = { template: "<div />" };
function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", redirect: "/docs" },
      {
        path: "/docs",
        component: routerStub,
        name: "docs-all",
      },
      {
        path: "/files/doc/:pathMatch(.*)*",
        component: routerStub,
        name: "files-doc",
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
async function mountDocsView() {
  const router = makeRouter();
  await router.push("/docs");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(DocsView, {
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

describe("DocsView.component.test.ts", () => {
  beforeEach(async () => {
    await freshDb();
    vi.clearAllMocks();
  });

  describe("Mounting and Initial Data Load", () => {
    it("loads all docs correctly", async () => {
      await db.docs.add({
        id: "doc-1",
        folderId: null,
        title: "Root Doc",
        contentJSON: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountDocsView();
      const grid = wrapper.findComponent(ExplorerGrid);
      expect(grid.props("folders")).toHaveLength(0);
      expect(grid.props("files")).toHaveLength(1);
      expect((grid.props("files") as any[])[0].name).toBe("Root Doc");
    });
  });

  describe("File Operations (ExplorerGrid emits)", () => {
    it("creates a new file and routes to it", async () => {
      const { wrapper, router } = await mountDocsView();
      const pushSpy = vi.spyOn(router, "push");
      await emitFromGrid(wrapper, "create-file", "My New Doc");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Expect DB insertion.
      const allDocs = await db.docs.toArray();
      expect(allDocs).toHaveLength(1);
      expect(allDocs[0]?.title).toBe("My New Doc");
      // Expect routing to the new file.
      expect(pushSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "files-doc",
          params: expect.objectContaining({ pathMatch: ["My New Doc"] }),
        }),
      );
    });

    it("renames a file successfully", async () => {
      await db.docs.add({
        id: "doc-7",
        folderId: null,
        title: "Old Title",
        contentJSON: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountDocsView();
      await emitFromGrid(wrapper, "rename-file", "doc-7", "New Title");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect((await db.docs.get("doc-7"))?.title).toBe("New Title");
    });

    it("deletes a file successfully", async () => {
      await db.docs.add({
        id: "doc-8",
        folderId: null,
        title: "Untouched Title",
        contentJSON: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountDocsView();
      await emitFromGrid(wrapper, "delete-file", "doc-8");
      await expect(db.docs.get("doc-8")).resolves.toBeUndefined();
    });
  });
});
