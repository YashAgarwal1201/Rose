import { afterEach, beforeEach, describe, expect, it } from "vitest";
import db from "@/db/index";
import type { Folder } from "@/db/types";

describe("db/index.ts", () => {
  beforeEach(async () => {
    // Clear all tables before each test to ensure a clean slate
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  afterEach(async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it("should initialize the database with correct tables", () => {
    expect.hasAssertions();
    expect(db.name).toBe("RoseDatabase");
    
    // Verify that all expected tables are present
    const tableNames = db.tables.map(t => t.name);
    expect(tableNames).toContain("folders");
    expect(tableNames).toContain("todoLists");
    expect(tableNames).toContain("todos");
    expect(tableNames).toContain("docs");
    expect(tableNames).toContain("notes");
    expect(tableNames).toContain("settings");
    expect(tableNames).toContain("activity");
  });

  it("should support basic CRUD operations on a store", async () => {
    expect.hasAssertions();
    
    const newFolder: Folder = {
      id: "folder-1",
      parentId: "root",
      name: "Test Folder",
      type: "mixed",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Create
    await db.folders.add(newFolder);
    const count = await db.folders.count();
    expect(count).toBe(1);

    // Read
    const fetched = await db.folders.get("folder-1");
    expect(fetched).toEqual(newFolder);

    // Update
    await db.folders.update("folder-1", { name: "Updated Folder" });
    const updated = await db.folders.get("folder-1");
    expect(updated?.name).toBe("Updated Folder");

    // Delete
    await db.folders.delete("folder-1");
    const newCount = await db.folders.count();
    expect(newCount).toBe(0);
  });
});
