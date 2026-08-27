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
  const lastLoadedType = ref<FeatureType | "mixed" | null>(null);
  let migrated = false;

  async function loadFolders(type?: FeatureType | "mixed") {
    if (!migrated) {
      const all = await db.folders.toArray();
      const updates = all
        .filter(f => f.type !== "mixed")
        .map(f => db.folders.update(f.id, { type: "mixed" }));
      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`Migrated ${updates.length} existing folders to 'mixed' type`);
      }
      migrated = true;
    }

    if (type) {
      const allFolders = await db.folders.toArray();
      folders.value = allFolders.filter(f => f.type === type || f.type === "mixed");
      lastLoadedType.value = type;
    } else {
      folders.value = await db.folders.toArray();
      lastLoadedType.value = null;
    }
  }

  async function ensureFolderSupports(folderId: string | null, requiredType: FeatureType | "mixed") {
    let cursor = folderId;
    let changed = false;
    
    // We need to fetch from DB directly in case folders.value is currently filtered
    // and doesn't contain the folder we are trying to upgrade.
    while (cursor) {
      const folder = await db.folders.get(cursor);
      if (!folder) break;
      
      if (folder.type !== requiredType && folder.type !== "mixed") {
        await db.folders.update(cursor, { type: "mixed", updatedAt: Date.now() });
        changed = true;
      }
      cursor = folder.parentId;
    }
    
    if (changed) {
      await reloadCurrent();
    }
  }

  async function createFolder(name: string, parentId: string | null, _type: FeatureType | "mixed" = "mixed") {
    const trimmed = name.trim() || "Untitled folder";
    const duplicate = folders.value.find(
      (folder) =>
        folder.parentId === parentId &&
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
      type: "mixed", // All folders are mixed by default now
      updatedAt: now,
    };
    await db.folders.add(folder);
    await useActivityStore().record("folder_created", folder.id);
    await ensureFolderSupports(parentId, "mixed");
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

  async function moveFolder(id: string, newParentId: string | null, newName?: string) {
    if (newParentId !== null) {
      if (newParentId === id || isDescendantOf(newParentId, id)) {
        throw new Error("Cannot move a folder into itself or one of its own subfolders.");
      }
    }
    const target = folders.value.find((folder) => folder.id === id);
    if (!target) {
      return;
    }

    if (target.parentId === newParentId && (!newName || newName.trim() === target.name)) {
      return;
    }

    const nameToUse = (newName || target.name).trim();
    const duplicate = folders.value.find(
      (folder) =>
        folder.id !== id &&
        folder.parentId === newParentId &&
        folder.name.toLowerCase() === nameToUse.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A folder named "${nameToUse}" already exists in the destination.`);
    }

    await db.folders.update(id, { name: nameToUse, parentId: newParentId, updatedAt: Date.now() });
    if (newParentId) {
      await ensureFolderSupports(newParentId, "mixed");
    }
    await reloadCurrent();
  }

  return { createFolder, deleteFolder, ensureFolderSupports, folders, isDescendantOf, loadFolders, moveFolder, renameFolder };
});
