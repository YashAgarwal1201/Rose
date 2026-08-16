// src/__tests__/stores/activity.store.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createPinia, setActivePinia } from "pinia";
import db from "../../db";
import { useActivityStore } from "../../stores/activity";

async function freshDb(): Promise<void> {
  db.close();
  globalThis.indexedDB = new IDBFactory();
  await db.open();
}

describe("activityStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await freshDb();
    await db.activity.clear();
  });

  // ─────────────────────────────────────────────
  // record
  // ─────────────────────────────────────────────
  describe("record", () => {
    it("adds an activity entry to the DB", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      await store.record("note_created", "entity-1");
      const entries = await db.activity.toArray();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.type).toBe("note_created");
      expect(entries[0]?.entityId).toBe("entity-1");
    });

    it("assigns a unique id and timestamp to each entry", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      const before = Date.now();
      await store.record("doc_created", "entity-2");
      const entries = await db.activity.toArray();
      expect(entries[0]?.id).toBe(true);
      expect(entries[0]?.timestamp).toBeGreaterThanOrEqual(before);
    });

    it("always logs non-session-capped actions (e.g. note_created)", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      await store.record("note_created", "entity-1");
      await store.record("note_created", "entity-1");
      await store.record("note_created", "entity-1");
      const entries = await db.activity.toArray();
      expect(entries).toHaveLength(3);
    });

    it("deduplicates session-capped actions (doc_updated) within 15-min window", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      await store.record("doc_updated", "entity-1");
      await store.record("doc_updated", "entity-1");
      const entries = await db.activity.toArray();
      expect(entries).toHaveLength(1);
    });

    it("deduplicates session-capped actions (todo_updated) within 15-min window", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      await store.record("todo_updated", "entity-1");
      await store.record("todo_updated", "entity-1");
      const entries = await db.activity.toArray();
      expect(entries).toHaveLength(1);
    });

    it("logs a fresh entry after the session window expires (simulated via direct DB insert)", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      // Insert an entry with a timestamp older than the 15-minute window
      const oldTimestamp = Date.now() - (15 * 60 * 1000 + 1);
      await db.activity.add({
        entityId: "entity-1",
        id: crypto.randomUUID(),
        timestamp: oldTimestamp,
        type: "doc_updated",
      });
      // A new record for the same entity/type should succeed since the old one is outside the window
      await store.record("doc_updated", "entity-1");
      const entries = await db.activity.toArray();
      expect(entries).toHaveLength(2);
    });

    it("does not deduplicate the same action type across different entities", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      await store.record("doc_updated", "entity-1");
      await store.record("doc_updated", "entity-2");
      const entries = await db.activity.toArray();
      expect(entries).toHaveLength(2);
    });
  });

  // ─────────────────────────────────────────────
  // getEntriesSince
  // ─────────────────────────────────────────────
  describe("getEntriesSince", () => {
    it("returns entries at or after the given timestamp", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      // Insert an old entry directly
      const oldTimestamp = Date.now() - 10_000;
      await db.activity.add({
        entityId: "old-entity",
        id: crypto.randomUUID(),
        timestamp: oldTimestamp,
        type: "note_created",
      });
      const cutoff = Date.now() - 1;
      // Insert a new entry via store
      await store.record("note_created", "new-entity");
      const result = await store.getEntriesSince(cutoff);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((e) => e.entityId === "new-entity")).toBeTruthy();
    });

    it("returns empty array when no entries exist after timestamp", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      await store.record("note_created", "entity-1");
      const future = Date.now() + 100_000;
      const result = await store.getEntriesSince(future);
      expect(result).toHaveLength(0);
    });

    it("returns all entries when timestamp is 0", async () => {
      expect.hasAssertions();
      const store = useActivityStore();
      await store.record("note_created", "entity-1");
      await store.record("doc_created", "entity-2");
      const result = await store.getEntriesSince(0);
      expect(result).toHaveLength(2);
    });
  });
});
