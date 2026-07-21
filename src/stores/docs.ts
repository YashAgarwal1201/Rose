import { defineStore } from "pinia";
import { ref } from "vue";
import db from "../db";
import type { Doc } from "../db/types";

export const useDocsStore = defineStore("docs", () => {
  const docs = ref<Doc[]>([]);

  // async function loadDocs(folderId: string | null) {
  //   docs.value = await db.docs
  //     .where("folderId")
  //     .equals(folderId as string)
  //     .toArray();
  // }

  async function loadDocs() {
    docs.value = await db.docs.toArray();
  }

  // async function createDoc(title: string, folderId: string | null) {
  //   const trimmed = title.trim() || "Untitled";
  //   const duplicate = docs.value.find(
  //     (doc) => doc.folderId === folderId && doc.title.toLowerCase() === trimmed.toLowerCase(),
  //   );
  //   if (duplicate) {
  //     throw new Error(`A doc named "${trimmed}" already exists here.`);
  //   }
  //   const now = Date.now();
  //   const doc: Doc = {
  //     contentJSON: null,
  //     createdAt: now,
  //     folderId,
  //     id: crypto.randomUUID(),
  //     title: trimmed,
  //     updatedAt: now,
  //   };
  //   await db.docs.add(doc);
  //   await loadDocs(folderId);
  //   return doc.id;
  // }

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

  async function updateDoc(id: string, changes: Partial<Pick<Doc, "title" | "contentJSON">>) {
    await db.docs.update(id, { ...changes, updatedAt: Date.now() });
  }

  // async function deleteDoc(id: string) {
  //   const target = docs.value.find((doc) => doc.id === id);
  //   await db.docs.delete(id);
  //   if (target) {
  //     await loadDocs(target.folderId);
  //   }
  // }

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
    updateDoc,
  };
});
