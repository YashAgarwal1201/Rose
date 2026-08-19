import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import NotesView from "@/views/notes/NotesView.vue";
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
      <button data-testid='create-file-btn' @click="$emit('create-file')">New Note</button>
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
      { path: "/", redirect: "/notes" },
      {
        path: "/notes",
        component: routerStub,
        name: "notes-all",
      },
      {
        path: "/files/note/:pathMatch(.*)*",
        component: routerStub,
        name: "files-note",
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
async function mountNotesView() {
  const router = makeRouter();
  await router.push("/notes");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(NotesView, {
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
    it("loads all notes correctly", async () => {
      await db.notes.add({
        id: "note-1",
        folderId: null,
        title: "Root Note",
        canvasJSON: null,
        backgroundColor: "#fff",
        backgroundPattern: "solid",
        thumbnail: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountNotesView();
      const grid = wrapper.findComponent(ExplorerGrid);
      expect(grid.props("folders")).toHaveLength(0);
      expect(grid.props("files")).toHaveLength(1);
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
          name: "files-note",
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
        backgroundPattern: "solid",
        thumbnail: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountNotesView();
      await emitFromGrid(wrapper, "rename-file", "note-7", "New Title");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect((await db.notes.get("note-7"))?.title).toBe("New Title");
    });

    it("deletes a file successfully", async () => {
      await db.notes.add({
        id: "note-8",
        folderId: null,
        title: "Untouched Title",
        canvasJSON: null,
        backgroundColor: "#fff",
        backgroundPattern: "solid",
        thumbnail: null,
        lastOpenedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const { wrapper } = await mountNotesView();
      await emitFromGrid(wrapper, "delete-file", "note-8");
      await expect(db.notes.get("note-8")).resolves.toBeUndefined();
    });
  });
});
