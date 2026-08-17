import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import TodosView from "@/views/todos/TodosView.vue";
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
      <button data-testid='create-file-btn' @click="$emit('create-file')">New List</button>
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
      { path: "/", redirect: "/todos" },
      {
        path: "/todos",
        component: routerStub,
        name: "todos-all",
      },
      {
        path: "/files/list/:pathMatch(.*)*",
        component: routerStub,
        name: "files-list",
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
async function mountTodosView() {
  const router = makeRouter();
  await router.push("/todos");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(TodosView, {
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
    it("loads all lists correctly", async () => {
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
      expect(grid.props("folders")).toHaveLength(0);
      expect(grid.props("files")).toHaveLength(1);
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

      // Expect routing to the new list
      expect(pushSpy).toHaveBeenCalledWith({
        name: "files-list",
        params: { pathMatch: ["My New List"] },
      });
    });

    it("opens an existing list via open-file event", async () => {
      await db.todoLists.add({
        id: "list-6",
        folderId: null,
        name: "Target List",
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper, router } = await mountTodosView();
      const pushSpy = vi.spyOn(router, "push");
      await emitFromGrid(wrapper, "open-file", "list-6");
      expect(pushSpy).toHaveBeenCalledWith({
        name: "files-list",
        params: { pathMatch: ["Target List"] },
      });
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
      await expect(db.todoLists.get("list-8")).resolves.toBeUndefined();
    });
  });
});
