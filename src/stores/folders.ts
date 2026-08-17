// src/stores/folders.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "@/db";
import type { FeatureType, Folder } from "@/db/types";
import { useTodosStore } from "./todos";
import { useDocsStore } from "./docs";
import { useActivityStore } from "./activity";

export const useFoldersStore = defineStore("folders", () => {
  const folders = ref<Folder[]>([]);
  // We keep track of the last loaded type to know what to reload when a folder is created/deleted/renamed
  const lastLoadedType = ref<FeatureType | "mixed" | null>(null);

  async function loadFolders(type?: FeatureType | "mixed") {
    if (type) {
      folders.value = await db.folders.where("type").equals(type).toArray();
      lastLoadedType.value = type;
    } else {
      folders.value = await db.folders.toArray();
      lastLoadedType.value = null;
    }
  }

  async function createFolder(name: string, parentId: string | null, type: FeatureType | "mixed") {
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
    await useActivityStore().record("folder_created", folder.id);
    await reloadCurrent();
    return folder.id;
  }

  async function reloadCurrent() {
    if (lastLoadedType.value) {
      await loadFolders(lastLoadedType.value);
    } else {
      await loadFolders();
    }
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
    await reloadCurrent();
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
      (folderId) => folders.value.find((folder) => folder.id === folderId)?.type === "todo" || folders.value.find((folder) => folder.id === folderId)?.type === "mixed",
    );
    await Promise.all(
      todoFolderIds.map((folderId) => todosStore.deleteTodoListsByFolder(folderId)),
    );

    const docFolderIds = allIds.filter(
      (folderId) => folders.value.find((folder) => folder.id === folderId)?.type === "doc" || folders.value.find((folder) => folder.id === folderId)?.type === "mixed",
    );
    await Promise.all(docFolderIds.map((folderId) => docsStore.deleteDocsByFolder(folderId)));
    
    // TODO: also delete notes when note store has the equivalent method, but for now we just delete the folders
    await db.folders.bulkDelete(allIds);
    await reloadCurrent();
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
    await reloadCurrent();
  }

  return { createFolder, deleteFolder, folders, loadFolders, moveFolder, renameFolder };
});
