import { describe, expect, it } from "vitest";
import { importData, summarisePayload, validatePayload } from "@/utils/importData";
import type { ExportPayload } from "@/utils/exportData";
import { IDBFactory } from "fake-indexeddb";
import db from "@/db";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeValidPayload(overrides: Partial<ExportPayload> = {}): ExportPayload {
  return {
    data: {
      docs: [{ id: "doc1", folderId: null, title: "Test Doc", contentJSON: null, createdAt: 1, updatedAt: 1, isVaulted: false, iv: null, lastOpenedAt: null }],
      folders: [],
      notes: [],
      settings: [],
      todoLists: [],
      todos: [],
    },
    exportDate: "2026-01-01T00:00:00.000Z",
    version: 7,
    ...overrides,
  };
}

// ─── validatePayload ───────────────────────────────────────────────────────────

describe("validatePayload", () => {
  it("accepts a well-formed v7 payload", () => {
    const payload = makeValidPayload({ version: 7 });
    expect(() => validatePayload(payload)).not.toThrow();
    expect(validatePayload(payload).version).toBe(7);
  });

  it("accepts a well-formed v8 and v9 payload", () => {
    const v8 = makeValidPayload({ version: 8 });
    expect(() => validatePayload(v8)).not.toThrow();
    expect(validatePayload(v8).version).toBe(8);

    const v9 = makeValidPayload({ version: 9 });
    expect(() => validatePayload(v9)).not.toThrow();
    expect(validatePayload(v9).version).toBe(9);
  });

  it("throws when passed null", () => {
    expect(() => validatePayload(null)).toThrow("not a JSON object");
  });

  it("throws when passed an array", () => {
    expect(() => validatePayload([])).toThrow("not a JSON object");
  });

  it("throws when version is missing", () => {
    const raw = { exportDate: "2026-01-01T00:00:00.000Z", data: {} };
    expect(() => validatePayload(raw)).toThrow("missing version field");
  });

  it("throws for unsupported version numbers", () => {
    const raw = { version: 3, exportDate: "2026-01-01T00:00:00.000Z", data: {} };
    expect(() => validatePayload(raw)).toThrow("Unsupported backup version 3");

    const raw10 = { version: 10, exportDate: "2026-01-01T00:00:00.000Z", data: {} };
    expect(() => validatePayload(raw10)).toThrow("Unsupported backup version 10");
  });

  it("throws when exportDate is missing", () => {
    const raw = { version: 7, data: {} };
    expect(() => validatePayload(raw)).toThrow("missing exportDate field");
  });

  it("throws when data is missing", () => {
    const raw = { version: 7, exportDate: "2026-01-01T00:00:00.000Z" };
    expect(() => validatePayload(raw)).toThrow("missing data object");
  });

  it("throws when data is null", () => {
    const raw = { version: 7, exportDate: "2026-01-01T00:00:00.000Z", data: null };
    expect(() => validatePayload(raw)).toThrow("missing data object");
  });
});

// ─── summarisePayload ─────────────────────────────────────────────────────────

describe("summarisePayload", () => {
  it("counts items in each category", () => {
    const payload = makeValidPayload({
      data: {
        docs: [
          { id: "d1", folderId: null, title: "D1", contentJSON: null, createdAt: 1, updatedAt: 1, isVaulted: false, iv: null, lastOpenedAt: null },
          { id: "d2", folderId: null, title: "D2", contentJSON: null, createdAt: 1, updatedAt: 1, isVaulted: false, iv: null, lastOpenedAt: null },
        ],
        notes: [
          { id: "n1", folderId: null, title: "N1", canvasJSON: null, backgroundColor: "#fff", backgroundPattern: "solid", thumbnail: null, createdAt: 1, updatedAt: 1, isVaulted: false, iv: null, lastOpenedAt: null },
        ],
        todos: [
          { id: "t1", listId: "l1", title: "Buy milk", done: false, priority: null, dueDate: null, createdAt: 1, updatedAt: 1, isVaulted: false, iv: null },
        ],
        todoLists: [
          { id: "l1", folderId: null, name: "Groceries", createdAt: 1, updatedAt: 1, isVaulted: false, iv: null, lastOpenedAt: null },
        ],
        folders: [
          { id: "f1", name: "Personal", parentId: null, type: "doc", createdAt: 1, updatedAt: 1, isVaulted: false, iv: null },
          { id: "f2", name: "Work", parentId: null, type: "doc", createdAt: 1, updatedAt: 1, isVaulted: false, iv: null },
        ],
        activity: [],
        settings: [],
      },
    });

    const summary = summarisePayload(payload);

    expect(summary.docs).toBe(2);
    expect(summary.notes).toBe(1);
    expect(summary.todos).toBe(1);
    expect(summary.todoLists).toBe(1);
    expect(summary.folders).toBe(2);
    expect(summary.activity).toBe(0);
    expect(summary.settings).toBe(0);
  });

  it("handles empty data gracefully (all zeros)", () => {
    const payload = makeValidPayload({ data: {} });
    const summary = summarisePayload(payload);

    expect(summary.docs).toBe(0);
    expect(summary.notes).toBe(0);
    expect(summary.todos).toBe(0);
    expect(summary.todoLists).toBe(0);
    expect(summary.folders).toBe(0);
    expect(summary.activity).toBe(0);
    expect(summary.settings).toBe(0);
  });

  it("preserves exportDate and version", () => {
    const payload = makeValidPayload({ exportDate: "2025-06-15T10:00:00.000Z", version: 7 });
    const summary = summarisePayload(payload);
    expect(summary.exportDate).toBe("2025-06-15T10:00:00.000Z");
    expect(summary.version).toBe(7);
  });
});

// ─── importData migration ─────────────────────────────────────────────────────

describe("importData migration", () => {
  it("backfills isVaulted and backgroundPattern when importing v7 payload", async () => {
    db.close();
    globalThis.indexedDB = new IDBFactory();
    await db.open();

    const v7Payload: ExportPayload = {
      version: 7,
      exportDate: "2025-01-01T00:00:00.000Z",
      data: {
        folders: [{ id: "f1", name: "Folder 1", parentId: null, type: "mixed", createdAt: 1, updatedAt: 1 } as any],
        notes: [{ id: "n1", folderId: "f1", title: "Note 1", canvasJSON: null, backgroundColor: "#fff", thumbnail: null, createdAt: 1, updatedAt: 1 } as any],
        docs: [{ id: "d1", folderId: "f1", title: "Doc 1", contentJSON: null, createdAt: 1, updatedAt: 1, lastOpenedAt: null } as any],
        todoLists: [{ id: "l1", folderId: "f1", name: "List 1", createdAt: 1, updatedAt: 1, lastOpenedAt: null } as any],
        todos: [{ id: "t1", listId: "l1", title: "Todo 1", done: false, priority: null, dueDate: null, createdAt: 1, updatedAt: 1 } as any],
      },
    };

    const res = await importData(v7Payload, {
      settings: false,
      notes: true,
      docs: true,
      todos: true,
      activity: false,
      mode: "merge",
    });

    expect(res.success).toBe(true);

    const folder = await db.folders.get("f1");
    expect(folder?.isVaulted).toBe(false);
    expect(folder?.iv).toBeNull();

    const note = await db.notes.get("n1");
    expect(note?.isVaulted).toBe(false);
    expect(note?.backgroundPattern).toBe("solid");

    const doc = await db.docs.get("d1");
    expect(doc?.isVaulted).toBe(false);

    const list = await db.todoLists.get("l1");
    expect(list?.isVaulted).toBe(false);

    const todo = await db.todos.get("t1");
    expect(todo?.isVaulted).toBe(false);
  });
});

