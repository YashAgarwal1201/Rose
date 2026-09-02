// src/__tests__/stores/folders.store.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import { useFoldersStore } from "../../stores/folders";
import { useTodosStore } from "../../stores/todos";

// beforeEach(async () => {
//   setActivePinia(createPinia());
//   await db.folders.clear(); // folders.store.test.ts only
//   await db.todoLists.clear();
//   await db.todos.clear();
// });

async function freshDb(): Promise<void> {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

describe("foldersStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.folders.clear();
    await db.todoLists.clear();
    await db.todos.clear();
  });

  describe("loadFolders", () => {
    it("loads folders of the given type into state", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.createFolder("Work", null, "todo");
      await store.loadFolders("todo");
      expect(store.folders).toHaveLength(1);
      expect(store.folders[0]?.name).toBe("Work");
    });

    it("returns an empty array when no folders exist for that type", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.loadFolders("todo");
      expect(store.folders).toHaveLength(0);
    });
  });

  describe("createFolder", () => {
    it("creates a folder and reflects it in state", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.createFolder("Personal", null, "todo");
      expect(store.folders).toHaveLength(1);
      expect(store.folders[0]?.name).toBe("Personal");
    });

    it("persists the folder in the DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.createFolder("Saved", null, "todo");
      const rows = await db.folders.toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.name).toBe("Saved");
    });

    it("throws when a duplicate name exists under the same parent", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.createFolder("Dup", null, "todo");
      await expect(store.createFolder("Dup", null, "todo")).rejects.toThrow("already exists");
    });

    it("is case-insensitive for duplicate detection", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.createFolder("Alpha", null, "todo");
      await expect(store.createFolder("ALPHA", null, "todo")).rejects.toThrow("already exists");
    });

    it("allows the same name under a different parent", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const parentId = await store.createFolder("Parent", null, "todo");
      await store.createFolder("Child", parentId, "todo");
      await store.createFolder("Child", null, "todo");
      expect(store.folders).toHaveLength(3);
    });

    it("trims whitespace from the folder name", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.createFolder("  Trimmed  ", null, "todo");
      expect(store.folders[0]?.name).toBe("Trimmed");
    });
  });

  describe("renameFolder", () => {
    it("renames a folder successfully", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const folderId = await store.createFolder("Old", null, "todo");
      await store.renameFolder(folderId, "New");
      const renamed = store.folders.find((folder) => folder.id === folderId);
      expect(renamed?.name).toBe("New");
    });

    it("updates updatedAt on rename", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const folderId = await store.createFolder("Before", null, "todo");
      const original = store.folders.find((folder) => folder.id === folderId);
      const createdAt = original?.updatedAt ?? 0;
      await new Promise((resolve) => setTimeout(resolve, 2));
      await store.renameFolder(folderId, "After");
      const row = await db.folders.get(folderId);
      expect(row?.updatedAt).toBeGreaterThan(createdAt);
    });

    it("throws when renaming to a duplicate name in the same parent", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.createFolder("Foo", null, "todo");
      const barId = await store.createFolder("Bar", null, "todo");
      await expect(store.renameFolder(barId, "Foo")).rejects.toThrow("already exists");
    });

    it("does nothing when the folder id does not exist", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.renameFolder("nonexistent-id", "Anything");
      expect(store.folders).toHaveLength(0);
    });
  });

  describe("deleteFolder", () => {
    it("deletes a leaf folder from state and DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const folderId = await store.createFolder("Leaf", null, "todo");
      await store.deleteFolder(folderId);
      expect(store.folders).toHaveLength(0);
      const row = await db.folders.get(folderId);
      expect(row).toBeUndefined();
    });

    it("deletes a folder and all its descendants", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const parentId = await store.createFolder("Parent", null, "todo");
      await store.createFolder("Child", parentId, "todo");
      await store.deleteFolder(parentId);
      expect(store.folders).toHaveLength(0);
    });

    it("cascade-deletes todo lists inside a deleted folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const foldersStore = useFoldersStore();
      const todosStore = useTodosStore();
      const folderId = await foldersStore.createFolder("F", null, "todo");
      await todosStore.createTodoList("List A", folderId);
      await foldersStore.deleteFolder(folderId);
      const lists = await db.todoLists.toArray();
      expect(lists).toHaveLength(0);
    });

    it("cascade-deletes todos inside lists of a deleted folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const foldersStore = useFoldersStore();
      const todosStore = useTodosStore();
      const folderId = await foldersStore.createFolder("F", null, "todo");
      const listId = await todosStore.createTodoList("List", folderId);
      await todosStore.loadTodos(listId);
      await todosStore.createTodo("Task", listId);
      await foldersStore.deleteFolder(folderId);
      const allTodos = await db.todos.toArray();
      expect(allTodos).toHaveLength(0);
    });

    it("does nothing when folder id does not exist", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.deleteFolder("ghost-id");
      expect(store.folders).toHaveLength(0);
    });
  });

  describe("moveFolder", () => {
    it("moves a folder to a new parent", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const parentId = await store.createFolder("Parent", null, "todo");
      const childId = await store.createFolder("Child", null, "todo");
      await store.moveFolder(childId, parentId);
      const moved = store.folders.find((folder) => folder.id === childId);
      expect(moved?.parentId).toBe(parentId);
    });

    it("moves a folder to root (null parent)", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const parentId = await store.createFolder("Parent", null, "todo");
      const childId = await store.createFolder("Child", parentId, "todo");
      await store.moveFolder(childId, null);
      const moved = store.folders.find((folder) => folder.id === childId);
      expect(moved?.parentId).toBeNull();
    });

    it("throws when moving a folder into itself", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const folderId = await store.createFolder("Solo", null, "todo");
      await expect(store.moveFolder(folderId, folderId)).rejects.toThrow(
        "Cannot move a folder into itself",
      );
    });

    it("throws when moving a folder into a destination with an existing folder of the same name", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      const parentId = await store.createFolder("Parent", null, "todo");
      await store.createFolder("TargetName", parentId, "todo");
      const folderIdToMove = await store.createFolder("TargetName", null, "todo");
      await expect(store.moveFolder(folderIdToMove, parentId)).rejects.toThrow("already exists");
    });

    it("throws when attempting to move, rename, or delete the vault folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      // Don't pre-add vault - loadFolders auto-seeds it now
      const store = useFoldersStore();
      await store.loadFolders();

      const targetId = await store.createFolder("Target", null, "todo");
      await expect(store.moveFolder("vault", targetId)).rejects.toThrow("Secure Vault cannot be moved.");
      await expect(store.renameFolder("vault", "New Vault Name")).rejects.toThrow("Secure Vault cannot be renamed.");
      await expect(store.deleteFolder("vault")).rejects.toThrow("Secure Vault cannot be deleted.");
    });

    it("seeds the vault folder automatically on fresh DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useFoldersStore();
      await store.loadFolders();

      const vaultInDb = await db.folders.get("vault");
      expect(vaultInDb).toBeTruthy();
      expect(vaultInDb?.parentId).toBeNull();
      expect(vaultInDb?.isVaulted).toBe(true);
    });

    it("auto-repairs vault parentId and isVaulted if corrupted in DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      await db.folders.add({
        id: "vault",
        name: "Secure Vault",
        parentId: "some-corrupted-parent-id",
        type: "mixed",
        isVaulted: false, // simulates vault being moved to a non-vaulted folder
        iv: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const store = useFoldersStore();
      await store.loadFolders();

      const vaultInDb = await db.folders.get("vault");
      expect(vaultInDb?.parentId).toBeNull();
      expect(vaultInDb?.isVaulted).toBe(true);
    });
  });
});

