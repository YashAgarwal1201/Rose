import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createPinia, setActivePinia } from "pinia";
import db from "@/db";
import { useTrashStore } from "@/stores/trash";
import { useFoldersStore } from "@/stores/folders";
import { useDocsStore } from "@/stores/docs";
import { useNotesStore } from "@/stores/notes";
import { useTodosStore } from "@/stores/todos";

async function freshDb(): Promise<void> {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

describe("trashStore", () => {
  beforeEach(async () => {
    await db.folders.clear();
    await db.docs.clear();
    await db.notes.clear();
    await db.todoLists.clear();
    await db.todos.clear();
    setActivePinia(createPinia());
  });

  describe("moveToTrash", () => {
    it("moves a single doc to trash and removes it from active store", async () => {
      const docsStore = useDocsStore();
      const trashStore = useTrashStore();
      const docId = await docsStore.createDoc("Document 1", null);

      expect(docsStore.docs).toHaveLength(1);
      await trashStore.moveToTrash("doc", docId);

      expect(docsStore.docs).toHaveLength(0);
      expect(trashStore.trashedCount).toBe(1);
      expect(trashStore.trashedItems[0]?.title).toBe("Document 1");

      const inDb = await db.docs.get(docId);
      expect(inDb?.trashedAt).not.toBeNull();
      expect(inDb?.trashedByFolderId).toBeNull();
    });

    it("cascades folder children when a folder is moved to trash", async () => {
      const foldersStore = useFoldersStore();
      const docsStore = useDocsStore();
      const notesStore = useNotesStore();
      const todosStore = useTodosStore();
      const trashStore = useTrashStore();

      const folderId = await foldersStore.createFolder("Parent Folder", null);
      const subFolderId = await foldersStore.createFolder("Sub Folder", folderId);
      const docId = await docsStore.createDoc("Child Doc", subFolderId);
      const noteId = await notesStore.createNote("Child Note", folderId);
      const listId = await todosStore.createTodoList("Child List", folderId);

      await trashStore.moveToTrash("folder", folderId);

      // Active stores are empty
      expect(foldersStore.folders.filter((f) => f.id !== "vault")).toHaveLength(0);
      expect(docsStore.docs).toHaveLength(0);
      expect(notesStore.notes).toHaveLength(0);
      expect(todosStore.todoLists).toHaveLength(0);

      // Only top-level folder shows up in trash
      expect(trashStore.trashedCount).toBe(1);
      expect(trashStore.trashedItems[0]?.id).toBe(folderId);
      expect(trashStore.trashedItems[0]?.childCount).toBe(4); // subFolder + doc + note + list

      // In DB, cascaded children have trashedByFolderId set to folderId
      const doc = await db.docs.get(docId);
      expect(doc?.trashedByFolderId).toBe(folderId);
      const note = await db.notes.get(noteId);
      expect(note?.trashedByFolderId).toBe(folderId);
      const list = await db.todoLists.get(listId);
      expect(list?.trashedByFolderId).toBe(folderId);
      const subFolder = await db.folders.get(subFolderId);
      expect(subFolder?.trashedByFolderId).toBe(folderId);
    });

    it("throws when attempting to move a vaulted item to trash", async () => {
      const docsStore = useDocsStore();
      const trashStore = useTrashStore();

      await db.docs.add({
        id: "vaulted-doc",
        folderId: null,
        title: "Top Secret",
        contentJSON: null,
        isVaulted: true,
        iv: "sample-iv",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastOpenedAt: null,
        trashedAt: null,
        trashedByFolderId: null,
      });

      await expect(trashStore.moveToTrash("doc", "vaulted-doc")).rejects.toThrow(
        "Vaulted items cannot be moved to Trash."
      );
    });

    it("throws when attempting to move vault folder to trash", async () => {
      const trashStore = useTrashStore();
      await expect(trashStore.moveToTrash("folder", "vault")).rejects.toThrow(
        "Vaulted items cannot be moved to Trash."
      );
    });
  });

  describe("restoreItem", () => {
    it("restores an item cleanly to its original location", async () => {
      const docsStore = useDocsStore();
      const trashStore = useTrashStore();
      const docId = await docsStore.createDoc("Document 1", null);
      await trashStore.moveToTrash("doc", docId);

      expect(docsStore.docs).toHaveLength(0);
      await trashStore.restoreItem("doc", docId);

      expect(docsStore.docs).toHaveLength(1);
      expect(trashStore.trashedCount).toBe(0);
      const inDb = await db.docs.get(docId);
      expect(inDb?.trashedAt).toBeNull();
    });

    it("reassigns orphaned items to Files Root when parent folder is gone or trashed", async () => {
      const foldersStore = useFoldersStore();
      const docsStore = useDocsStore();
      const trashStore = useTrashStore();

      const folderId = await foldersStore.createFolder("Work", null);
      const docId = await docsStore.createDoc("Project Plan", folderId);

      // Directly trash the doc first
      await trashStore.moveToTrash("doc", docId);

      // Now trash the parent folder too
      await trashStore.moveToTrash("folder", folderId);

      // Restore the directly trashed doc
      await trashStore.restoreItem("doc", docId);

      const inDb = await db.docs.get(docId);
      expect(inDb?.trashedAt).toBeNull();
      expect(inDb?.folderId).toBeNull(); // Reassigned to root!
    });

    it("renames item with suffix on name collision during restore", async () => {
      const docsStore = useDocsStore();
      const trashStore = useTrashStore();

      const doc1 = await docsStore.createDoc("Report", null);
      await trashStore.moveToTrash("doc", doc1);

      // Create a new doc with the same name while the first is in trash
      await docsStore.createDoc("Report", null);

      // Restore original doc
      await trashStore.restoreItem("doc", doc1);

      const restored = await db.docs.get(doc1);
      expect(restored?.title).toBe("Report (Restored)");
      expect(restored?.trashedAt).toBeNull();
    });

    it("restores only cascaded children when a folder is restored, keeping pre-trashed items in trash", async () => {
      const foldersStore = useFoldersStore();
      const docsStore = useDocsStore();
      const trashStore = useTrashStore();

      const folderId = await foldersStore.createFolder("Projects", null);
      const docPreTrashed = await docsStore.createDoc("Old Draft", folderId);
      const docActive = await docsStore.createDoc("Active Plan", folderId);

      // Directly trash Old Draft on Monday
      await trashStore.moveToTrash("doc", docPreTrashed);

      // Trash Projects folder on Wednesday
      await trashStore.moveToTrash("folder", folderId);

      // Trash should show 2 top-level items: Old Draft and Projects
      expect(trashStore.trashedCount).toBe(2);

      // Restore Projects folder
      await trashStore.restoreItem("folder", folderId);

      // Old Draft remains in trash
      const oldDraftInDb = await db.docs.get(docPreTrashed);
      expect(oldDraftInDb?.trashedAt).not.toBeNull();
      expect(oldDraftInDb?.trashedByFolderId).toBeNull();

      // Active Plan is restored
      const activePlanInDb = await db.docs.get(docActive);
      expect(activePlanInDb?.trashedAt).toBeNull();
      expect(activePlanInDb?.trashedByFolderId).toBeNull();

      expect(docsStore.docs.map((d) => d.id)).toContain(docActive);
      expect(docsStore.docs.map((d) => d.id)).not.toContain(docPreTrashed);
    });
  });

  describe("deleteForever and emptyTrash", () => {
    it("deleteForever permanently removes item and any cascaded children", async () => {
      const foldersStore = useFoldersStore();
      const docsStore = useDocsStore();
      const trashStore = useTrashStore();

      const folderId = await foldersStore.createFolder("FolderToDelete", null);
      const docId = await docsStore.createDoc("DocInside", folderId);

      await trashStore.moveToTrash("folder", folderId);
      await trashStore.deleteForever("folder", folderId);

      expect(await db.folders.get(folderId)).toBeUndefined();
      expect(await db.docs.get(docId)).toBeUndefined();
      expect(trashStore.trashedCount).toBe(0);
    });

    it("emptyTrash wipes all trashed items and associated todos", async () => {
      const foldersStore = useFoldersStore();
      const docsStore = useDocsStore();
      const todosStore = useTodosStore();
      const trashStore = useTrashStore();

      const f1 = await foldersStore.createFolder("F1", null);
      const d1 = await docsStore.createDoc("D1", null);
      const l1 = await todosStore.createTodoList("L1", null);
      await todosStore.createTodo("T1", l1);

      await trashStore.moveToTrash("folder", f1);
      await trashStore.moveToTrash("doc", d1);
      await trashStore.moveToTrash("todoList", l1);

      expect(trashStore.trashedCount).toBe(3);

      await trashStore.emptyTrash();

      expect(trashStore.trashedCount).toBe(0);
      expect(await db.folders.get(f1)).toBeUndefined();
      expect(await db.docs.get(d1)).toBeUndefined();
      expect(await db.todoLists.get(l1)).toBeUndefined();
      expect((await db.todos.where("listId").equals(l1).toArray())).toHaveLength(0);
    });

    it("purgeExpired purges only items trashed over 30 days ago", async () => {
      const trashStore = useTrashStore();
      const now = Date.now();
      const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
      const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;

      await db.docs.add({
        id: "old-doc",
        folderId: null,
        title: "Old Doc",
        contentJSON: null,
        isVaulted: false,
        iv: null,
        createdAt: thirtyOneDaysAgo,
        updatedAt: thirtyOneDaysAgo,
        lastOpenedAt: null,
        trashedAt: thirtyOneDaysAgo,
        trashedByFolderId: null,
      });

      await db.docs.add({
        id: "recent-doc",
        folderId: null,
        title: "Recent Doc",
        contentJSON: null,
        isVaulted: false,
        iv: null,
        createdAt: fiveDaysAgo,
        updatedAt: fiveDaysAgo,
        lastOpenedAt: null,
        trashedAt: fiveDaysAgo,
        trashedByFolderId: null,
      });

      await trashStore.loadTrash();
      expect(trashStore.trashedCount).toBe(2);

      await trashStore.purgeExpired();

      expect(trashStore.trashedCount).toBe(1);
      expect(await db.docs.get("old-doc")).toBeUndefined();
      expect(await db.docs.get("recent-doc")).toBeDefined();
    });
  });
});
