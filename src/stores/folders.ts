// src/stores/folders.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "../db";
import type { FeatureType, Folder } from "../db/types";
import { useTodosStore } from "./todos";
import { useDocsStore } from "./docs";

export const useFoldersStore = defineStore("folders", () => {
  const folders = ref<Folder[]>([]);

  async function loadFolders(type: FeatureType) {
    folders.value = await db.folders.where("type").equals(type).toArray();
  }

  async function createFolder(name: string, parentId: string | null, type: FeatureType) {
    const trimmed = name.trim();
    const duplicate = folders.value.find(
      (folder) =>
        folder.parentId === parentId &&
        folder.type === type &&
        folder.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A folder named "${trimmed}" already exists here.`);
    }
    const now = Date.now();
    const folder: Folder = {
      createdAt: now,
      id: crypto.randomUUID(),
      name: trimmed,
      parentId,
      type,
      updatedAt: now,
    };
    await db.folders.add(folder);
    await loadFolders(type);
    return folder.id;
  }

  async function renameFolder(id: string, name: string) {
    const trimmed = name.trim();
    const target = folders.value.find((folder) => folder.id === id);
    if (!target) {
      return;
    }
    const duplicate = folders.value.find(
      (folder) =>
        folder.id !== id &&
        folder.parentId === target.parentId &&
        folder.type === target.type &&
        folder.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A folder named "${trimmed}" already exists here.`);
    }
    await db.folders.update(id, { name: trimmed, updatedAt: Date.now() });
    await loadFolders(target.type);
  }

  function collectDescendantIds(id: string): string[] {
    const result: string[] = [];
    const queue = [id];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = folders.value.filter((folder) => folder.parentId === currentId);
      for (const child of children) {
        result.push(child.id);
        queue.push(child.id);
      }
    }
    return result;
  }

  // async function deleteFolder(id: string) {
  //   const target = folders.value.find((folder) => folder.id === id);
  //   if (!target) {
  //     return;
  //   }

  //   const descendantIds = collectDescendantIds(id);
  //   const allIds = [id, ...descendantIds];
  //   const todosStore = useTodosStore();

  //   const todoFolderIds = allIds.filter(
  //     (folderId) => folders.value.find((folder) => folder.id === folderId)?.type === "todo",
  //   );
  //   await Promise.all(
  //     todoFolderIds.map((folderId) => todosStore.deleteTodoListsByFolder(folderId)),
  //   );

  //   await db.folders.bulkDelete(allIds);
  //   await loadFolders(target.type);
  // }

  async function deleteFolder(id: string) {
    const target = folders.value.find((folder) => folder.id === id);
    if (!target) {
      return;
    }

    const descendantIds = collectDescendantIds(id);
    const allIds = [id, ...descendantIds];
    const todosStore = useTodosStore();
    const docsStore = useDocsStore();

    const todoFolderIds = allIds.filter(
      (folderId) => folders.value.find((folder) => folder.id === folderId)?.type === "todo",
    );
    await Promise.all(
      todoFolderIds.map((folderId) => todosStore.deleteTodoListsByFolder(folderId)),
    );

    const docFolderIds = allIds.filter(
      (folderId) => folders.value.find((folder) => folder.id === folderId)?.type === "doc",
    );
    await Promise.all(docFolderIds.map((folderId) => docsStore.deleteDocsByFolder(folderId)));

    await db.folders.bulkDelete(allIds);
    await loadFolders(target.type);
  }

  function isDescendantOf(candidateId: string, ancestorId: string): boolean {
    let cursor: string | null = candidateId;
    while (cursor !== null) {
      if (cursor === ancestorId) {
        return true;
      }
      cursor = folders.value.find((folder) => folder.id === cursor)?.parentId ?? null;
    }
    return false;
  }

  async function moveFolder(id: string, newParentId: string | null) {
    if (newParentId !== null) {
      if (newParentId === id || isDescendantOf(newParentId, id)) {
        throw new Error("Cannot move a folder into itself or one of its own subfolders.");
      }
    }
    await db.folders.update(id, { parentId: newParentId, updatedAt: Date.now() });
    const target = folders.value.find((folder) => folder.id === id);
    if (target) {
      await loadFolders(target.type);
    }
  }

  return { createFolder, deleteFolder, folders, loadFolders, moveFolder, renameFolder };
});
