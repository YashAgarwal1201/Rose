// src/__tests__/stores/notes.store.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import { useNotesStore } from "../../stores/notes";

// Mock the activity store so note creation/update doesn't fail
vi.mock("../../stores/activity", () => ({
  useActivityStore: () => ({
    record: vi.fn(),
  }),
}));

async function freshDb(): Promise<void> {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

describe("notesStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await freshDb();
    await db.notes.clear();
  });

  // ─────────────────────────────────────────────
  // loadNotes
  // ─────────────────────────────────────────────
  describe("loadNotes", () => {
    it("returns empty state when DB is empty", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.loadNotes();
      expect(store.notes).toHaveLength(0);
    });

    it("loads all notes from DB into state", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Alpha", null);
      await store.createNote("Beta", null);
      // reset state to simulate a fresh page load
      store.notes.splice(0);
      await store.loadNotes();
      expect(store.notes).toHaveLength(2);
    });

    it("reflects the latest DB state on re-load", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Initial", null);
      await store.updateNote(id, { backgroundColor: "#000000" });
      await store.loadNotes();
      const found = store.notes.find((n) => n.id === id);
      expect(found?.backgroundColor).toBe("#000000");
    });
  });

  // ─────────────────────────────────────────────
  // createNote
  // ─────────────────────────────────────────────
  describe("createNote", () => {
    it("creates a note and reflects it in state", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("My Note", null);
      expect(store.notes).toHaveLength(1);
      expect(store.notes[0]?.title).toBe("My Note");
    });

    it("persists the note to the DB", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Persisted", null);
      const rows = await db.notes.toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.title).toBe("Persisted");
    });

    it("trims whitespace from the title", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("  Trimmed  ", null);
      expect(store.notes[0]?.title).toBe("Trimmed");
    });

    it("falls back to 'Untitled' for a blank title", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("   ", null);
      expect(store.notes[0]?.title).toBe("Untitled");
    });

    it("sets folderId correctly on the created note", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("In Folder", "folder-abc");
      expect(store.notes[0]?.folderId).toBe("folder-abc");
    });

    it("sets canvasJSON to null by default", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Empty Note", null);
      expect(store.notes[0]?.canvasJSON).toBeNull();
    });

    it("sets default background to white", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Note", null);
      expect(store.notes[0]?.backgroundColor).toBe("#ffffff");
    });

    it("sets valid createdAt and updatedAt timestamps", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const before = Date.now();
      await store.createNote("Timestamped", null);
      const after = Date.now();
      const note = store.notes[0];
      expect(note?.createdAt).toBeGreaterThanOrEqual(before);
      expect(note?.createdAt).toBeLessThanOrEqual(after);
      expect(note?.updatedAt).toBe(note?.createdAt);
    });

    it("throws on duplicate title within the same folder", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Dup", null);
      await expect(store.createNote("Dup", null)).rejects.toThrow("already exists");
    });

    it("is case-insensitive for duplicate detection", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Sketch", null);
      await expect(store.createNote("SKETCH", null)).rejects.toThrow("already exists");
    });

    it("allows duplicate titles in different folders", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Same", "folder-1");
      await store.createNote("Same", "folder-2");
      expect(store.notes).toHaveLength(2);
    });

    it("returns the new note's id", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("ID Check", null);
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────
  // getNote
  // ─────────────────────────────────────────────
  describe("getNote", () => {
    it("returns the note for a known id", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Known", null);
      const result = await store.getNote(id);
      expect(result?.title).toBe("Known");
    });

    it("returns undefined for an unknown id", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const result = await store.getNote("no-such-id");
      expect(result).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────
  // touchNote
  // ─────────────────────────────────────────────
  describe("touchNote", () => {
    it("updates lastOpenedAt to current time", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Touch Me", null);
      const before = Date.now();
      await store.touchNote(id);
      const note = await store.getNote(id);
      expect(note?.lastOpenedAt).toBeGreaterThanOrEqual(before);
    });
  });

  // ─────────────────────────────────────────────
  // updateNote
  // ─────────────────────────────────────────────
  describe("updateNote", () => {
    it("updates the title in the DB", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Original", null);
      await store.updateNote(id, { title: "Renamed" });
      const row = await db.notes.get(id);
      expect(row?.title).toBe("Renamed");
    });

    it("updates canvasJSON in the DB", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Note", null);
      const canvas = { version: "6.0", objects: [] };
      await store.updateNote(id, { canvasJSON: canvas });
      const row = await db.notes.get(id);
      expect(row?.canvasJSON).toEqual(canvas);
    });

    it("deep-clones canvasJSON (does not store a live reference)", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Note", null);
      const canvas: Record<string, unknown> = { version: "6.0", objects: [] };
      await store.updateNote(id, { canvasJSON: canvas });
      // mutate original object after save
      canvas["version"] = "mutated";
      const row = await db.notes.get(id);
      expect(row?.canvasJSON?.version).toBe("6.0");
    });

    it("sets canvasJSON to null when passed null", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Note", null);
      await store.updateNote(id, { canvasJSON: { version: "6.0", objects: [] } });
      await store.updateNote(id, { canvasJSON: null });
      const row = await db.notes.get(id);
      expect(row?.canvasJSON).toBeNull();
    });

    it("updates backgroundColor in the DB", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Note", null);
      await store.updateNote(id, { backgroundColor: "#ff0000" });
      const row = await db.notes.get(id);
      expect(row?.backgroundColor).toBe("#ff0000");
    });

    it("bumps updatedAt on every update", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("Note", null);
      const original = await db.notes.get(id);
      const before = original?.updatedAt ?? 0;
      await new Promise((resolve) => setTimeout(resolve, 2));
      await store.updateNote(id, { title: "Changed" });
      const row = await db.notes.get(id);
      expect(row?.updatedAt).toBeGreaterThan(before);
    });
  });

  // ─────────────────────────────────────────────
  // deleteNote
  // ─────────────────────────────────────────────
  describe("deleteNote", () => {
    it("removes the note from state and DB", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      const id = await store.createNote("ToDelete", null);
      await store.deleteNote(id);
      expect(store.notes).toHaveLength(0);
      const row = await db.notes.get(id);
      expect(row).toBeUndefined();
    });

    it("refreshes state via loadNotes after deletion", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Keep", null);
      const removeId = await store.createNote("Remove", null);
      await store.deleteNote(removeId);
      expect(store.notes).toHaveLength(1);
      expect(store.notes[0]?.title).toBe("Keep");
    });

    it("does not throw for a non-existent id", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await expect(store.deleteNote("ghost-id")).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // deleteNotesByFolder
  // ─────────────────────────────────────────────
  describe("deleteNotesByFolder", () => {
    it("bulk-deletes all notes belonging to the given folder", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Note A", "folder-1");
      await store.createNote("Note B", "folder-1");
      await store.deleteNotesByFolder("folder-1");
      const remaining = await db.notes.toArray();
      expect(remaining).toHaveLength(0);
    });

    it("does not delete notes from other folders", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await store.createNote("Safe Note", "folder-2");
      await store.deleteNotesByFolder("folder-1");
      const remaining = await db.notes.toArray();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.title).toBe("Safe Note");
    });

    it("is safe to call on a folder with no notes", async () => {
      expect.hasAssertions();
      const store = useNotesStore();
      await expect(store.deleteNotesByFolder("empty-folder")).resolves.not.toThrow();
    });
  });
});
