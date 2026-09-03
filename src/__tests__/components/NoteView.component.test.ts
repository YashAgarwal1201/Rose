import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import NoteView from "@/views/notes/NoteView.vue";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import { useFoldersStore } from "../../stores/folders";
import { useNotesStore } from "../../stores/notes";
import "fake-indexeddb/auto";
import { nextTick, ref } from "vue";

// Mock router
const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    currentRoute: ref({
      name: "notes-note",
      params: { pathMatch: ["My Note"] },
    }),
  }),
}));

// Mock toast
const showToastMock = vi.fn();
vi.mock('@/composables/ui/useToast.ts', () => ({
  useToast: () => ({ showToast: showToastMock }),
} as any));

// Mock toolbar position
vi.mock('../../composables/useToolbarPosition', () => ({
  useToolbarPosition: () => ({
    effectivePosition: ref("top"),
    savedPosition: ref("top"),
    isMobile: ref(false),
    setPosition: vi.fn(),
  }),
} as any));

// Mock HandwritingCanvas to avoid rendering fabric
vi.mock('../../components/notes/HandwritingCanvas.vue', () => ({
  default: {
    template: "<div data-testid='note-canvas'></div>",
    props: ["initialCanvasJson", "initialBackgroundColor", "toolbarPosition"],
  },
} as any));

describe("NoteView.vue", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.docs.clear();
    await db.folders.clear();
    await db.notes.clear();
    await db.todos.clear();
    vi.clearAllMocks();
  });

  async function mountNoteView(pathMatch: string[]) {
    const wrapper = mount(NoteView, {
      props: { pathMatch },
    });
    // Wait for onMounted loadNote
    await new Promise((resolve) => setTimeout(resolve, 50));
    await nextTick();
    return wrapper;
  }

  describe("loadNote", () => {
    it("redirects to /notes/folder when path is empty", async () => {
      await mountNoteView([]);
      expect(showToastMock).toHaveBeenCalledWith("Note not found.", "error");
      expect(replaceMock).toHaveBeenCalledWith("/notes");
    });

    it("redirects to /notes/folder when folder doesn't resolve", async () => {
      await mountNoteView(["Missing Folder", "Some Note"]);
      expect(showToastMock).toHaveBeenCalledWith("That note no longer exists.", "error");
      expect(replaceMock).toHaveBeenCalledWith("/notes");
    });

    it("redirects to folder path when note name doesn't match", async () => {
      await db.folders.add({
        id: "folder-1",
        name: "My Folder",
        parentId: null,
        type: "note",
        createdAt: 1,
        updatedAt: 1,
        isVaulted: false,
        iv: null,
      });
      await mountNoteView(["My Folder", "Missing Note"]);
      expect(showToastMock).toHaveBeenCalledWith("That note no longer exists.", "error");
      expect(replaceMock).toHaveBeenCalledWith({
        name: "files-folder",
        params: { pathMatch: ["My Folder"] },
      });
    });

    it("renders the note title when it resolves", async () => {
      await db.notes.add({
        id: "note-1",
        title: "Test Note",
        folderId: null,
        canvasJSON: null,
        backgroundColor: "#fff",
        backgroundPattern: "solid",
        thumbnail: "",
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
        isVaulted: false,
        iv: null,
      });
      const wrapper = await mountNoteView(["Test Note"]);
      expect(wrapper.find("h1").text()).toBe("Test Note");
      expect(wrapper.findComponent({ name: "NoteCanvas" }).exists()).toBeTruthy();
    });
  });

  describe("renaming", () => {
    it("enters rename mode when clicking the pencil button", async () => {
      await db.notes.add({
        id: "note-2",
        title: "Old Title",
        folderId: null,
        canvasJSON: null,
        backgroundColor: "#fff",
        backgroundPattern: "solid",
        thumbnail: "",
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
        isVaulted: false,
        iv: null,
      });
      const wrapper = await mountNoteView(["Old Title"]);
      await wrapper.find("button .lucide-pencil").trigger("click");
      const input = wrapper.find("input[type='text']");
      expect(input.exists()).toBeTruthy();
      expect((input.element as HTMLInputElement).value).toBe("Old Title");
    });

    it("renames the note and updates router on enter", async () => {
      await db.notes.add({
        id: "note-3",
        title: "Old Title",
        folderId: null,
        canvasJSON: null,
        backgroundColor: "#fff",
        backgroundPattern: "solid",
        thumbnail: "",
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
        isVaulted: false,
        iv: null,
      });
      const wrapper = await mountNoteView(["Old Title"]);
      await wrapper.find("button .lucide-pencil").trigger("click");
      const input = wrapper.find("input[type='text']");
      await input.setValue("New Title");
      await input.trigger("keyup.enter");
      
      // Wait for DB update and router replace
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(replaceMock).toHaveBeenCalledWith({
        name: "notes-note",
        params: { pathMatch: ["New Title"] },
      });
      expect(wrapper.find("h1").text()).toBe("New Title");
    });
  });

  describe("canvas changes", () => {
    it("updates the note in the store when the canvas changes", async () => {
      await db.notes.add({
        id: "note-4",
        title: "Canvas Note",
        folderId: null,
        canvasJSON: null,
        backgroundColor: "#fff",
        backgroundPattern: "solid",
        thumbnail: "",
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
        isVaulted: false,
        iv: null,
      });
      const wrapper = await mountNoteView(["Canvas Note"]);
      
      const canvasComponent = wrapper.findComponent({ name: "NoteCanvas" });
      const newCanvasJSON = { type: "rect" };
      await canvasComponent.vm.$emit("change", newCanvasJSON, "#000", "thumb");
      
      // DB operation
      await new Promise((resolve) => setTimeout(resolve, 50));
      const updatedNote = await db.notes.get("note-4");
      expect(updatedNote?.canvasJSON).toStrictEqual(newCanvasJSON);
      expect(updatedNote?.backgroundColor).toBe("#000");
    });
  });

  describe("navigation", () => {
    it("goes back to the folder when the back button is clicked", async () => {
      await db.folders.add({
        id: "folder-3",
        name: "Nested",
        parentId: null,
        type: "note",
        createdAt: 1,
        updatedAt: 1,
        isVaulted: false,
        iv: null,
      });
      await db.notes.add({
        id: "note-5",
        title: "Inside",
        folderId: "folder-3",
        canvasJSON: null,
        backgroundColor: "#fff",
        backgroundPattern: "solid",
        thumbnail: "",
        lastOpenedAt: null,
        createdAt: 1,
        updatedAt: 1,
        isVaulted: false,
        iv: null,
      });
      const wrapper = await mountNoteView(["Nested", "Inside"]);
      await wrapper.find("button .lucide-arrow-left").trigger("click");
      expect(pushMock).toHaveBeenCalledWith({
        name: "files-folder",
        params: { pathMatch: ["Nested"] },
      });
    });
  });
});
