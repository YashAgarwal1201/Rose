// src/__tests__/stores/docs.store.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import { useDocsStore } from "../../stores/docs";

async function freshDb(): Promise<void> {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

describe("docsStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.docs.clear();
  });

  // ─────────────────────────────────────────────
  // loadDocs
  // ─────────────────────────────────────────────
  describe("loadDocs", () => {
    it("returns empty state when DB is empty", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.loadDocs();
      expect(store.docs).toHaveLength(0);
    });

    it("loads all docs from DB into state", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Alpha", null);
      await store.createDoc("Beta", null);
      // reset state to simulate a fresh page load
      store.docs.splice(0);
      await store.loadDocs();
      expect(store.docs).toHaveLength(2);
    });

    it("reflects the latest DB state on re-load", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("Initial", null);
      await store.updateDoc(id, { title: "Updated" });
      await store.loadDocs();
      const found = store.docs.find((d) => d.id === id);
      expect(found?.title).toBe("Updated");
    });
  });

  // ─────────────────────────────────────────────
  // createDoc
  // ─────────────────────────────────────────────
  describe("createDoc", () => {
    it("creates a doc and reflects it in state", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("My Doc", null);
      expect(store.docs).toHaveLength(1);
      expect(store.docs[0]?.title).toBe("My Doc");
    });

    it("persists the doc to the DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Persisted", null);
      const rows = await db.docs.toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.title).toBe("Persisted");
    });

    it("trims whitespace from the title", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("  Trimmed  ", null);
      expect(store.docs[0]?.title).toBe("Trimmed");
    });

    it("falls back to 'Untitled' for a blank title", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("   ", null);
      expect(store.docs[0]?.title).toBe("Untitled document");
    });

    it("sets folderId correctly on the created doc", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("In Folder", "folder-abc");
      expect(store.docs[0]?.folderId).toBe("folder-abc");
    });

    it("sets contentJSON to null by default", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Empty Doc", null);
      expect(store.docs[0]?.contentJSON).toBeNull();
    });

    it("sets valid createdAt and updatedAt timestamps", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const before = Date.now();
      await store.createDoc("Timestamped", null);
      const after = Date.now();
      const doc = store.docs[0];
      expect(doc?.createdAt).toBeGreaterThanOrEqual(before);
      expect(doc?.createdAt).toBeLessThanOrEqual(after);
      expect(doc?.updatedAt).toBe(doc?.createdAt);
    });

    it("throws on duplicate title within the same folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Dup", null);
      await expect(store.createDoc("Dup", null)).rejects.toThrow("already exists");
    });

    it("is case-insensitive for duplicate detection", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Report", null);
      await expect(store.createDoc("REPORT", null)).rejects.toThrow("already exists");
    });

    it("allows duplicate titles in different folders", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Same", "folder-1");
      await store.createDoc("Same", "folder-2");
      expect(store.docs).toHaveLength(2);
    });
  });

  // ─────────────────────────────────────────────
  // getDoc
  // ─────────────────────────────────────────────
  describe("getDoc", () => {
    it("returns the doc for a known id", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("Known", null);
      const result = await store.getDoc(id);
      expect(result?.title).toBe("Known");
    });

    it("returns undefined for an unknown id", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const result = await store.getDoc("no-such-id");
      expect(result).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────
  // updateDoc
  // ─────────────────────────────────────────────
  describe("updateDoc", () => {
    it("updates the title in the DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("Original", null);
      await store.updateDoc(id, { title: "Renamed" });
      const row = await db.docs.get(id);
      expect(row?.title).toBe("Renamed");
    });

    it("updates contentJSON in the DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("Doc", null);
      const content = { type: "doc", content: [{ type: "paragraph" }] };
      await store.updateDoc(id, { contentJSON: content });
      const row = await db.docs.get(id);
      expect(row?.contentJSON).toStrictEqual(content);
    });

    it("deep-clones contentJSON (does not store a live reference)", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("Doc", null);
      const content: Record<string, unknown> = { type: "doc", content: [] };
      await store.updateDoc(id, { contentJSON: content });
      // mutate original object after save
      content["type"] = "mutated";
      const row = await db.docs.get(id);
      expect(row?.contentJSON?.type).toBe("doc");
    });

    it("sets contentJSON to null when passed null", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("Doc", null);
      await store.updateDoc(id, { contentJSON: { type: "doc", content: [] } });
      await store.updateDoc(id, { contentJSON: null });
      const row = await db.docs.get(id);
      expect(row?.contentJSON).toBeNull();
    });

    it("bumps updatedAt on every update", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("Doc", null);
      const original = await db.docs.get(id);
      const before = original?.updatedAt ?? 0;
      await new Promise((resolve) => setTimeout(resolve, 2));
      await store.updateDoc(id, { title: "Changed" });
      const row = await db.docs.get(id);
      expect(row?.updatedAt).toBeGreaterThan(before);
    });

    it("does not mutate unrelated fields when only title is updated", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("Doc", null);
      const content = { type: "doc", content: [] };
      await store.updateDoc(id, { contentJSON: content });
      await store.updateDoc(id, { title: "New Title" });
      const row = await db.docs.get(id);
      expect(row?.contentJSON).toStrictEqual(content);
      expect(row?.folderId).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // deleteDoc
  // ─────────────────────────────────────────────
  describe("deleteDoc", () => {
    it("removes the doc from state and DB", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const id = await store.createDoc("ToDelete", null);
      await store.deleteDoc(id);
      expect(store.docs).toHaveLength(0);
      const row = await db.docs.get(id);
      expect(row).toBeUndefined();
    });

    it("refreshes state via loadDocs after deletion", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Keep", null);
      const removeId = await store.createDoc("Remove", null);
      await store.deleteDoc(removeId);
      expect(store.docs).toHaveLength(1);
      expect(store.docs[0]?.title).toBe("Keep");
    });

    it("does not throw for a non-existent id", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await expect(store.deleteDoc("ghost-id")).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // deleteDocsByFolder
  // ─────────────────────────────────────────────
  describe("deleteDocsByFolder", () => {
    it("bulk-deletes all docs belonging to the given folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Doc A", "folder-1");
      await store.createDoc("Doc B", "folder-1");
      await store.deleteDocsByFolder("folder-1");
      const remaining = await db.docs.toArray();
      expect(remaining).toHaveLength(0);
    });

    it("does not delete docs from other folders", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Safe Doc", "folder-2");
      await store.deleteDocsByFolder("folder-1");
      const remaining = await db.docs.toArray();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.title).toBe("Safe Doc");
    });

    it("is safe to call on a folder with no docs", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await expect(store.deleteDocsByFolder("empty-folder")).resolves.not.toThrow();
    });
  });

  describe("moveDoc", () => {
    it("moves a document to a new target folder", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      const docId = await store.createDoc("Design Spec", null);
      await store.moveDoc(docId, "folder-456");
      const doc = store.docs.find((d) => d.id === docId);
      expect(doc?.folderId).toBe("folder-456");
    });

    it("throws when moving to a destination with duplicate doc title", async () => {
      expect.hasAssertions();
      await freshDb();
      setActivePinia(createPinia());
      const store = useDocsStore();
      await store.createDoc("Architecture", "folder-456");
      const docId = await store.createDoc("Architecture", null);
      await expect(store.moveDoc(docId, "folder-456")).rejects.toThrow("already exists");
    });
  });
});

