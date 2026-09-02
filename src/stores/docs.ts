// src/stores/docs.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "@/db";
import type { Doc } from "@/db/types";
import { useActivityStore } from "./activity";
import { useFoldersStore } from "./folders";
import { useVaultStore } from "./vault";
import { encryptJSONField, decryptJSONField } from "@/utils/crypto";

export const useDocsStore = defineStore("docs", () => {
  const docs = ref<Doc[]>([]);

  async function loadDocs() {
    docs.value = await db.docs.toArray();
  }

  async function createDoc(title: string, folderId: string | null) {
    const trimmed = title.trim() || "Untitled document";
    const duplicate = docs.value.find(
      (doc) => doc.folderId === folderId && doc.title.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A document named "${trimmed}" already exists here.`);
    }
    let isVaulted = false;
    if (folderId) {
      const folder = await db.folders.get(folderId);
      isVaulted = folder?.isVaulted ?? false;
    }

    const now = Date.now();
    const doc: Doc = {
      contentJSON: null,
      createdAt: now,
      folderId,
      id: crypto.randomUUID(),
      lastOpenedAt: null,
      title: trimmed,
      updatedAt: now,
      isVaulted,
      iv: null,
    };
    await db.docs.add(doc);
    await useActivityStore().record("doc_created", doc.id);
    if (folderId) {
      await useFoldersStore().ensureFolderSupports(folderId, "doc");
    }
    await loadDocs();
    return doc.id;
  }

  async function getDoc(id: string): Promise<Doc | undefined> {
    const doc = await db.docs.get(id);
    if (!doc) return;
    if (doc.isVaulted && doc.contentJSON) {
      const vault = useVaultStore();
      if (!vault.derivedKey) throw new Error("Vault is locked");
      await decryptJSONField(vault.derivedKey, doc, "contentJSON");
    }
    return doc;
  }

  // Marks a doc as opened "now" — powers Home's "recently opened" sort.
  // Call this once when a doc is actually navigated into.
  async function touchDoc(id: string) {
    await db.docs.update(id, { lastOpenedAt: Date.now() });
  }

  async function updateDoc(id: string, changes: Partial<Pick<Doc, "title" | "contentJSON">>) {
    const sanitized: Partial<Doc> = { ...changes, updatedAt: Date.now() };
    if ("contentJSON" in changes) {
      sanitized.contentJSON = changes.contentJSON ? structuredClone(changes.contentJSON) : null;
    }
    const doc = await db.docs.get(id);
    if (doc?.isVaulted && "contentJSON" in sanitized && sanitized.contentJSON) {
      const vault = useVaultStore();
      if (!vault.derivedKey) throw new Error("Vault is locked");
      await encryptJSONField(vault.derivedKey, sanitized as Partial<Doc> & { iv: string | null }, "contentJSON");
    }
    await db.docs.update(id, sanitized);
    if ("contentJSON" in changes) {
      await useActivityStore().record("doc_updated", id);
    }
  }

  async function deleteDoc(id: string) {
    await db.docs.delete(id);
    await loadDocs();
  }

  async function deleteDocsByFolder(folderId: string) {
    const targets = await db.docs.where("folderId").equals(folderId).toArray();
    await db.docs.bulkDelete(targets.map((doc) => doc.id));
  }

  async function moveDoc(id: string, newFolderId: string | null, newTitle?: string) {
    const target = docs.value.find((doc) => doc.id === id);
    if (!target) {
      return;
    }

    if (target.folderId === newFolderId && (!newTitle || newTitle.trim() === target.title)) {
      return;
    }

    const titleToUse = (newTitle || target.title).trim();
    const duplicate = docs.value.find(
      (doc) =>
        doc.id !== id &&
        doc.folderId === newFolderId &&
        doc.title.toLowerCase() === titleToUse.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A document named "${titleToUse}" already exists in the destination.`);
    }

    let newIsVaulted = false;
    if (newFolderId) {
      const parent = await db.folders.get(newFolderId);
      newIsVaulted = parent?.isVaulted ?? false;
    }

    const updatePayload: Partial<Doc> = { 
      folderId: newFolderId, 
      title: titleToUse, 
      updatedAt: Date.now(),
      isVaulted: newIsVaulted 
    };

    const dbDoc = await db.docs.get(id);
    if (dbDoc && dbDoc.isVaulted !== newIsVaulted) {
      const vault = useVaultStore();
      if (!vault.derivedKey) throw new Error("Vault is locked");
      
      if (newIsVaulted) {
        if (dbDoc.contentJSON) {
          await encryptJSONField(vault.derivedKey, dbDoc, "contentJSON");
          updatePayload.contentJSON = dbDoc.contentJSON;
          updatePayload.iv = dbDoc.iv;
        }
      } else {
        if (dbDoc.contentJSON) {
          await decryptJSONField(vault.derivedKey, dbDoc, "contentJSON");
          updatePayload.contentJSON = dbDoc.contentJSON;
          updatePayload.iv = null;
        }
      }
    }

    await db.docs.update(id, updatePayload);
    if (newFolderId) {
      await useFoldersStore().ensureFolderSupports(newFolderId, "doc");
    }
    await loadDocs();
  }

  return {
    createDoc,
    deleteDoc,
    deleteDocsByFolder,
    docs,
    getDoc,
    loadDocs,
    moveDoc,
    touchDoc,
    updateDoc,
  };
});

