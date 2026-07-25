// src/stores/docs.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "../db";
import type { Doc } from "../db/types";

export const useDocsStore = defineStore("docs", () => {
  const docs = ref<Doc[]>([]);

  async function loadDocs() {
    docs.value = await db.docs.toArray();
  }

  async function createDoc(title: string, folderId: string | null) {
    const trimmed = title.trim() || "Untitled";
    const duplicate = docs.value.find(
      (doc) => doc.folderId === folderId && doc.title.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A doc named "${trimmed}" already exists here.`);
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
    };
    await db.docs.add(doc);
    await loadDocs();
    return doc.id;
  }

  async function getDoc(id: string): Promise<Doc | undefined> {
    return db.docs.get(id);
  }

  // Marks a doc as opened "now" — powers Home's "recently opened" sort.
  // Call this once when a doc is actually navigated into.
  async function touchDoc(id: string) {
    await db.docs.update(id, { lastOpenedAt: Date.now() });
  }

  async function updateDoc(id: string, changes: Partial<Pick<Doc, "title" | "contentJSON">>) {
    const sanitized: Partial<Pick<Doc, "title" | "contentJSON">> = { ...changes };
    if ("contentJSON" in changes) {
      sanitized.contentJSON = changes.contentJSON ? structuredClone(changes.contentJSON) : null;
    }
    await db.docs.update(id, { ...sanitized, updatedAt: Date.now() });
  }

  async function deleteDoc(id: string) {
    await db.docs.delete(id);
    await loadDocs();
  }

  async function deleteDocsByFolder(folderId: string) {
    const targets = await db.docs.where("folderId").equals(folderId).toArray();
    await db.docs.bulkDelete(targets.map((doc) => doc.id));
  }

  return {
    createDoc,
    deleteDoc,
    deleteDocsByFolder,
    docs,
    getDoc,
    loadDocs,
    touchDoc,
    updateDoc,
  };
});
