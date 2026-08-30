// src/stores/folders.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "@/db";
import type { FeatureType, Folder } from "@/db/types";
import { useTodosStore } from "./todos";
import { useDocsStore } from "./docs";
import { useActivityStore } from "./activity";
import { useVaultStore } from "./vault";
import { encryptJSONField, decryptJSONField, encryptField, decryptField } from "@/utils/crypto";

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

    const vault = await db.folders.get("vault");
    if (!vault) {
      // Fresh DB - seed the vault folder
      await db.folders.add({
        id: "vault",
        name: "Secure Vault",
        parentId: null,
        type: "mixed",
        isVaulted: true,
        iv: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else if (vault.parentId !== null || !vault.isVaulted) {
      // Repair any corruption: ensure vault is always at root and always isVaulted
      await db.folders.update("vault", { parentId: null, isVaulted: true });
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
    let isVaulted = false;
    if (parentId) {
      const parent = await db.folders.get(parentId);
      isVaulted = parent?.isVaulted ?? false;
    }

    const now = Date.now();
    const folder: Folder = {
      createdAt: now,
      id: crypto.randomUUID(),
      name: trimmed,
      parentId,
      type: "mixed",
      updatedAt: now,
      isVaulted,
      iv: null,
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
    if (id === "vault") {
      throw new Error("Secure Vault cannot be renamed.");
    }
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
    if (id === "vault") {
      throw new Error("Secure Vault cannot be deleted.");
    }
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
    if (id === "vault") {
      throw new Error("Secure Vault cannot be moved.");
    }
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

    let newIsVaulted = false;
    if (newParentId) {
      const parent = await db.folders.get(newParentId);
      newIsVaulted = parent?.isVaulted ?? false;
    }

    if (target.isVaulted !== newIsVaulted) {
      await setFolderVaultedState(id, newIsVaulted);
    }

    await db.folders.update(id, { name: nameToUse, parentId: newParentId, updatedAt: Date.now(), isVaulted: newIsVaulted });
    if (newParentId) {
      await ensureFolderSupports(newParentId, "mixed");
    }
    await reloadCurrent();
  }

  async function setFolderVaultedState(folderId: string, isVaulted: boolean) {
    const vaultStore = useVaultStore();
    if (!vaultStore.derivedKey) throw new Error("Vault is locked");

    const allFoldersToUpdate = new Set<string>();
    const queue = [folderId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = await db.folders.where("parentId").equals(current).toArray();
      for (const child of children) {
        allFoldersToUpdate.add(child.id);
        queue.push(child.id);
      }
    }

    const folderIds = Array.from(allFoldersToUpdate);
    if (folderIds.length > 0) {
      await db.folders.where("id").anyOf(folderIds).modify({ isVaulted });
    }

    // Docs
    const docs = await db.docs.where("folderId").anyOf([folderId, ...folderIds]).toArray();
    for (const doc of docs) {
      doc.isVaulted = isVaulted;
      if (isVaulted) {
        if (doc.contentJSON) await encryptJSONField(vaultStore.derivedKey, doc, "contentJSON");
      } else {
        if (doc.contentJSON) {
          await decryptJSONField(vaultStore.derivedKey, doc, "contentJSON");
          doc.iv = null;
        }
      }
    }
    if (docs.length > 0) await db.docs.bulkPut(docs);

    // Notes
    const notes = await db.notes.where("folderId").anyOf([folderId, ...folderIds]).toArray();
    for (const note of notes) {
      note.isVaulted = isVaulted;
      if (isVaulted) {
        if (note.canvasJSON) await encryptJSONField(vaultStore.derivedKey, note, "canvasJSON");
        if (note.thumbnail) await encryptField(vaultStore.derivedKey, note, "thumbnail");
      } else {
        if (note.canvasJSON) await decryptJSONField(vaultStore.derivedKey, note, "canvasJSON");
        if (note.thumbnail) await decryptField(vaultStore.derivedKey, note, "thumbnail");
        note.iv = null;
      }
    }
    if (notes.length > 0) await db.notes.bulkPut(notes);

    // TodoLists & Todos
    const lists = await db.todoLists.where("folderId").anyOf([folderId, ...folderIds]).toArray();
    for (const list of lists) {
      list.isVaulted = isVaulted;
    }
    if (lists.length > 0) await db.todoLists.bulkPut(lists);

    const listIds = lists.map(l => l.id);
    if (listIds.length > 0) {
      const todosList = await db.todos.where("listId").anyOf(listIds).toArray();
      for (const todo of todosList) {
        todo.isVaulted = isVaulted;
        if (isVaulted) {
          await encryptField(vaultStore.derivedKey, todo, "title");
        } else {
          await decryptField(vaultStore.derivedKey, todo, "title");
          todo.iv = null;
        }
      }
      if (todosList.length > 0) await db.todos.bulkPut(todosList);
    }
  }

  return { createFolder, deleteFolder, ensureFolderSupports, folders, isDescendantOf, loadFolders, moveFolder, renameFolder };
});
