import { describe, expect, it } from "vitest";
import { summarisePayload, validatePayload } from "@/utils/importData";
import type { ExportPayload } from "@/utils/exportData";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeValidPayload(overrides: Partial<ExportPayload> = {}): ExportPayload {
  return {
    data: {
      docs: [{ id: "doc1", folderId: null, title: "Test Doc", contentJSON: null, createdAt: 1, updatedAt: 1, lastOpenedAt: null }],
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
    const payload = makeValidPayload();
    expect(() => validatePayload(payload)).not.toThrow();
    expect(validatePayload(payload).version).toBe(7);
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
          { id: "d1", folderId: null, title: "D1", contentJSON: null, createdAt: 1, updatedAt: 1, lastOpenedAt: null },
          { id: "d2", folderId: null, title: "D2", contentJSON: null, createdAt: 1, updatedAt: 1, lastOpenedAt: null },
        ],
        notes: [
          { id: "n1", folderId: null, title: "N1", canvasJSON: null, backgroundColor: "#fff", thumbnail: null, createdAt: 1, updatedAt: 1, lastOpenedAt: null },
        ],
        todos: [
          { id: "t1", listId: "l1", title: "Buy milk", done: false, priority: null, dueDate: null, createdAt: 1, updatedAt: 1 },
        ],
        todoLists: [
          { id: "l1", folderId: null, name: "Groceries", createdAt: 1, updatedAt: 1, lastOpenedAt: null },
        ],
        folders: [
          { id: "f1", name: "Personal", parentId: null, type: "doc", createdAt: 1, updatedAt: 1 },
          { id: "f2", name: "Work", parentId: null, type: "doc", createdAt: 1, updatedAt: 1 },
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
